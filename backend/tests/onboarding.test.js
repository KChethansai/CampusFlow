// onboarding.test: server-authoritative mandatory onboarding contract.
// Regression guard for the real production bug: existing users must never be
// routed to the questionnaire because of missing/stale browser state.
// /auth/me is the sole authority; PATCH /users/me/onboarding is the sole
// mutator; localStorage is never an authorization source.
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';

jest.setTimeout(60000);

let mongod;
let completeToken;
let incompleteToken;
let facultyToken;

const login = async (email, password = 'Password@123') => {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.accessToken;
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const inst = await Institution.create({ name: 'Onb Inst', code: 'OI', contactEmail: 'oi@t.edu', emailDomainPattern: 't.edu' });
  const dept = await Department.create({ name: 'CSE', code: 'CSE', institution: inst._id });
  const course = await Course.create({ name: 'B CSE', code: 'BCSE', department: dept._id, institution: inst._id, durationYears: 4, totalSemesters: 8 });
  const mk = (over) => User.create({ password: 'Password@123', isEmailVerified: true, isActive: true, ...over });
  await mk({
    name: 'Complete Student', email: 'complete@t.edu', role: 'student',
    institution: inst._id, department: dept._id,
    profile: { rollNumber: 'CSE001', course: course._id, semester: 5, section: 'A', batchYear: 2026, cgpa: 8.2 },
  });
  await mk({ name: 'New Student', email: 'new@t.edu', role: 'student', institution: inst._id });
  await mk({ name: 'Faculty', email: 'fac@t.edu', role: 'faculty', institution: inst._id, department: dept._id });

  completeToken = await login('complete@t.edu');
  incompleteToken = await login('new@t.edu');
  facultyToken = await login('fac@t.edu');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('server-authoritative onboarding', () => {
  it('/auth/me exposes onboardingCompleted for self scope', async () => {
    const res = await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${completeToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.user.onboardingCompleted).toBe('boolean');
  });

  it('flags genuinely incomplete users', async () => {
    const res = await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${incompleteToken}`);
    expect(res.body.user.onboardingCompleted).toBe(false);
  });

  it('PATCH /users/me/onboarding sets the flag and it persists server-side', async () => {
    const res = await request(app).patch('/api/v1/users/me/onboarding')
      .set('Authorization', `Bearer ${incompleteToken}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.data.onboardingCompleted).toBe(true);
    const me = await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${incompleteToken}`);
    expect(me.body.user.onboardingCompleted).toBe(true);
  });

  it('a fresh login still bypasses onboarding after completion (no localStorage dependence)', async () => {
    // Fresh session = fresh browser: no cookies/storage carried over, yet the
    // server record alone must keep the user out of the questionnaire.
    const fresh = await login('new@t.edu');
    const me = await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${fresh}`);
    expect(me.body.user.onboardingCompleted).toBe(true);
  });

  it('rejects malformed completion bodies (exact-body contract)', async () => {
    expect((await request(app).patch('/api/v1/users/me/onboarding')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ completed: true, department: 'CSE' })).status).toBe(400);
    expect((await request(app).patch('/api/v1/users/me/onboarding')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ completed: false })).status).toBe(400);
  });

  it('requires authentication (no anonymous bypass)', async () => {
    expect((await request(app).patch('/api/v1/users/me/onboarding')
      .send({ completed: true })).status).toBe(401);
  });

  it('never mutates profile data through the onboarding endpoint', async () => {
    const res = await request(app).patch('/api/v1/users/me/onboarding')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    const me = await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(me.body.user.profile.cgpa).toBeUndefined();
  });
});
