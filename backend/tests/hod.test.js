// hod.test: Head of Department role — department-scoped access.
// - hod reads/manages own-department subject + assignment data
// - hod blocked from other-department data (404, no leakage)
// - hod blocked from /institutions writes and user role changes (403)
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
import { RequestModel as Request } from '../models/RequestModel.js';

jest.setTimeout(30000);

let mongod;
let inst;
let deptCSE;
let deptECE;
let subjectCSE;
let subjectECE;
let assignmentCSE;
let assignmentECE;
let requestCSE;
let requestECE;
let studentCSE;
let hodToken;

const login = async (email, password = 'Password@123') => {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.accessToken;
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  inst = await Institution.create({ name: 'HOD Inst', code: 'HI', contactEmail: 'hi@t.edu', emailDomainPattern: 't.edu' });
  deptCSE = await Department.create({ name: 'CSE', code: 'CSE', institution: inst._id });
  deptECE = await Department.create({ name: 'ECE', code: 'ECE', institution: inst._id });
  const courseCSE = await Course.create({ name: 'B CSE', code: 'BCSE', department: deptCSE._id, institution: inst._id, durationYears: 4, totalSemesters: 8 });
  const courseECE = await Course.create({ name: 'B ECE', code: 'BECE', department: deptECE._id, institution: inst._id, durationYears: 4, totalSemesters: 8 });

  const mk = (over) => User.create({ password: 'Password@123', isEmailVerified: true, isActive: true, ...over });
  const hod = await mk({ name: 'HOD CSE', email: 'hod.cse@t.edu', role: 'hod', institution: inst._id, department: deptCSE._id });
  studentCSE = await mk({ name: 'Student CSE', email: 's.cse@t.edu', role: 'student', institution: inst._id, department: deptCSE._id });
  const studentECE = await mk({ name: 'Student ECE', email: 's.ece@t.edu', role: 'student', institution: inst._id, department: deptECE._id });

  subjectCSE = await Subject.create({ institution: inst._id, course: courseCSE._id, code: 'CS101', name: 'Own Dept Subject', semester: 4 });
  subjectECE = await Subject.create({ institution: inst._id, course: courseECE._id, code: 'EC101', name: 'Other Dept Subject Unlisted', semester: 4 });

  assignmentCSE = await Assignment.create({ institution: inst._id, subject: subjectCSE._id, title: 'CSE task', status: 'open', dueDate: new Date(Date.now() + 86400000), createdBy: hod._id });
  assignmentECE = await Assignment.create({ institution: inst._id, subject: subjectECE._id, title: 'ECE task', status: 'open', dueDate: new Date(Date.now() + 86400000), createdBy: hod._id });

  requestCSE = await Request.create({ institution: inst._id, student: studentCSE._id, department: deptCSE._id, type: 'leave', title: 'CSE leave', status: 'pending' });
  requestECE = await Request.create({ institution: inst._id, student: studentECE._id, department: deptECE._id, type: 'leave', title: 'ECE leave', status: 'pending' });

  hodToken = await login('hod.cse@t.edu');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('hod department scoping', () => {
  it('lists only own-department subjects', async () => {
    const res = await request(app).get('/api/v1/subjects').set('Authorization', `Bearer ${hodToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((s) => String(s._id));
    expect(ids).toContain(String(subjectCSE._id));
    expect(ids).not.toContain(String(subjectECE._id));
  });

  it('reads own-department subject, blocked from other-department subject without leakage', async () => {
    const own = await request(app).get(`/api/v1/subjects/${subjectCSE._id}`).set('Authorization', `Bearer ${hodToken}`);
    expect(own.status).toBe(200);

    const other = await request(app).get(`/api/v1/subjects/${subjectECE._id}`).set('Authorization', `Bearer ${hodToken}`);
    expect(other.status).toBe(404);
    expect(other.body.data).toBeUndefined();
    expect(other.text).not.toContain('Other Dept Subject Unlisted');
  });

  it('reads own-department assignment, blocked from other-department assignment', async () => {
    const own = await request(app).get(`/api/v1/assignments/${assignmentCSE._id}`).set('Authorization', `Bearer ${hodToken}`);
    expect(own.status).toBe(200);

    const other = await request(app).get(`/api/v1/assignments/${assignmentECE._id}`).set('Authorization', `Bearer ${hodToken}`);
    expect(other.status).toBe(404);
    expect(other.body.data).toBeUndefined();
  });

  it('reviews own-department request, blocked from other-department request', async () => {
    const own = await request(app).patch(`/api/v1/requests/${requestCSE._id}/status`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ status: 'in_review' });
    expect(own.status).toBe(200);

    const other = await request(app).patch(`/api/v1/requests/${requestECE._id}/status`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ status: 'in_review' });
    expect(other.status).toBe(404);
  });
});

describe('hod privilege boundaries', () => {
  it('blocked from institution management', async () => {
    const res = await request(app).post('/api/v1/institutions')
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ name: 'Rogue', code: 'ROGUE', contactEmail: 'r@t.edu' });
    expect(res.status).toBe(403);
  });

  it('blocked from changing user roles', async () => {
    const res = await request(app).patch(`/api/v1/users/${studentCSE._id}`)
      .set('Authorization', `Bearer ${hodToken}`)
      .send({ role: 'faculty' });
    expect(res.status).toBe(403);
    expect((await User.findById(studentCSE._id)).role).toBe('student');
  });
});
