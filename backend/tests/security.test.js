// security.test: permanent RBAC / tenant-isolation guard.
// Backend authorization is the source of truth. One representative negative
// case per critical authorization pattern — behavior, not copy.
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
import { JobDriveModel as JobDrive } from '../models/JobDriveModel.js';
import { JobApplicationModel as JobApplication } from '../models/JobApplicationModel.js';
import { CompanyModel as Company } from '../models/CompanyModel.js';

jest.setTimeout(60000);

let mongod;
let studentA1, assignmentA, appA2;
let tStudentA1, tStudentA2, tFacultyA, tHodA, tAdminA, tPlacementA, tFacultyB, tStudentB;

const login = async (email, password = 'Password@123') =>
  (await request(app).post('/api/v1/auth/login').send({ email, password })).body.accessToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const instA = await Institution.create({ name: 'Sec A', code: 'SECA', emailDomainPattern: 'seca.edu' });
  const instB = await Institution.create({ name: 'Sec B', code: 'SECB', emailDomainPattern: 'secb.edu' });
  const deptA1 = await Department.create({ name: 'CS A', code: 'CSSECA', institution: instA._id });
  const deptA2 = await Department.create({ name: 'EE A', code: 'EESECA', institution: instA._id });
  const deptB = await Department.create({ name: 'CS B', code: 'CSSECB', institution: instB._id });
  const courseA = await Course.create({ name: 'B CS A', code: 'BCSA', department: deptA1._id, institution: instA._id, durationYears: 4, totalSemesters: 8 });
  const courseB = await Course.create({ name: 'B CS B', code: 'BCSB', department: deptB._id, institution: instB._id, durationYears: 4, totalSemesters: 8 });

  const mk = (over) => User.create({ password: 'Password@123', isEmailVerified: true, isActive: true, ...over });
  await mk({ name: 'Admin A', email: 'admin@seca.edu', role: 'college_admin', institution: instA._id });
  const facultyA = await mk({ name: 'Fac A', email: 'faca@seca.edu', role: 'faculty', institution: instA._id, department: deptA1._id });
  await mk({ name: 'HOD EE', email: 'hodee@seca.edu', role: 'hod', institution: instA._id, department: deptA2._id });
  studentA1 = await mk({ name: 'Stu A1', email: 'stua1@seca.edu', role: 'student', institution: instA._id, department: deptA1._id });
  const studentA2 = await mk({ name: 'Stu A2', email: 'stua2@seca.edu', role: 'student', institution: instA._id, department: deptA1._id });
  await mk({ name: 'Place A', email: 'place@seca.edu', role: 'placement_officer', institution: instA._id });
  await mk({ name: 'Fac B', email: 'facb@secb.edu', role: 'faculty', institution: instB._id, department: deptB._id });
  await mk({ name: 'Stu B', email: 'stub@secb.edu', role: 'student', institution: instB._id, department: deptB._id });

  const subjectA = await Subject.create({ name: 'Algos', code: 'SA101', course: courseA._id, institution: instA._id, semester: 1, faculty: facultyA._id });
  assignmentA = await Assignment.create({
    subject: subjectA._id, title: 'PS1', description: 'x', maxScore: 100,
    dueDate: new Date(Date.now() + 86400000), createdBy: facultyA._id, institution: instA._id, status: 'open',
  });
  const companyA = await Company.create({ name: 'Tech A', institution: instA._id });
  const drive = await JobDrive.create({
    company: companyA._id, role: 'SDE', institution: instA._id,
    applicationDeadline: new Date(Date.now() + 86400000), status: 'active',
  });
  await JobApplication.create({ drive: drive._id, student: studentA1._id, stage: 'applied' });
  appA2 = await JobApplication.create({ drive: drive._id, student: studentA2._id, stage: 'applied' });
  void courseB;

  tStudentA1 = await login('stua1@seca.edu');
  tStudentA2 = await login('stua2@seca.edu');
  tFacultyA = await login('faca@seca.edu');
  tHodA = await login('hodee@seca.edu');
  tAdminA = await login('admin@seca.edu');
  tPlacementA = await login('place@seca.edu');
  tFacultyB = await login('facb@secb.edu');
  tStudentB = await login('stub@secb.edu');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('RBAC / tenant isolation', () => {
  it('student cannot read another student profile (no peer data leak)', async () => {
    const res = await request(app).get(`/api/v1/users/${studentA1._id}`)
      .set('Authorization', `Bearer ${tStudentA2}`);
    expect(res.status).not.toBe(200);
  });

  it('student is denied admin-only user management (403)', async () => {
    expect((await request(app).get('/api/v1/users')
      .set('Authorization', `Bearer ${tStudentA1}`)).status).toBe(403);
  });

  it('cross-tenant user read is denied (404-masked, no oracle)', async () => {
    const res = await request(app).get(`/api/v1/users/${studentA1._id}`)
      .set('Authorization', `Bearer ${tStudentB}`);
    expect([403, 404]).toContain(res.status);
    expect(res.body.data).toBeUndefined();
  });

  it('faculty cannot reach admin-only analytics (403)', async () => {
    expect((await request(app).get('/api/v1/analytics/placement-funnel')
      .set('Authorization', `Bearer ${tFacultyA}`)).status).toBe(403);
  });

  it('student cannot reach analytics at all (403)', async () => {
    expect((await request(app).get('/api/v1/analytics/enrollment-overview')
      .set('Authorization', `Bearer ${tStudentA1}`)).status).toBe(403);
  });

  it('college admin CAN reach analytics (200 control)', async () => {
    expect((await request(app).get('/api/v1/analytics/enrollment-overview')
      .set('Authorization', `Bearer ${tAdminA}`)).status).toBe(200);
  });

  it('HOD cannot update assignments outside their department scope', async () => {
    const res = await request(app).patch(`/api/v1/assignments/${assignmentA._id}`)
      .set('Authorization', `Bearer ${tHodA}`).send({ title: 'Hijacked' });
    expect(res.status).not.toBe(200);
  });

  it('cross-institution faculty cannot touch another tenant assignment', async () => {
    const res = await request(app).patch(`/api/v1/assignments/${assignmentA._id}`)
      .set('Authorization', `Bearer ${tFacultyB}`).send({ title: 'Hijacked' });
    expect([403, 404]).toContain(res.status);
  });

  it('student cannot read another student job application', async () => {
    const res = await request(app).get(`/api/v1/job-applications/${appA2._id}`)
      .set('Authorization', `Bearer ${tStudentA1}`);
    expect([403, 404]).toContain(res.status);
  });

  it('placement officer cannot update assignments (role guard)', async () => {
    const res = await request(app).patch(`/api/v1/assignments/${assignmentA._id}`)
      .set('Authorization', `Bearer ${tPlacementA}`).send({ title: 'Hijacked' });
    expect(res.status).toBe(403);
  });

  it('manipulated object id is rejected with 400, never 500 with a stack', async () => {
    const res = await request(app).get('/api/v1/attendance/not-an-id')
      .set('Authorization', `Bearer ${tFacultyA}`);
    expect(res.status).toBe(400);
    expect(res.body.stack).toBeUndefined();
  });

  it('unauthenticated API access is rejected with 401', async () => {
    expect((await request(app).get('/api/v1/requests')).status).toBe(401);
  });
});
