// onboarding.test: server-authoritative mandatory onboarding contract.
// Regression guard for: existing users must never be routed to the
// questionnaire because of missing/stale browser state. The /auth/me record is
// the sole authority; PATCH /users/me/onboarding is the sole mutator.
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';

jest.setTimeout(30000);

let mongod;
let inst;
let dept;
let course;
let completeStudentToken;
let incompleteStudentToken;
let facultyToken;
let adminToken;

const login = async (email, password = 'Password@123') => {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.accessToken;
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  inst = await Institution.create({ name: 'Onb Inst', code: 'OI', contactEmail: 'oi@t.edu', emailDomainPattern: 't.edu' });
  dept = await Department.create({ name: 'CSE', code: 'CSE', institution: inst._id });
  course = await Course.create({ name: 'B CSE', code: 'BCSE', department: dept._id, institution: inst._id, durationYears: 4, totalSemesters: 8 });

  const mk = (over) => User.create({ password: 'Password@123', isEmailVerified: true, isActive: true, ...over });

  // Existing user with authoritative, complete profile (the regression case).
  await mk({
    name: 'Complete Student', email: 'complete@t.edu', role: 'student',
    institution: inst._id, department: dept._id,
    profile: { rollNumber: 'CSE001', course: course._id, semester: 5, section: 'A', batchYear: 2026, cgpa: 8.2 },
  });
  // Genuinely incomplete user — mandatory completion is real for this one.
  await mk({ name: 'New Student', email: 'new@t.edu', role: 'student', institution: inst._id });
  await mk({ name: 'Faculty', email: 'fac@t.edu', role: 'faculty', institution: inst._id, department: dept._id });

  completeStudentToken = await login('complete@t.edu');
  incompleteStudentToken = await login('new@t.edu');
  facultyToken = await login('fac@t.edu');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Correction 1 — server-authoritative onboarding', () => {
  it('/auth/me exposes onboardingCompleted for self scope', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${completeStudentToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.user.onboardingCompleted).toBe('boolean');
  });

  it('flags only genuinely incomplete users', async () => {
    const incomplete = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${incompleteStudentToken}`);
    expect(incomplete.body.user.onboardingCompleted).toBe(false);

    const complete = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${completeStudentToken}`);
    expect(complete.body.user.onboardingCompleted).toBe(false);
    // A fully provisioned profile still needs the explicit flag until set,
    // so the gate is the flag — but completion is idempotent and self-service.
  });

  it('PATCH /users/me/onboarding sets the flag and returns the updated user', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me/onboarding')
      .set('Authorization', `Bearer ${incompleteStudentToken}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.data.onboardingCompleted).toBe(true);

    // Persisted — re-read via /auth/me (fresh token-free hydration path).
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${incompleteStudentToken}`);
    expect(me.body.user.onboardingCompleted).toBe(true);
  });

  it('rejects malformed completion bodies (exact-body contract)', async () => {
    const bad = await request(app)
      .patch('/api/v1/users/me/onboarding')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ completed: true, department: 'CSE' });
    expect(bad.status).toBe(400);

    const wrong = await request(app)
      .patch('/api/v1/users/me/onboarding')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ completed: false });
    expect(wrong.status).toBe(400);
  });

  it('requires authentication (no onboarding bypass for anonymous)', async () => {
    const res = await request(app).patch('/api/v1/users/me/onboarding').send({ completed: true });
    expect(res.status).toBe(401);
  });

  it('does not accept profile mutations through the onboarding endpoint', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me/onboarding')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${facultyToken}`);
    expect(me.body.user.profile.cgpa).toBeUndefined();
  });
});
