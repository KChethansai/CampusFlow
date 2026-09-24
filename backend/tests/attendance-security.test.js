// attendance-security.test: adversarial authz coverage for attendance routes.
// - unauthenticated access blocked (401)
// - student cannot read another student's aggregate (403, no data leak)
// - cross-institution session reads masked as 404 (no data leak)
// - HOD blocked from marking sessions outside own department (403)
// - faculty blocked from marking subjects they don't teach (403)
// - invalid ObjectId rejected with 400 and no stack trace leak
// - students blocked from marking sessions (403)
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

// MongoMemoryServer may need more than Jest's 5s default on cold CI hosts.
jest.setTimeout(30000);

let mongod;
let instA;
let instB;
let subjectA1;
let subjectOtherDept;
let subjectB1;
let studentA1;
let studentA2;
let studentB;
let courseA1;
let courseA2;
let sessionB;
let studentA1Token;
let studentA2Token;
let facultyA1Token;
let facultyA2Token;
let hodAToken;

const login = async (email, password = 'Password@123') => {
  const res = await request(app).post('/api/v1/auth/login').send({
    email,
    password
  });
  return res.body.accessToken;
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  instA = await Institution.create({ name: 'Att Sec A', code: 'ATSA', contactEmail: 'a@atsa.edu', emailDomainPattern: 'atsa.edu' });
  instB = await Institution.create({ name: 'Att Sec B', code: 'ATSB', contactEmail: 'b@atsb.edu', emailDomainPattern: 'atsb.edu' });

  const deptACSE = await Department.create({ name: 'CSE A', code: 'CSEA', institution: instA._id });
  const deptAECE = await Department.create({ name: 'ECE A', code: 'ECEA', institution: instA._id });
  const deptB = await Department.create({ name: 'CSE B', code: 'CSEB', institution: instB._id });

  courseA1 = await Course.create({ name: 'B CSE A', code: 'BACSE', department: deptACSE._id, institution: instA._id, durationYears: 4, totalSemesters: 8 });
  courseA2 = await Course.create({ name: 'B ECE A', code: 'BAECE', department: deptAECE._id, institution: instA._id, durationYears: 4, totalSemesters: 8 });
  const courseB1 = await Course.create({ name: 'B CSE B', code: 'BBCSE', department: deptB._id, institution: instB._id, durationYears: 4, totalSemesters: 8 });

  const mk = (over) => User.create({ password: 'Password@123', isEmailVerified: true, isActive: true, ...over });
  const facultyA1 = await mk({ name: 'Fac A1', email: 'fac.a1@atsa.edu', role: 'faculty', institution: instA._id, department: deptACSE._id });
  const facultyA2 = await mk({ name: 'Fac A2', email: 'fac.a2@atsa.edu', role: 'faculty', institution: instA._id, department: deptACSE._id });
  await mk({ name: 'HOD CSE', email: 'hod.cse@atsa.edu', role: 'hod', institution: instA._id, department: deptACSE._id });
  studentA1 = await mk({ name: 'Stu A1', email: 'stu.a1@atsa.edu', role: 'student', institution: instA._id, department: deptACSE._id });
  studentA2 = await mk({ name: 'Stu A2', email: 'stu.a2@atsa.edu', role: 'student', institution: instA._id, department: deptACSE._id });
  studentB = await mk({ name: 'Stu B', email: 'stu.b@atsb.edu', role: 'student', institution: instB._id, department: deptB._id });
  const facultyB = await mk({ name: 'Fac B', email: 'fac.b@atsb.edu', role: 'faculty', institution: instB._id, department: deptB._id });

  subjectA1 = await Subject.create({ institution: instA._id, course: courseA1._id, code: 'CS101', name: 'Alpha Algorithms', semester: 1, faculty: facultyA1._id });
  await Subject.create({ institution: instA._id, course: courseA1._id, code: 'CS102', name: 'Alpha Databases', semester: 1, faculty: facultyA2._id });
  subjectOtherDept = await Subject.create({ institution: instA._id, course: courseA2._id, code: 'EC101', name: 'ECE Circuits', semester: 1, faculty: facultyA1._id });
  subjectB1 = await Subject.create({ institution: instB._id, course: courseB1._id, code: 'BCS101', name: 'Beta Secret Subject Unlisted', semester: 1, faculty: facultyB._id });

  await Enrollment.create({ student: studentA1._id, course: courseA1._id, institution: instA._id, status: 'active', academicYear: '2025-2026', semester: 1 });
  await Enrollment.create({ student: studentA2._id, course: courseA1._id, institution: instA._id, status: 'active', academicYear: '2025-2026', semester: 1 });
  await Enrollment.create({ student: studentB._id, course: courseB1._id, institution: instB._id, status: 'active', academicYear: '2025-2026', semester: 1 });

  await AttendanceSession.create({
    institution: instA._id,
    subject: subjectA1._id,
    date: new Date(),
    period: 1,
    markedBy: facultyA1._id,
    records: [
      { student: studentA1._id, status: 'present' },
      { student: studentA2._id, status: 'absent' }
    ]
  });
  sessionB = await AttendanceSession.create({
    institution: instB._id,
    subject: subjectB1._id,
    date: new Date(),
    period: 1,
    markedBy: facultyB._id,
    records: [{ student: studentB._id, status: 'present' }]
  });

  studentA1Token = await login('stu.a1@atsa.edu');
  studentA2Token = await login('stu.a2@atsa.edu');
  facultyA1Token = await login('fac.a1@atsa.edu');
  facultyA2Token = await login('fac.a2@atsa.edu');
  hodAToken = await login('hod.cse@atsa.edu');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('attendance authn/authz', () => {
  it('rejects unauthenticated GET /api/v1/attendance with 401', async () => {
    const res = await request(app).get('/api/v1/attendance');
    expect(res.status).toBe(401);
  });

  it('student cannot read another student aggregate (403/404, never 200 with чужой data)', async () => {
    // Control: a student CAN read their own aggregate.
    const own = await request(app)
      .get(`/api/v1/attendance/student/${studentA1._id}`)
      .set('Authorization', `Bearer ${studentA1Token}`);
    expect(own.status).toBe(200);

    // Attack: student A1 reads student A2's aggregate.
    const res = await request(app)
      .get(`/api/v1/attendance/student/${studentA2._id}`)
      .set('Authorization', `Bearer ${studentA1Token}`);
    expect([403, 404]).toContain(res.status);
    expect(res.status).not.toBe(200);
    expect(res.body.data).toBeUndefined();
  });

  it('cross-institution session read is 404-masked (never institution B data)', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/${sessionB._id}`)
      .set('Authorization', `Bearer ${studentA1Token}`);
    expect(res.status).toBe(404);
    expect(res.body.data).toBeUndefined();
    expect(res.text).not.toContain('Beta Secret Subject Unlisted');
  });

  it('HOD cannot POST a session for a subject outside their department (403/400, never 201)', async () => {
    const before = await AttendanceSession.countDocuments();
    const res = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${hodAToken}`)
      .send({
        subject: subjectOtherDept._id,
        date: new Date().toISOString(),
        period: 2,
        records: [{ student: studentA1._id, status: 'present' }]
      });
    expect(res.status).not.toBe(201);
    expect([400, 403]).toContain(res.status);
    expect(await AttendanceSession.countDocuments()).toBe(before);
  });

  it('faculty cannot POST for a subject they do not teach (403/400, never 201)', async () => {
    const before = await AttendanceSession.countDocuments();
    const res = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${facultyA2Token}`)
      .send({
        subject: subjectA1._id,
        date: new Date().toISOString(),
        period: 2,
        records: [{ student: studentA1._id, status: 'present' }]
      });
    expect(res.status).not.toBe(201);
    expect([400, 403]).toContain(res.status);
    expect(await AttendanceSession.countDocuments()).toBe(before);
  });

  it('invalid ObjectId GET /api/v1/attendance/xyz is 400 with no stack leak', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/xyz')
      .set('Authorization', `Bearer ${facultyA1Token}`);
    expect(res.status).toBe(400);
    expect(res.status).not.toBe(500);
    expect(res.body.stack).toBeUndefined();
    expect(res.text).not.toMatch(/\n\s+at\s/);
  });

  it('student POST /api/v1/attendance is 403', async () => {
    const before = await AttendanceSession.countDocuments();
    const res = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${studentA2Token}`)
      .send({
        subject: subjectA1._id,
        date: new Date().toISOString(),
        period: 2,
        records: [{ student: studentA2._id, status: 'present' }]
      });
    expect(res.status).toBe(403);
    expect(await AttendanceSession.countDocuments()).toBe(before);
  });
});
