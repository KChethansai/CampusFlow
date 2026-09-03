import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';
import { CompanyModel as Company } from '../models/CompanyModel.js';
import { JobDriveModel as JobDrive } from '../models/JobDriveModel.js';

let mongod;
let institution;
let admin;
let officer;
let student;
let course;
let company;
let drive;
let adminToken;
let studentToken;
let officerToken;

const login = async (email) => {
  const res = await request(app).post('/api/v1/auth/login').send({
    email,
    password: 'Password@123'
  });
  return res.body.accessToken;
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  institution = await Institution.create({
    name: 'Flow Test Institute',
    code: 'FLOW',
    address: { city: 'Delhi', state: 'Delhi', country: 'India' },
    contactEmail: 'flow@test.edu'
  });

  const common = { institution: institution._id, isEmailVerified: true, isActive: true };
  admin = await User.create({ name: 'Flow Admin', email: 'flow.admin@test.edu', password: 'Password@123', role: 'college_admin', ...common });
  officer = await User.create({ name: 'Flow Officer', email: 'flow.officer@test.edu', password: 'Password@123', role: 'placement_officer', ...common });
  student = await User.create({
    name: 'Flow Student',
    email: 'flow.student@test.edu',
    password: 'Password@123',
    role: 'student',
    ...common,
    profile: { rollNumber: 'FL2001', cgpa: 8.2, backlogs: 0, batchYear: 2026, course: undefined }
  });

  const department = await Department.create({ name: 'Computer Science', code: 'FL-CSE', institution: institution._id });
  course = await Course.create({
    name: 'B.Tech Computer Science',
    code: 'BTCSE',
    department: department._id,
    institution: institution._id,
    durationYears: 4,
    totalSemesters: 8
  });
  company = await Company.create({ name: 'Acme Corp', website: 'acme.dev', institution: institution._id });
  drive = await JobDrive.create({
    company: company._id,
    role: 'SDE Intern',
    jobType: 'internship',
    packageLPA: 12,
    location: 'Remote',
    institution: institution._id,
    status: 'active',
    eligibility: { minCGPA: 7.0, maxBacklogs: 1, graduationYear: 2026 }
  });

  adminToken = await login('flow.admin@test.edu');
  officerToken = await login('flow.officer@test.edu');
  studentToken = await login('flow.student@test.edu');
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe('Placement flow', () => {
  it('checks eligibility for a drive', async () => {
    const res = await request(app)
      .get(`/api/v1/job-applications/drives/${drive._id}/eligibility`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.eligible).toBe(true);
  });

  it('lets a student apply and blocks duplicates', async () => {
    const res = await request(app)
      .post(`/api/v1/job-applications/drives/${drive._id}/apply`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(201);
    expect(res.body.data.stage).toBe('applied');

    const dup = await request(app)
      .post(`/api/v1/job-applications/drives/${drive._id}/apply`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(dup.status).toBe(409);
  });

  it('scopes student application list to self and exposes per-drive list to staff', async () => {
    const mine = await request(app)
      .get('/api/v1/job-applications')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data).toHaveLength(1);
    expect(String(mine.body.data[0].student._id)).toBe(String(student._id));

    const all = await request(app)
      .get(`/api/v1/job-applications/drives/${drive._id}/applications`)
      .set('Authorization', `Bearer ${officerToken}`);
    expect(all.status).toBe(200);
    expect(all.body.data).toHaveLength(1);
  });

  it('notifies the placement team on apply and updates stage', async () => {
    const officerNotifs = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(officerNotifs.status).toBe(200);
    expect(officerNotifs.body.data.some((n) => n.title === 'New job application')).toBe(true);

    const appId = (await request(app)
      .get('/api/v1/job-applications')
      .set('Authorization', `Bearer ${officerToken}`)).body.data[0]._id;

    const updated = await request(app)
      .patch(`/api/v1/job-applications/drives/${drive._id}/applications/${appId}`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ stage: 'shortlisted' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.stage).toBe('shortlisted');

    const studentNotifs = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(
      studentNotifs.body.data.some((n) => n.title === 'Application status update')
    ).toBe(true);
  });
});

describe('Enrollment self-service', () => {
  it('enrolls, dedupes and drops own enrollments', async () => {
    const enroll = await request(app)
      .post('/api/v1/enrollments/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course: course._id, semester: 1 });
    expect(enroll.status).toBe(201);
    expect(enroll.body.data.status).toBe('active');

    const dup = await request(app)
      .post('/api/v1/enrollments/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ course: course._id, semester: 1 });
    expect(dup.status).toBe(409);

    const list = await request(app)
      .get('/api/v1/enrollments')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(String(list.body.data[0].student._id)).toBe(String(student._id));

    const dropped = await request(app)
      .delete(`/api/v1/enrollments/me/${enroll.body.data._id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(dropped.status).toBe(200);
    expect(dropped.body.data.status).toBe('dropped');
  });
});

describe('Activity log + AI reports', () => {
  it('records audit entries on login and writes', async () => {
    const audit = await User.db.collection('activitylogs').countDocuments({
      action: 'auth.login'
    });
    expect(audit).toBeGreaterThan(0);
  });

  it('exposes an admin-only AI reports surface', async () => {
    const list = await request(app)
      .get('/api/v1/ai-reports')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);

    const forbidden = await request(app)
      .get('/api/v1/ai-reports')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(forbidden.status).toBe(403);
  });
});

describe('Placement staff edits (PATCH)', () => {
  it('updates a job drive and a company via their PATCH endpoints', async () => {
    const updatedDrive = await request(app)
      .patch(`/api/v1/job-drives/${drive._id}`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        role: 'SDE Fulltime',
        packageLPA: 15,
        eligibility: { minCGPA: 6.5, maxBacklogs: 2, graduationYear: 2026 }
      });
    expect(updatedDrive.status).toBe(200);
    expect(updatedDrive.body.data.role).toBe('SDE Fulltime');
    expect(updatedDrive.body.data.packageLPA).toBe(15);
    expect(updatedDrive.body.data.eligibility.minCGPA).toBe(6.5);

    const updatedCompany = await request(app)
      .patch(`/api/v1/companies/${company._id}`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ industry: 'Software', website: 'acme.example.com' });
    expect(updatedCompany.status).toBe(200);
    expect(updatedCompany.body.data.industry).toBe('Software');
    expect(updatedCompany.body.data.website).toBe('acme.example.com');
  });

  it('blocks students from editing placement resources', async () => {
    const res = await request(app)
      .patch(`/api/v1/job-drives/${drive._id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ role: 'Hijacked' });
    expect(res.status).toBe(403);
  });
});
