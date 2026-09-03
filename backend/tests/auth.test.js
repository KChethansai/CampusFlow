import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';

let mongod;
let institution;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  institution = await Institution.create({
    name: 'Test Institute',
    code: 'TEST',
    address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    contactEmail: 'test@test.edu'
  });

  await User.create({
    name: 'Admin User',
    email: 'admin@test.edu',
    password: 'Admin@123',
    role: 'college_admin',
    institution: institution._id,
    isEmailVerified: true,
    isActive: true
  });

  await User.create({
    name: 'Unverified User',
    email: 'unverified@test.edu',
    password: 'Password@123',
    role: 'student',
    institution: institution._id,
    isEmailVerified: false,
    isActive: true
  });

  await User.create({
    name: 'Inactive User',
    email: 'inactive@test.edu',
    password: 'Password@123',
    role: 'student',
    institution: institution._id,
    isEmailVerified: true,
    isActive: false
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Authentication API', () => {
  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.edu', password: 'Admin@123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe('admin@test.edu');
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.edu', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.edu', password: 'Password@123' });

      expect(res.status).toBe(401);
    });

    it('should reject unverified email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'unverified@test.edu', password: 'Password@123' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/verify/i);
    });

    it('should reject inactive account', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'inactive@test.edu', password: 'Password@123' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/deactivated/i);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.edu', password: 'Admin@123' });
      refreshToken = res.body.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.refreshToken).not.toBe(refreshToken);
    });

    it('should reject missing refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.edu', password: 'Admin@123' });
      accessToken = res.body.accessToken;
    });

    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('admin@test.edu');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.status).toBe(401);
    });
  });
});

describe('RBAC Middleware', () => {
  let adminToken;
  let studentToken;

  beforeAll(async () => {
    await User.create({
      name: 'Test Student',
      email: 'student@test.edu',
      password: 'Student@123',
      role: 'student',
      institution: institution._id,
      isEmailVerified: true,
      isActive: true,
      profile: { rollNumber: 'TST001' }
    });

    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.edu', password: 'Admin@123' });
    adminToken = adminRes.body.accessToken;

    const studentRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student@test.edu', password: 'Student@123' });
    studentToken = studentRes.body.accessToken;
  });

  it('should allow admin to access user management', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('should deny student access to user management', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });
});

describe('Health Check', () => {
  it('should return ok status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toBeDefined();
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent');

    expect(res.status).toBe(404);
  });
});