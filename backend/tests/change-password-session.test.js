import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';

let mongod;
let accessToken;
let refreshToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const institution = await Institution.create({
    name: 'Password Change Institute',
    code: 'PWDCHG',
    emailDomainPattern: 'test.edu',
    address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    contactEmail: 'pwdchg@test.edu'
  });

  await User.create({
    name: 'Password Change User',
    email: 'pwdchange@test.edu',
    password: 'OldPass@123',
    role: 'student',
    institution: institution._id,
    isEmailVerified: true,
    isActive: true
  });

  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'pwdchange@test.edu', password: 'OldPass@123' });
  expect(login.status).toBe(200);
  accessToken = login.body.accessToken;
  refreshToken = login.body.refreshToken;

  // Wait past the UserModel passwordChangedAt 1s backdate skew so the
  // pre-change access token (iat in seconds) deterministically predates it.
  await new Promise((r) => setTimeout(r, 1200));

  const change = await request(app)
    .patch('/api/v1/auth/change-password')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ currentPassword: 'OldPass@123', newPassword: 'NewPass@456' });
  expect(change.status).toBe(200);
  expect(change.body.success).toBe(true);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Change password session revocation', () => {
  it('returns 200 and the new password works for login', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pwdchange@test.edu', password: 'NewPass@456' });
    expect(login.status).toBe(200);
    expect(login.body.accessToken).toBeDefined();
  });

  it('rejects the pre-change refresh token after the change', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(res.status).toBe(401);
  });

  it('rejects the pre-change access token after the change', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(401);
  });
});
