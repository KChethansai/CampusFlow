// contracts.test: compact business-critical API contract suite.
// Representative high-risk endpoints only: status + major response shape.
// Not an inventory of every route.
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { CompanyModel as Company } from '../models/CompanyModel.js';
import { JobDriveModel as JobDrive } from '../models/JobDriveModel.js';
import { NotificationModel as Notification } from '../models/NotificationModel.js';

jest.setTimeout(60000);

let mongod;
let studentToken, facultyToken;
let assignment, drive;

const login = async (email, password = 'Password@123') =>
  (await request(app).post('/api/v1/auth/login').send({ email, password })).body.accessToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const inst = await Institution.create({ name: 'Contract Inst', code: 'CTR', emailDomainPattern: 'ctr.edu' });
  const dept = await Department.create({ name: 'CSE', code: 'CCTR', institution: inst._id });
  const course = await Course.create({ name: 'B CSE', code: 'BCCTR', department: dept._id, institution: inst._id, durationYears: 4, totalSemesters: 8 });
  const mk = (over) => User.create({ password: 'Password@123', isEmailVerified: true, isActive: true, ...over });
  const faculty = await mk({ name: 'Fac', email: 'fac@ctr.edu', role: 'faculty', institution: inst._id, department: dept._id });
  await mk({
    name: 'Stu', email: 'stu@ctr.edu', role: 'student', institution: inst._id, department: dept._id,
    profile: { rollNumber: 'CTR001', semester: 5, cgpa: 8.5, backlogs: 0 },
  });
  const subject = await Subject.create({ name: 'OS', code: 'COS301', course: course._id, institution: inst._id, semester: 5, faculty: faculty._id });
  assignment = await Assignment.create({
    subject: subject._id, title: 'Lab 1', description: 'x', maxScore: 100,
    dueDate: new Date(Date.now() + 86400000), createdBy: faculty._id, institution: inst._id, status: 'open',
  });
  const company = await Company.create({ name: 'Tech Corp', institution: inst._id });
  drive = await JobDrive.create({
    company: company._id, institution: inst._id, role: 'SDE',
    applicationDeadline: new Date(Date.now() + 86400000), status: 'active',
  });
  const stuDoc = await User.findOne({ email: 'stu@ctr.edu' });
  await Notification.create({ recipient: stuDoc._id, title: 'Hello', message: 'world', category: 'system' });

  studentToken = await login('stu@ctr.edu');
  facultyToken = await login('fac@ctr.edu');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('critical contracts', () => {
  it('GET /auth/me returns { success, user } with no password', async () => {
    const res = await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('stu@ctr.edu');
    expect(res.body.user.password).toBeUndefined();
  });

  it('PATCH /users/me/onboarding completes with { success, data }', async () => {
    const res = await request(app).patch('/api/v1/users/me/onboarding')
      .set('Authorization', `Bearer ${studentToken}`).send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.data.onboardingCompleted).toBe(true);
  });

  it('GET /attendance returns a paged list shape', async () => {
    const res = await request(app).get('/api/v1/attendance')
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('GET /submissions returns a scoped list for the student', async () => {
    const res = await request(app).get('/api/v1/submissions')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('request flow: student creates, faculty lists with paged shape', async () => {
    const created = await request(app).post('/api/v1/requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ type: 'bonafide', title: 'Need bonafide', description: 'for bank' });
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('pending');
    const listed = await request(app).get('/api/v1/requests')
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(listed.status).toBe(200);
    expect(Array.isArray(listed.body.data)).toBe(true);
  });

  it('placement flow: student applies once (201), duplicate rejected (409)', async () => {
    const first = await request(app).post('/api/v1/job-applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ drive: String(drive._id) });
    expect(first.status).toBe(201);
    const dup = await request(app).post('/api/v1/job-applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ drive: String(drive._id) });
    expect(dup.status).toBe(409);
  });

  it('notification flow: student lists own notifications', async () => {
    const res = await request(app).get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('draft assignment blocks submissions (workflow guard)', async () => {
    const fac = await User.findOne({ email: 'fac@ctr.edu' });
    const draft = await Assignment.create({
      subject: assignment.subject, title: 'Draft', description: 'x', maxScore: 50,
      dueDate: new Date(Date.now() + 86400000), createdBy: fac._id,
      institution: fac.institution, status: 'draft',
    });
    const res = await request(app).post(`/api/v1/submissions/assignments/${draft._id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('file', Buffer.from('%PDF-1.4 draft attempt'), { filename: 'work.pdf', contentType: 'application/pdf' });
    expect([400, 403]).toContain(res.status);
  });
});
