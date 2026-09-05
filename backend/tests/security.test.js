// security.test: adversarial coverage for auth/authz hardening — privilege
// escalation, cross-tenant access (IDOR/BOLA), mass assignment, token trust.
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';
import { NotificationModel as Notification } from '../models/NotificationModel.js';

let mongod;
let instA;
let instB;
let adminA;
let superA;
let studentA;
let studentB;
let courseB;
let adminAToken;
let superAToken;
let studentAToken;
let studentBToken;

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

  instA = await Institution.create({ name: 'Inst A', code: 'IA', contactEmail: 'a@t.edu' });
  instB = await Institution.create({ name: 'Inst B', code: 'IB', contactEmail: 'b@t.edu' });

  const mk = (over) => User.create({ password: 'Password@123', isEmailVerified: true, isActive: true, ...over });
  adminA = await mk({ name: 'Admin A', email: 'a.admin@t.edu', role: 'college_admin', institution: instA._id });
  superA = await mk({ name: 'Super A', email: 'a.super@t.edu', role: 'super_admin', institution: instA._id });
  studentA = await mk({ name: 'Student A', email: 'a.student@t.edu', role: 'student', institution: instA._id });
  studentB = await mk({ name: 'Student B', email: 'b.student@t.edu', role: 'student', institution: instB._id });
  const deptB = await Department.create({ name: 'Dept B', code: 'DB', institution: instB._id });
  courseB = await Course.create({ name: 'B Course', code: 'BC1', department: deptB._id, institution: instB._id, durationYears: 4, totalSemesters: 8 });

  adminAToken = await login('a.admin@t.edu');
  superAToken = await login('a.super@t.edu');
  studentAToken = await login('a.student@t.edu');
  studentBToken = await login('b.student@t.edu');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('privilege escalation', () => {
  it('college_admin cannot register a super_admin', async () => {
    const res = await request(app).post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ name: 'Evil', email: 'evil@t.edu', password: 'Password@123', role: 'super_admin', institution: instA._id });
    expect(res.status).toBe(403);
  });

  it('super_admin can register a super_admin', async () => {
    const res = await request(app).post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${superAToken}`)
      .send({ name: 'Mini', email: 'mini@t.edu', password: 'Password@123', role: 'super_admin', institution: instA._id });
    expect(res.status).toBe(201);
    expect(res.body.user.password).toBeUndefined();
  });

  it('college_admin register is forced into their own institution', async () => {
    const res = await request(app).post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ name: 'Trap', email: 'trap@t.edu', password: 'Password@123', role: 'faculty', institution: instB._id });
    expect(res.status).toBe(201);
    expect(String(res.body.user.institution)).toBe(String(instA._id));
  });

  it('college_admin cannot escalate a user to super_admin via PATCH', async () => {
    const res = await request(app).patch(`/api/v1/users/${studentA._id}`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ role: 'super_admin', institution: instB._id });
    expect(res.status).toBe(403);
    const fresh = await User.findById(studentA._id);
    expect(fresh.role).toBe('student');
    expect(String(fresh.institution)).toBe(String(instA._id));
  });

  it('password updated via PATCH is hashed, not plaintext', async () => {
    const res = await request(app).patch(`/api/v1/users/${studentA._id}`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({ name: 'Student A2', password: 'Newpass@123' });
    expect(res.status).toBe(200);
    const raw = await User.findById(studentA._id).select('+password');
    expect(raw.password).not.toBe('Newpass@123');
    // new password works at login
    const loginRes = await request(app).post('/api/v1/auth/login')
      .send({ email: 'a.student@t.edu', password: 'Newpass@123' });
    expect(loginRes.status).toBe(200);
  });
});

describe('cross-tenant isolation', () => {
  it('tenant A admin cannot read tenant B course', async () => {
    const res = await request(app).get(`/api/v1/courses/${courseB._id}`)
      .set('Authorization', `Bearer ${adminAToken}`);
    expect(res.status).toBe(404);
  });

  it('student B notification cannot be marked read by student A', async () => {
    // NOTE: studentA's original token died with the password change above
    // (expected: password rotation invalidates sessions) — log in fresh.
    const freshA = await login('a.student@t.edu', 'Newpass@123');
    const note = await Notification.create({ recipient: studentB._id, title: 'Hi B', message: 'secret' });
    const res = await request(app).patch(`/api/v1/notifications/${note._id}/read`)
      .set('Authorization', `Bearer ${freshA}`);
    expect(res.status).toBe(404);
    const own = await request(app).patch(`/api/v1/notifications/${note._id}/read`)
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(own.status).toBe(200);
  });

  it('deactivated user token is rejected', async () => {
    const temp = await User.create({ name: 'Temp', email: 'temp@t.edu', password: 'Password@123', role: 'student', institution: instA._id, isEmailVerified: true, isActive: true });
    const token = await login('temp@t.edu');
    await User.findByIdAndUpdate(temp._id, { isActive: false });
    const res = await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('refresh with an access token is rejected (type confusion)', async () => {
    const res = await request(app).post('/api/v1/auth/refresh')
      .send({ refreshToken: adminAToken });
    expect(res.status).toBe(401);
  });
});
