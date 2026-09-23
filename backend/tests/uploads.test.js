import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';

let mongod;
let institution;
let otherInstitution;
let studentToken;
let facultyToken;
let assignmentId;
let otherAssignmentId;
let subjectId;
const createdFiles = [];

const trackFiles = (res) => {
  const url = res.body?.data?.fileUrl;
  if (typeof url === 'string' && url.startsWith('/uploads/')) {
    createdFiles.push(path.join(process.cwd(), 'uploads', path.basename(url)));
  }
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  institution = await Institution.create({ name: 'Upload Institute', code: 'UPT', emailDomainPattern: 'upload.test' });
  otherInstitution = await Institution.create({ name: 'Other Institute', code: 'UPTO', emailDomainPattern: 'other.test' });

  const dept = await Department.create({ name: 'CS', code: 'CSE', institution: institution._id });
  const course = await Course.create({
    name: 'BTech', code: 'BT101', department: dept._id,
    institution: institution._id, durationYears: 4, totalSemesters: 8
  });
  const { SubjectModel: Subject } = await import('../models/SubjectModel.js');
  const subj = await Subject.create({
    institution: institution._id, course: course._id, code: 'UP101', name: 'Upload Subject', semester: 1, credits: 3
  });
  subjectId = subj._id;

  await User.create({
    name: 'Upload Student', email: 'upstudent@test.edu', password: 'Student@123',
    role: 'student', institution: institution._id, isEmailVerified: true, isActive: true
  });
  await User.create({
    name: 'Upload Faculty', email: 'upfaculty@test.edu', password: 'Faculty@123',
    role: 'faculty', institution: institution._id, isEmailVerified: true, isActive: true
  });

  const { AssignmentModel: Assignment } = await import('../models/AssignmentModel.js');
  const faculty = await User.findOne({ email: 'upfaculty@test.edu' });
  const due = new Date(Date.now() + 86400000);
  const a = await Assignment.create({
    institution: institution._id, subject: subjectId, title: 'File Assignment',
    description: 'd', maxScore: 100, dueDate: due, status: 'published', createdBy: faculty._id
  });
  assignmentId = a._id;
  const other = await Assignment.create({
    institution: otherInstitution._id, subject: subjectId, title: 'Foreign Assignment',
    description: 'd', maxScore: 100, dueDate: due, status: 'published', createdBy: faculty._id
  });
  otherAssignmentId = other._id;

  studentToken = (await request(app).post('/api/v1/auth/login')
    .send({ email: 'upstudent@test.edu', password: 'Student@123' })).body.accessToken;
  facultyToken = (await request(app).post('/api/v1/auth/login')
    .send({ email: 'upfaculty@test.edu', password: 'Faculty@123' })).body.accessToken;
});

afterAll(async () => {
  await Promise.allSettled(createdFiles.map((f) => fs.promises.unlink(f).catch(() => {})));
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Assignment file submissions (multipart)', () => {
  it('student submits a PDF with comments', async () => {
    const res = await request(app)
      .post(`/api/v1/submissions/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .field('comments', 'My solution attached')
      .field('studentId', 'someone-else-id')
      .attach('file', Buffer.from('%PDF-1.4 solution'), 'solution.pdf');
    expect(res.status).toBe(201);
    expect(res.body.data.fileUrl).toMatch(/^\/uploads\//);
    expect(res.body.data.textNotes).toBe('My solution attached');
    expect(res.body.data.status).toBe('submitted');
    expect(res.body.data.attempt).toBe(1);
    trackFiles(res);
  });

  it('resubmission updates the same record and bumps attempt', async () => {
    const res = await request(app)
      .post(`/api/v1/submissions/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .field('comments', 'Revised solution')
      .attach('file', Buffer.from('%PDF-1.4 revised'), 'revised.pdf');
    expect(res.status).toBe(201);
    expect(res.body.data.attempt).toBe(2);
    trackFiles(res);
  });

  it('accepts comments-only submission without a file', async () => {
    const res = await request(app)
      .post(`/api/v1/submissions/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .field('comments', 'https://example.com/my-work');
    expect(res.status).toBe(201);
    expect(res.body.data.textNotes).toBe('https://example.com/my-work');
  });

  it('rejects empty submissions', async () => {
    const res = await request(app)
      .post(`/api/v1/submissions/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .field('comments', '   ');
    expect(res.status).toBe(422);
  });

  it('rejects cross-tenant assignments', async () => {
    const res = await request(app)
      .post(`/api/v1/submissions/assignments/${otherAssignmentId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .field('comments', 'hello')
      .attach('file', Buffer.from('x'), 'a.pdf');
    expect(res.status).toBe(404);
  });

  it('forbids faculty from the student route', async () => {
    const res = await request(app)
      .post(`/api/v1/submissions/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .field('comments', 'hello');
    expect(res.status).toBe(403);
  });

  it('rejects unsupported file types with 415', async () => {
    const res = await request(app)
      .post(`/api/v1/submissions/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('file', Buffer.from('MZ'), 'evil.exe');
    expect(res.status).toBe(415);
  });

  it('rejects oversized files with 413', async () => {
    const res = await request(app)
      .post(`/api/v1/submissions/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('file', Buffer.alloc(11 * 1024 * 1024, 'a'), 'big.pdf');
    expect(res.status).toBe(413);
  }, 30000);
});

describe('Learning resource attachments', () => {
  it('faculty uploads a PDF attachment', async () => {
    const res = await request(app)
      .post('/api/v1/study/learning-resources')
      .set('Authorization', `Bearer ${facultyToken}`)
      .field('subject', String(subjectId))
      .field('topic', 'Files')
      .field('title', 'Lecture notes')
      .attach('file', Buffer.from('%PDF-1.4 notes'), 'notes.pdf');
    expect(res.status).toBe(201);
    expect(res.body.data.fileUrl).toMatch(/^\/uploads\//);
    expect(res.body.data.type).toBe('document');
    trackFiles(res);
  });

  it('rejects attachment-less url-less resources', async () => {
    const res = await request(app)
      .post('/api/v1/study/learning-resources')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ subject: subjectId, topic: 'T', title: 'Empty' });
    expect(res.status).toBe(422);
  });

  it('forbids students from posting resources', async () => {
    const res = await request(app)
      .post('/api/v1/study/learning-resources')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ subject: subjectId, topic: 'T', title: 'Nope', url: 'https://example.com/x' });
    expect(res.status).toBe(403);
  });
});
