import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';

let mongod;
let institutionA;
let institutionB;
let subject;
let faculty;
let studentA;
let studentB;
let outsider;
let facultyToken;
let studentAToken;
let studentBToken;
let outsiderToken;

const login = async (email, password) => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  expect(res.status).toBe(200);
  return res.body.accessToken;
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  institutionA = await Institution.create({
    name: 'Attendance Institute A',
    code: 'ATTA',
    emailDomainPattern: 'atta.edu',
    address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    contactEmail: 'contact@atta.edu'
  });
  institutionB = await Institution.create({
    name: 'Attendance Institute B',
    code: 'ATTB',
    emailDomainPattern: 'attb.edu',
    address: { city: 'Mysore', state: 'Karnataka', country: 'India' },
    contactEmail: 'contact@attb.edu'
  });

  const department = await Department.create({
    institution: institutionA._id,
    name: 'Computer Science',
    code: 'CS'
  });
  const course = await Course.create({
    institution: institutionA._id,
    department: department._id,
    name: 'B.Tech CSE',
    code: 'BTCSE'
  });

  faculty = await User.create({
    name: 'Attendance Faculty',
    email: 'faculty@atta.edu',
    password: 'Faculty@123',
    role: 'faculty',
    institution: institutionA._id,
    department: department._id,
    isEmailVerified: true,
    isActive: true
  });
  studentA = await User.create({
    name: 'Student A',
    email: 'studenta@atta.edu',
    password: 'Student@123',
    role: 'student',
    institution: institutionA._id,
    isEmailVerified: true,
    isActive: true,
    profile: { rollNumber: 'ATTA001' }
  });
  studentB = await User.create({
    name: 'Student B',
    email: 'studentb@atta.edu',
    password: 'Student@123',
    role: 'student',
    institution: institutionA._id,
    isEmailVerified: true,
    isActive: true,
    profile: { rollNumber: 'ATTA002' }
  });
  outsider = await User.create({
    name: 'Outsider Faculty',
    email: 'outsider@attb.edu',
    password: 'Faculty@123',
    role: 'faculty',
    institution: institutionB._id,
    isEmailVerified: true,
    isActive: true
  });

  subject = await Subject.create({
    institution: institutionA._id,
    course: course._id,
    code: 'CS101',
    name: 'Intro to CS',
    semester: 1,
    faculty: faculty._id
  });

  for (const student of [studentA, studentB]) {
    await Enrollment.create({
      institution: institutionA._id,
      student: student._id,
      course: course._id,
      academicYear: '2026-27',
      semester: 1,
      status: 'active'
    });
  }

  facultyToken = await login('faculty@atta.edu', 'Faculty@123');
  studentAToken = await login('studenta@atta.edu', 'Student@123');
  studentBToken = await login('studentb@atta.edu', 'Student@123');
  outsiderToken = await login('outsider@attb.edu', 'Faculty@123');
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const sessionPayload = (overrides = {}) => ({
  subject: String(subject._id),
  date: '2026-09-24T00:00:00.000Z',
  period: 1,
  records: [
    { student: String(studentA._id), status: 'present' },
    { student: String(studentB._id), status: 'absent' }
  ],
  ...overrides
});

describe('Attendance API', () => {
  describe('route order regression: GET /student/:studentId', () => {
    it('hits getStudentAttendance (aggregate array), not getSessionById', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/student/${studentA._id}`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/attendance filter validation', () => {
    it('returns 400 for an invalid date filter', async () => {
      const res = await request(app)
        .get('/api/v1/attendance?date=not-a-date')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for an invalid period filter', async () => {
      const res = await request(app)
        .get('/api/v1/attendance?period=abc')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for a non-positive period filter', async () => {
      const res = await request(app)
        .get('/api/v1/attendance?period=0')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/attendance pagination', () => {
    it('returns { success, data, pagination } shape', async () => {
      const res = await request(app)
        .get('/api/v1/attendance?page=1&limit=10')
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toMatchObject({ page: 1, limit: 10 });
      expect(res.body.pagination.total).toBeDefined();
      expect(res.body.pagination.pages).toBeDefined();
    });
  });

  describe('POST /api/v1/attendance duplicate prevention', () => {
    it('creates once (201) then rejects the same subject/date-day/period with 409', async () => {
      const first = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(sessionPayload());

      expect(first.status).toBe(201);
      expect(first.body.success).toBe(true);

      const dupe = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(sessionPayload({ date: '2026-09-24T15:30:00.000Z' }));

      expect(dupe.status).toBe(409);
      expect(dupe.body.success).toBe(false);
    });

    it('allows a different period on the same day', async () => {
      const res = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(sessionPayload({ period: 2 }));

      expect(res.status).toBe(201);
    });
  });

  describe('tenant + audience isolation', () => {
    let sessionId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(sessionPayload({ date: '2026-09-20T00:00:00.000Z', period: 3 }));
      expect(res.status).toBe(201);
      sessionId = res.body.data._id;
    });

    it('masks cross-institution sessions (404 for outsider)', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/${sessionId}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(404);
    });

    it('returns an empty list for the outsider institution', async () => {
      const res = await request(app)
        .get('/api/v1/attendance')
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('forbids student B from reading student A aggregate (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/student/${studentA._id}`)
        .set('Authorization', `Bearer ${studentBToken}`);

      expect(res.status).toBe(403);
    });

    it('lets a student read their own aggregate (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/student/${studentA._id}`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('strips peer rows from student list responses', async () => {
      const res = await request(app)
        .get('/api/v1/attendance')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      for (const s of res.body.data) {
        for (const r of s.records || []) {
          expect(String(r.student?._id || r.student)).toBe(String(studentA._id));
        }
      }
    });
  });
});
