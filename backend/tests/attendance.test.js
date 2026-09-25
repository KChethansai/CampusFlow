// attendance.test: permanent guard for the major production failure area.
// Merged from historical attendance.test.js + attendance-security.test.js.
// Covers: route-shadow regression, valid marking, duplicate 409, invalid
// payloads, role/tenant scoping, student privacy, HOD/faculty subject scope.
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
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { AttendanceSessionModel as AttendanceSession } from '../models/AttendanceSessionModel.js';

jest.setTimeout(60000);

let mongod;
let subject;
let otherDeptSubject;
let studentA, studentA2;
let facultyToken, faculty2Token, studentAToken, hodToken, outsiderToken;

const login = async (email, password = 'Password@123') =>
  (await request(app).post('/api/v1/auth/login').send({ email, password })).body.accessToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const instA = await Institution.create({ name: 'Att A', code: 'ATTA', contactEmail: 'a@atta.edu', emailDomainPattern: 'atta.edu' });
  const instB = await Institution.create({ name: 'Att B', code: 'ATTB', contactEmail: 'b@attb.edu', emailDomainPattern: 'attb.edu' });
  const deptCSE = await Department.create({ name: 'CSE', code: 'CSEA', institution: instA._id });
  const deptECE = await Department.create({ name: 'ECE', code: 'ECEA', institution: instA._id });
  const deptB = await Department.create({ name: 'CSE B', code: 'CSEB', institution: instB._id });
  const courseA = await Course.create({ name: 'B CSE', code: 'BCSE', department: deptCSE._id, institution: instA._id, durationYears: 4, totalSemesters: 8 });
  const courseE = await Course.create({ name: 'B ECE', code: 'BECE', department: deptECE._id, institution: instA._id, durationYears: 4, totalSemesters: 8 });

  const mk = (over) => User.create({ password: 'Password@123', isEmailVerified: true, isActive: true, ...over });
  const faculty = await mk({ name: 'Fac', email: 'fac@atta.edu', role: 'faculty', institution: instA._id, department: deptCSE._id });
  const faculty2 = await mk({ name: 'Fac2', email: 'fac2@atta.edu', role: 'faculty', institution: instA._id, department: deptCSE._id });
  await mk({ name: 'HOD', email: 'hod@atta.edu', role: 'hod', institution: instA._id, department: deptCSE._id });
  studentA = await mk({ name: 'Stu A', email: 'stua@atta.edu', role: 'student', institution: instA._id, department: deptCSE._id });
  studentA2 = await mk({ name: 'Stu A2', email: 'stua2@atta.edu', role: 'student', institution: instA._id, department: deptCSE._id });
  const outsider = await mk({ name: 'Outsider', email: 'out@attb.edu', role: 'faculty', institution: instB._id, department: deptB._id });

  subject = await Subject.create({ institution: instA._id, course: courseA._id, code: 'CS101', name: 'Algorithms', semester: 1, faculty: faculty._id });
  otherDeptSubject = await Subject.create({ institution: instA._id, course: courseE._id, code: 'EC101', name: 'Circuits', semester: 1, faculty: faculty._id });
  void outsider;

  for (const s of [studentA, studentA2]) {
    await Enrollment.create({ institution: instA._id, student: s._id, course: courseA._id, academicYear: '2025-2026', semester: 1, status: 'active' });
  }

  facultyToken = await login('fac@atta.edu');
  faculty2Token = await login('fac2@atta.edu');
  studentAToken = await login('stua@atta.edu');
  hodToken = await login('hod@atta.edu');
  outsiderToken = await login('out@attb.edu');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const payload = (over = {}) => ({
  subject: String(subject._id),
  date: '2026-09-24T00:00:00.000Z',
  period: 1,
  records: [
    { student: String(studentA._id), status: 'present' },
    { student: String(studentA2._id), status: 'absent' },
  ],
  ...over,
});

describe('attendance routes', () => {
  it('route-shadow regression: GET /student/:id returns an aggregate array', async () => {
    const res = await request(app).get(`/api/v1/attendance/student/${studentA._id}`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('rejects unauthenticated reads with 401', async () => {
    expect((await request(app).get('/api/v1/attendance')).status).toBe(401);
  });

  it('rejects malformed session id with 400 and no stack leak', async () => {
    const res = await request(app).get('/api/v1/attendance/xyz')
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(400);
    expect(res.body.stack).toBeUndefined();
  });

  it('marks a valid session (201) then rejects the duplicate with 409', async () => {
    expect((await request(app).post('/api/v1/attendance')
      .set('Authorization', `Bearer ${facultyToken}`).send(payload())).status).toBe(201);
    expect((await request(app).post('/api/v1/attendance')
      .set('Authorization', `Bearer ${facultyToken}`).send(payload())).status).toBe(409);
  });

  it('rejects invalid payloads with 400 (empty records, bad status, unknown student)', async () => {
    const base = payload({ date: '2026-09-25T00:00:00.000Z', period: 3 });
    expect((await request(app).post('/api/v1/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ ...base, records: [] })).status).toBe(400);
    expect((await request(app).post('/api/v1/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ ...base, period: 4, records: [{ student: String(studentA._id), status: 'maybe' }] })).status).toBe(400);
    expect((await request(app).post('/api/v1/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ ...base, period: 5, records: [{ student: String(new mongoose.Types.ObjectId()), status: 'present' }] })).status).toBe(400);
  });

  it('forbids students from marking (403)', async () => {
    const before = await AttendanceSession.countDocuments();
    const res = await request(app).post('/api/v1/attendance')
      .set('Authorization', `Bearer ${studentAToken}`).send(payload({ date: '2026-09-26T00:00:00.000Z' }));
    expect(res.status).toBe(403);
    expect(await AttendanceSession.countDocuments()).toBe(before);
  });

  it('masks cross-institution sessions as 404 (no data leak)', async () => {
    const foreign = await AttendanceSession.findOne({}).lean();
    const res = await request(app).get(`/api/v1/attendance/${foreign._id}`)
      .set('Authorization', `Bearer ${outsiderToken}`);
    expect(res.status).toBe(404);
    expect(res.body.data).toBeUndefined();
  });

  it('forbids one student from reading another student aggregate', async () => {
    const own = await request(app).get(`/api/v1/attendance/student/${studentA._id}`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(own.status).toBe(200);
    const res = await request(app).get(`/api/v1/attendance/student/${studentA2._id}`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect([403, 404]).toContain(res.status);
    expect(res.body.data).toBeUndefined();
  });

  it('blocks faculty from marking subjects they do not teach', async () => {
    const before = await AttendanceSession.countDocuments();
    const res = await request(app).post('/api/v1/attendance')
      .set('Authorization', `Bearer ${faculty2Token}`)
      .send(payload({ date: '2026-09-27T00:00:00.000Z' }));
    expect(res.status).not.toBe(201);
    expect(await AttendanceSession.countDocuments()).toBe(before);
  });

  it('blocks HOD from marking outside their department', async () => {
    const before = await AttendanceSession.countDocuments();
    const res = await request(app).post('/api/v1/attendance')
      .set('Authorization', `Bearer ${hodToken}`)
      .send(payload({ subject: String(otherDeptSubject._id), date: '2026-09-28T00:00:00.000Z' }));
    expect(res.status).not.toBe(201);
    expect(await AttendanceSession.countDocuments()).toBe(before);
  });
});
