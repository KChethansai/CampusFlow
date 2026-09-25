// auth.test: permanent authentication/session regression guard.
// Covers: valid login, invalid credentials, unverified/inactive rejection,
// /auth/me, refresh rotation + reuse detection, logout revocation,
// password-change session invalidation, DB role re-check.
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';

jest.setTimeout(60000);

let mongod;
let institution;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  institution = await Institution.create({
    name: 'Auth Institute', code: 'AUTH', emailDomainPattern: 'auth.edu',
    contactEmail: 'auth@auth.edu',
  });
  const mk = (over) => User.create({
    password: 'Password@123', isEmailVerified: true, isActive: true, ...over,
  });
  await mk({ name: 'Admin', email: 'admin@auth.edu', role: 'college_admin', institution: institution._id });
  await mk({ name: 'Student', email: 'student@auth.edu', role: 'student', institution: institution._id, profile: { rollNumber: 'A001' } });
  await mk({ name: 'Unverified', email: 'unverified@auth.edu', role: 'student', institution: institution._id, isEmailVerified: false });
  await mk({ name: 'Inactive', email: 'inactive@auth.edu', role: 'student', institution: institution._id, isActive: false });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const login = (email, password = 'Password@123') =>
  request(app).post('/api/v1/auth/login').send({ email, password });

describe('login', () => {
  it('accepts valid credentials and never leaks the password hash', async () => {
    const res = await login('admin@auth.edu');
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it('rejects wrong password and unknown email with 401', async () => {
    expect((await login('admin@auth.edu', 'Wrong@123')).status).toBe(401);
    expect((await login('nobody@auth.edu')).status).toBe(401);
  });

  it('rejects unverified email with 403', async () => {
    const res = await login('unverified@auth.edu');
    expect(res.status).toBe(403);
  });

  it('rejects inactive account with 403', async () => {
    const res = await login('inactive@auth.edu');
    expect(res.status).toBe(403);
  });
});

describe('/auth/me', () => {
  // Reuses the admin token from the login test: this file must stay under the
  // credential rate limit (10 logins / 15 min per fresh app instance).
  let adminToken;

  beforeAll(async () => {
    adminToken = (await login('admin@auth.edu')).body.accessToken;
  });

  it('returns the current user for a valid token', async () => {
    const res = await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@auth.edu');
  });

  it('rejects missing and malformed tokens with 401', async () => {
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalidtoken')).status).toBe(401);
  });

  it('rejects tokens for deactivated accounts (role/active re-checked from DB)', async () => {
    await User.updateOne({ email: 'admin@auth.edu' }, { isActive: false });
    const res = await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
    await User.updateOne({ email: 'admin@auth.edu' }, { isActive: true });
  });
});

describe('refresh rotation', () => {
  it('rotates refresh tokens and rejects reuse of the old one', async () => {
    const { body } = await login('admin@auth.edu');
    const first = await request(app).post('/api/v1/auth/refresh')
      .send({ refreshToken: body.refreshToken });
    expect(first.status).toBe(200);
    expect(first.body.refreshToken).not.toBe(body.refreshToken);
    const reuse = await request(app).post('/api/v1/auth/refresh')
      .send({ refreshToken: body.refreshToken });
    expect(reuse.status).toBe(401);
  });

  it('rejects missing and forged refresh tokens', async () => {
    expect((await request(app).post('/api/v1/auth/refresh').send({})).status).toBe(400);
    expect((await request(app).post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid.token.here' })).status).toBe(401);
  });
});

describe('logout', () => {
  it('revokes the session so the refresh token stops working', async () => {
    const { body } = await login('admin@auth.edu');
    const out = await request(app).post('/api/v1/auth/logout')
      .send({ refreshToken: body.refreshToken });
    expect(out.status).toBe(200);
    expect((await request(app).post('/api/v1/auth/refresh')
      .send({ refreshToken: body.refreshToken })).status).toBe(401);
  });
});

describe('password-change session invalidation', () => {
  it('invalidates pre-change access and refresh tokens', async () => {
    await User.create({
      name: 'Pwd User', email: 'pwd@auth.edu', password: 'OldPass@123',
      role: 'student', institution: institution._id,
      isEmailVerified: true, isActive: true,
    });
    const before = await login('pwd@auth.edu', 'OldPass@123');
    // Wait past the 1s passwordChangedAt backdate skew so the old token predates it.
    await new Promise((r) => setTimeout(r, 1200));
    const change = await request(app).patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${before.body.accessToken}`)
      .send({ currentPassword: 'OldPass@123', newPassword: 'NewPass@456' });
    expect(change.status).toBe(200);
    expect((await login('pwd@auth.edu', 'NewPass@456')).status).toBe(200);
    expect((await request(app).post('/api/v1/auth/refresh')
      .send({ refreshToken: before.body.refreshToken })).status).toBe(401);
    expect((await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${before.body.accessToken}`)).status).toBe(401);
  });
});
