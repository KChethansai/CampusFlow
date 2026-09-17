import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { AttendanceSessionModel as AttendanceSession } from '../models/AttendanceSessionModel.js';
import { CompanyModel as Company } from '../models/CompanyModel.js';
import { JobDriveModel as JobDrive } from '../models/JobDriveModel.js';
import { JobApplicationModel as JobApplication } from '../models/JobApplicationModel.js';
import { RequestModel as RequestDoc } from '../models/RequestModel.js';

let mongod;
let institution;
let department;
let course;
let subject;
let company;
let superAdminToken;
let facultyToken;
let studentToken;
let placementOfficerToken;
let studentUser;
let facultyUser;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  institution = await Institution.create({
    name: 'Contract Test Institute',
    code: 'CONTRACT_TEST',
    address: { city: 'Bengaluru', state: 'Karnataka', country: 'India' }
  });

  department = await Department.create({
    institution: institution._id,
    name: 'Computer Science',
    code: 'CSE'
  });

  course = await Course.create({
    institution: institution._id,
    department: department._id,
    name: 'B.Tech CSE',
    code: 'BTCSE',
    durationYears: 4
  });

  subject = await Subject.create({
    institution: institution._id,
    course: course._id,
    name: 'Operating Systems',
    code: 'CS301',
    semester: 5
  });

  company = await Company.create({
    institution: institution._id,
    name: 'Tech Corp',
    website: 'https://techcorp.example.com',
    industry: 'Software'
  });

  // Users
  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@contract.test',
    password: 'Password@123',
    role: 'super_admin',
    institution: institution._id,
    isEmailVerified: true,
    isActive: true
  });

  facultyUser = await User.create({
    name: 'Faculty User',
    email: 'faculty@contract.test',
    password: 'Password@123',
    role: 'faculty',
    institution: institution._id,
    department: department._id,
    isEmailVerified: true,
    isActive: true
  });

  studentUser = await User.create({
    name: 'Student User',
    email: 'student@contract.test',
    password: 'Password@123',
    role: 'student',
    institution: institution._id,
    department: department._id,
    profile: {
      rollNumber: 'CS2026001',
      cgpa: 8.5,
      backlogs: 0,
      semester: 5
    },
    isEmailVerified: true,
    isActive: true
  });

  const placementOfficer = await User.create({
    name: 'Placement Officer',
    email: 'placement@contract.test',
    password: 'Password@123',
    role: 'placement_officer',
    institution: institution._id,
    isEmailVerified: true,
    isActive: true
  });

  // Get Tokens
  const saRes = await request(app).post('/api/v1/auth/login').send({ email: 'superadmin@contract.test', password: 'Password@123' });
  superAdminToken = saRes.body.accessToken;

  const facRes = await request(app).post('/api/v1/auth/login').send({ email: 'faculty@contract.test', password: 'Password@123' });
  facultyToken = facRes.body.accessToken;

  const stuRes = await request(app).post('/api/v1/auth/login').send({ email: 'student@contract.test', password: 'Password@123' });
  studentToken = stuRes.body.accessToken;

  const poRes = await request(app).post('/api/v1/auth/login').send({ email: 'placement@contract.test', password: 'Password@123' });
  placementOfficerToken = poRes.body.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Frontend Contract Parity: User Management & Attendance Roster', () => {
  it('allows faculty to GET /api/v1/users to select students for Attendance.jsx', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    const students = res.body.data.filter((u) => u.role === 'student');
    expect(students.length).toBeGreaterThanOrEqual(1);
    expect(students[0].name).toBe('Student User');
  });

  it('allows placement officers to GET /api/v1/users for Directory and candidate review', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${placementOfficerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('strictly denies students access to GET /api/v1/users with 403', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('Frontend Contract Parity: Super Admin Role Oversight', () => {
  let createdDriveId;

  it('allows super_admin to create job drives at POST /api/v1/job-drives', async () => {
    const res = await request(app)
      .post('/api/v1/job-drives')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        company: company._id,
        role: 'Frontend Engineer',
        jobType: 'full-time',
        packageLPA: 12,
        location: 'Bengaluru',
        status: 'active',
        eligibility: { minCGPA: 7.0, maxBacklogs: 0 }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('Frontend Engineer');
    createdDriveId = res.body.data._id;
  });

  it('allows super_admin to GET /api/v1/job-applications', async () => {
    const res = await request(app)
      .get('/api/v1/job-applications')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('allows super_admin to create announcements at POST /api/v1/announcements', async () => {
    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        title: 'Platform Maintenance Notice',
        body: 'Scheduled Sunday upgrade.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Platform Maintenance Notice');
  });

  it('allows super_admin to create campus events at POST /api/v1/events', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        title: 'Annual Tech Symposium',
        description: 'Keynotes and workshops',
        type: 'technical',
        visibility: 'public'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Annual Tech Symposium');
  });

  it('allows super_admin to review and update request status at PATCH /api/v1/requests/:id/status', async () => {
    const reqDoc = await RequestDoc.create({
      institution: institution._id,
      student: studentUser._id,
      type: 'bonafide',
      title: 'Internship Bonafide Request',
      description: 'Need bonafide for passport verification',
      status: 'pending'
    });

    const res = await request(app)
      .patch(`/api/v1/requests/${reqDoc._id}/status`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('approved');
  });
});

describe('Frontend Contract Parity: Student Aggregates & Dashboards', () => {
  beforeAll(async () => {
    // Record attendance session for student
    await AttendanceSession.create({
      institution: institution._id,
      subject: subject._id,
      date: new Date(),
      period: 1,
      markedBy: facultyUser._id,
      records: [
        { student: studentUser._id, status: 'present' }
      ]
    });
  });

  it('returns exact student attendance shape expected by StudentHome.jsx', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/student/${studentUser._id}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const stat = res.body.data[0];
    expect(stat).toHaveProperty('subject');
    expect(stat).toHaveProperty('subjectId');
    expect(stat).toHaveProperty('totalSessions');
    expect(stat).toHaveProperty('present');
    expect(stat).toHaveProperty('absent');
    expect(stat).toHaveProperty('percentage');
    expect(stat.percentage).toBe(100);
  });

  it('returns study plan structure expected by Study.jsx', async () => {
    const res = await request(app)
      .get('/api/v1/study/plan')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('generatedFrom');
    expect(res.body.data).toHaveProperty('weakSubjects');
    expect(res.body.data).toHaveProperty('revisionPlan');
    expect(res.body.data).toHaveProperty('resources');
    expect(Array.isArray(res.body.data.weakSubjects)).toBe(true);
    expect(Array.isArray(res.body.data.revisionPlan)).toBe(true);
    expect(Array.isArray(res.body.data.resources)).toBe(true);
  });
});
