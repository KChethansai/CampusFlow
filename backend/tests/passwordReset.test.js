import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Force the "SMTP unconfigured" delivery path deterministically: config/env.js
// snapshots SMTP config at import time, and dotenv never overrides keys that are
// already present in process.env — so blank these before importing app.
const SMTP_KEYS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
const original = {};
SMTP_KEYS.forEach((k) => {
  original[k] = process.env[k];
  process.env[k] = '';
});

const { default: app } = await import('../app.js');
const { UserModel: User } = await import('../models/UserModel.js');
const { InstitutionModel: Institution } = await import('../models/InstitutionModel.js');
const { NotificationModel: Notification } = await import('../models/NotificationModel.js');

let mongod;
let student;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const institution = await Institution.create({
    name: 'Reset Test Institute',
    code: 'RESET',
    address: { city: 'Delhi', state: 'DL', country: 'India' },
    contactEmail: 'reset@test.edu'
  });
  student = await User.create({
    name: 'Reset Student',
    email: 'reset.student@test.edu',
    password: 'Password@123',
    role: 'student',
    institution: institution._id,
    isEmailVerified: true,
    isActive: true
  });
});

afterAll(async () => {
  SMTP_KEYS.forEach((k) => {
    if (original[k] === undefined) delete process.env[k];
    else process.env[k] = original[k];
  });
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

const requestReset = () =>
  request(app).post('/api/v1/auth/forgot-password').send({ email: 'reset.student@test.edu' });

describe('Password reset delivery (SMTP unconfigured)', () => {
  it('stores a token and delivers it via an in-app notification', async () => {
    const res = await requestReset();
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('reset link sent');

    const notif = await Notification.findOne({
      recipient: student._id,
      title: 'Password Reset Request'
    }).sort('-createdAt');
    expect(notif).toBeTruthy();
    expect(notif.message).toMatch(/valid for 10 minutes/);
  });

  it('never reveals whether an account exists', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'does.not.exist@test.edu' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('reset link sent');
  });

  it('resets the password end-to-end with the delivered token and rejects a stale one', async () => {
    await requestReset();
    const notif = await Notification.findOne({
      recipient: student._id,
      title: 'Password Reset Request'
    }).sort('-createdAt');
    const token = notif.message.match(/token: ([a-f0-9]{64})/)?.[1];
    expect(token).toBeTruthy();

    const stale = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'f'.repeat(64), password: 'NewPass@456' });
    expect(stale.status).toBe(400);

    const reset = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token, password: 'NewPass@456' });
    expect(reset.status).toBe(200);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'reset.student@test.edu', password: 'NewPass@456' });
    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeTruthy();
  });
});
