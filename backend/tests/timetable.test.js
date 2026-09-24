// timetable.test: rooms + timetable entries — CRUD, overlap 400,
// cross-tenant masking, hod out-of-dept 403, student read-own scoping.
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
import { RoomModel as Room } from '../models/RoomModel.js';

jest.setTimeout(30000);

let mongod;
let inst;
let otherInst;
let deptCSE;
let deptECE;
let courseCSE;
let courseECE;
let subjectCSE;
let subjectECE;
let roomCSE;
let roomECE;
let faculty;
let student;
let entryCSE;
let adminToken;
let hodToken;
let facultyToken;
let studentToken;
let otherAdminToken;

const login = async (email, password = 'Password@123') => {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.accessToken;
};

const slot = (over = {}) => ({
  subject: String(subjectCSE._id),
  faculty: String(faculty._id),
  room: String(roomCSE._id),
  dayOfWeek: 'Mon',
  startTime: '09:00',
  endTime: '10:00',
  ...over,
});

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  inst = await Institution.create({ name: 'TT Inst', code: 'TTI', contactEmail: 'tt@t.edu', emailDomainPattern: 't.edu' });
  otherInst = await Institution.create({ name: 'Other Inst', code: 'OTI', contactEmail: 'o@o.edu', emailDomainPattern: 'o.edu' });
  deptCSE = await Department.create({ name: 'CSE', code: 'CSE', institution: inst._id });
  deptECE = await Department.create({ name: 'ECE', code: 'ECE', institution: inst._id });
  courseCSE = await Course.create({ name: 'B CSE', code: 'BCSE', department: deptCSE._id, institution: inst._id, durationYears: 4, totalSemesters: 8 });
  courseECE = await Course.create({ name: 'B ECE', code: 'BECE', department: deptECE._id, institution: inst._id, durationYears: 4, totalSemesters: 8 });

  const mk = (over) => User.create({ password: 'Password@123', isEmailVerified: true, isActive: true, ...over });
  await mk({ name: 'TT Admin', email: 'admin@t.edu', role: 'college_admin', institution: inst._id });
  await mk({ name: 'HOD CSE', email: 'hod.cse@t.edu', role: 'hod', institution: inst._id, department: deptCSE._id });
  faculty = await mk({ name: 'Faculty One', email: 'f1@t.edu', role: 'faculty', institution: inst._id, department: deptCSE._id });
  student = await mk({ name: 'Student One', email: 's1@t.edu', role: 'student', institution: inst._id, department: deptCSE._id });
  await mk({ name: 'Other Admin', email: 'admin@o.edu', role: 'college_admin', institution: otherInst._id });

  subjectCSE = await Subject.create({ institution: inst._id, course: courseCSE._id, code: 'CS101', name: 'Intro CS', semester: 1, faculty: faculty._id });
  subjectECE = await Subject.create({ institution: inst._id, course: courseECE._id, code: 'EC101', name: 'Intro EC Unlisted', semester: 1 });
  roomCSE = await mkRoom(inst._id, deptCSE._id, 'Lab 1', 'CSE-L1');
  roomECE = await mkRoom(inst._id, deptECE._id, 'Lab 2', 'ECE-L2');

  await Enrollment.create({ institution: inst._id, student: student._id, course: courseCSE._id, academicYear: '2026-27', semester: 1, status: 'active' });

  entryCSE = await request(app).post('/api/v1/timetable')
    .set('Authorization', `Bearer ${await login('admin@t.edu')}`)
    .send(slot());
  if (entryCSE.status !== 201) throw new Error(`seed entry failed: ${entryCSE.status} ${entryCSE.text}`);

  adminToken = await login('admin@t.edu');
  hodToken = await login('hod.cse@t.edu');
  facultyToken = await login('f1@t.edu');
  studentToken = await login('s1@t.edu');
  otherAdminToken = await login('admin@o.edu');
});

const mkRoom = async (institution, department, name, code) => {
  return await Room.create({ institution, department, name, code, capacity: 60 });
};

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('room CRUD', () => {
  it('creates a room with {success, data}', async () => {
    const res = await request(app).post('/api/v1/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ department: String(deptCSE._id), name: 'Seminar Hall', code: 'CSE-SH', capacity: 120 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe('CSE-SH');
  });

  it('rejects duplicate room code in the same institution', async () => {
    const res = await request(app).post('/api/v1/rooms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ department: String(deptCSE._id), name: 'Dupe', code: 'CSE-L1', capacity: 10 });
    expect(res.status).toBe(409);
  });

  it('lists rooms paged with pagination', async () => {
    const res = await request(app).get('/api/v1/rooms').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
  });

  it('blocks student writes', async () => {
    const res = await request(app).post('/api/v1/rooms')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ department: String(deptCSE._id), name: 'Nope', code: 'NOPE', capacity: 5 });
    expect(res.status).toBe(403);
  });
});

describe('timetable CRUD + overlap', () => {
  it('creates an entry with {success, data}', async () => {
    expect(entryCSE.body.success).toBe(true);
    expect(entryCSE.body.data.dayOfWeek).toBe('Mon');
  });

  it('rejects same-room overlap with 400', async () => {
    const res = await request(app).post('/api/v1/timetable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(slot({ startTime: '09:30', endTime: '10:30' }));
    expect(res.status).toBe(400);
  });

  it('rejects same-faculty overlap in a different room with 400', async () => {
    const res = await request(app).post('/api/v1/timetable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(slot({ room: String(roomECE._id), startTime: '09:30', endTime: '10:30' }));
    expect(res.status).toBe(400);
  });

  it('allows back-to-back slots (end == start)', async () => {
    const res = await request(app).post('/api/v1/timetable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(slot({ dayOfWeek: 'Tue', startTime: '10:00', endTime: '11:00' }));
    expect(res.status).toBe(201);
  });

  it('rejects startTime after endTime and bad day with 400', async () => {
    const badTime = await request(app).post('/api/v1/timetable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(slot({ dayOfWeek: 'Wed', startTime: '11:00', endTime: '10:00' }));
    expect(badTime.status).toBe(400);
    const badDay = await request(app).post('/api/v1/timetable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(slot({ dayOfWeek: 'Sun', startTime: '11:00', endTime: '12:00' }));
    expect(badDay.status).toBe(400);
  });

  it('rejects overlapping update with 400', async () => {
    const id = entryCSE.body.data._id;
    const res = await request(app).patch(`/api/v1/timetable/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ dayOfWeek: 'Tue', startTime: '10:30', endTime: '11:30' });
    expect(res.status).toBe(400);
  });

  it('requires auth', async () => {
    const res = await request(app).get('/api/v1/timetable');
    expect(res.status).toBe(401);
  });
});

describe('tenant isolation', () => {
  it('masks cross-institution entries as not-found without leakage', async () => {
    const id = entryCSE.body.data._id;
    const res = await request(app).get(`/api/v1/timetable/${id}`).set('Authorization', `Bearer ${otherAdminToken}`);
    expect(res.status).toBe(404);
    expect(res.body.data).toBeUndefined();
    const list = await request(app).get('/api/v1/timetable').set('Authorization', `Bearer ${otherAdminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toEqual([]);
  });
});

describe('hod department scoping', () => {
  it('blocks hod creating an out-of-department entry with 403', async () => {
    const res = await request(app).post('/api/v1/timetable')
      .set('Authorization', `Bearer ${hodToken}`)
      .send(slot({ subject: String(subjectECE._id), room: String(roomECE._id), dayOfWeek: 'Wed', startTime: '09:00', endTime: '10:00' }));
    expect(res.status).toBe(403);
  });

  it('lists only own-department entries for hod', async () => {
    const res = await request(app).get('/api/v1/timetable').set('Authorization', `Bearer ${hodToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((e) => String(e._id));
    expect(ids).toContain(String(entryCSE.body.data._id));
    expect(res.text).not.toContain('Intro EC Unlisted');
  });
});

describe('student read-own scoping', () => {
  it('student lists only enrolled-subject entries', async () => {
    const res = await request(app).get('/api/v1/timetable').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const ids = res.body.data.map((e) => String(e._id));
    expect(ids).toContain(String(entryCSE.body.data._id));
  });

  it('student blocked from reading a non-enrolled entry without leakage', async () => {
    const created = await request(app).post('/api/v1/timetable')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(slot({ subject: String(subjectECE._id), room: String(roomECE._id), faculty: undefined, dayOfWeek: 'Thu', startTime: '09:00', endTime: '10:00' }));
    expect(created.status).toBe(201);
    const res = await request(app).get(`/api/v1/timetable/${created.body.data._id}`).set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(404);
    expect(res.body.data).toBeUndefined();
    expect(res.text).not.toContain('Intro EC Unlisted');
  });

  it('student blocked from creating entries', async () => {
    const res = await request(app).post('/api/v1/timetable')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(slot({ dayOfWeek: 'Fri' }));
    expect(res.status).toBe(403);
  });
});

describe('faculty scoping', () => {
  it('faculty sees taught entries', async () => {
    const res = await request(app).get('/api/v1/timetable').set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((e) => String(e._id));
    expect(ids).toContain(String(entryCSE.body.data._id));
  });
});
