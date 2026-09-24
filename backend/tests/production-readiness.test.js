import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { RefreshTokenModel as RefreshToken } from '../models/RefreshTokenModel.js';
import { signAccessToken, signRefreshToken, sha256 } from '../utils/token.js';
import { authenticateSocket } from '../config/socket.js';

jest.setTimeout(60000);

describe('Production Readiness & Hardening Audit Matrix', () => {
  let mongod;
  let inst;
  let dept;
  let user;
  let studentUser;
  let token;
  let studentToken;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    inst = await Institution.create({
      name: 'Readiness University',
      code: 'RUNIV',
      emailDomainPattern: 'runiv.edu'
    });

    dept = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      institution: inst._id
    });

    user = await User.create({
      name: 'Admin User',
      email: 'admin@runiv.edu',
      password: 'Password@123',
      role: 'college_admin',
      institution: inst._id,
      department: dept._id,
      isEmailVerified: true,
      isActive: true,
      passwordChangedAt: new Date(Date.now() - 60000)
    });

    studentUser = await User.create({
      name: 'Student User',
      email: 'student@runiv.edu',
      password: 'Password@123',
      role: 'student',
      institution: inst._id,
      department: dept._id,
      isEmailVerified: true,
      isActive: true,
      passwordChangedAt: new Date(Date.now() - 60000)
    });

    token = signAccessToken(user);
    studentToken = signAccessToken(studentUser);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  // ── 1. AUTH HARDENING: COOKIES, REFRESH ROTATION, GRACE PERIOD ─────────────
  describe('Authentication & Session Hardening', () => {
    it('login sets HttpOnly refreshToken cookie alongside JSON response', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@runiv.edu', password: 'Password@123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie.toLowerCase()).toContain('httponly');
    });

    it('refresh works via HttpOnly cookie without body refreshToken', async () => {
      // Create fresh token for this user
      const rawRefreshToken = signRefreshToken(user);
      await RefreshToken.create({
        user: user._id,
        tokenHash: sha256(rawRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000)
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refreshToken=${rawRefreshToken}`])
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();

      // Should set rotated cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.find((c) => c.startsWith('refreshToken='))).toBeDefined();
    });

    it('concurrent refresh race within grace period (15s) returns 401 without revoking all sessions', async () => {
      const initialRefreshToken = signRefreshToken(user);
      const initialDoc = await RefreshToken.create({
        user: user._id,
        tokenHash: sha256(initialRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000)
      });

      // Request 1: rotates initialRefreshToken to replacedToken
      const res1 = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });
      expect(res1.status).toBe(200);
      const replacedToken = res1.body.refreshToken;

      // Request 2: concurrent request arrives shortly after with the already-rotated initialRefreshToken
      const res2 = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });

      expect(res2.status).toBe(401);
      expect(res2.body.message).toContain('Session recently refreshed');

      // Crucial verification: the newly replaced session was NOT destroyed!
      const activeSession = await RefreshToken.findOne({
        user: user._id,
        tokenHash: sha256(replacedToken),
        revokedAt: { $exists: false }
      });
      expect(activeSession).not.toBeNull();
    });

    it('reuse of old token after grace period triggers full session revocation', async () => {
      const oldRefreshToken = signRefreshToken(user);
      await RefreshToken.create({
        user: user._id,
        tokenHash: sha256(oldRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        revokedAt: new Date(Date.now() - 30000) // Revoked 30s ago (beyond grace)
      });

      // Create an active session
      const currentRefreshToken = signRefreshToken(user);
      await RefreshToken.create({
        user: user._id,
        tokenHash: sha256(currentRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000)
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Token reuse detected');

      // All sessions for this user should now be revoked
      const remainingActive = await RefreshToken.find({
        user: user._id,
        revokedAt: { $exists: false }
      });
      expect(remainingActive.length).toBe(0);
    });

    it('logout via cookie revokes DB session and clears the cookie', async () => {
      const logoutRefreshToken = signRefreshToken(user);
      await RefreshToken.create({
        user: user._id,
        tokenHash: sha256(logoutRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000)
      });

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', [`refreshToken=${logoutRefreshToken}`])
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const stored = await RefreshToken.findOne({
        user: user._id,
        tokenHash: sha256(logoutRefreshToken)
      });
      expect(stored.revokedAt).toBeDefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const clearedCookie = cookies.find((c) => c.startsWith('refreshToken=;'));
      expect(clearedCookie).toBeDefined();
    });

    it('logout succeeds with an expired access token when the refresh session is valid', async () => {
      const staleRefreshToken = signRefreshToken(user);
      await RefreshToken.create({
        user: user._id,
        tokenHash: sha256(staleRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000)
      });

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer expired.access.token')
        .send({ refreshToken: staleRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const stored = await RefreshToken.findOne({
        user: user._id,
        tokenHash: sha256(staleRefreshToken)
      });
      expect(stored.revokedAt).toBeDefined();
    });

    it('logout is idempotent without any token and still clears the cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.find((c) => c.startsWith('refreshToken=;'))).toBeDefined();
    });

    it('unsafe Mongo-operator payloads are rejected with a consistent error shape', async () => {
      const { rejectUnsafePayload } = await import('../config/security.js');
      const req = { body: { email: { $gt: '' } }, params: {}, query: {} };
      let statusCode = null;
      let payload = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return { json: (body) => { payload = body; } };
        }
      };
      let nextCalled = false;
      rejectUnsafePayload(req, res, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(statusCode).toBe(400);
      expect(payload.success).toBe(false);
      expect(payload.message).toBe('Invalid request payload');
    });
  });

  // ── 2. INPUT VALIDATION & FAST REJECTION ON MALFORMED OBJECTIDS ───────────
  describe('Input Validation & Safe ObjectId Handling', () => {
    it('GET /api/v1/attendance/:id rejects invalid ObjectId with 400', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/not-a-valid-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid attendance session ID');
    });

    it('GET /api/v1/attendance/student/:studentId rejects invalid ObjectId with 400', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/student/bad-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid student ID');
    });

    it('GET /api/v1/job-applications/:id rejects invalid ObjectId with 400', async () => {
      const res = await request(app)
        .get('/api/v1/job-applications/bad-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid job application ID');
    });

    it('GET /api/v1/job-applications/drives/:driveId/eligibility rejects invalid ObjectId with 400', async () => {
      const res = await request(app)
        .get('/api/v1/job-applications/drives/invalid-id/eligibility')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid job drive ID');
    });

    it('GET /api/v1/enrollments/:id rejects invalid ObjectId with 400', async () => {
      const res = await request(app)
        .get('/api/v1/enrollments/invalid-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid enrollment ID');
    });

    it('GET /api/v1/requests/:id rejects invalid ObjectId with 400', async () => {
      const res = await request(app)
        .get('/api/v1/requests/invalid-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid request ID');
    });

    it('GET /api/v1/ai-reports/:id/stream rejects invalid ObjectId with 400', async () => {
      const res = await request(app)
        .get('/api/v1/ai-reports/invalid-id/stream')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid report ID');
    });
  });

  // ── 3. SOCKET.IO AUTHENTICATION MIDDLEWARE ─────────────────────────────────
  describe('Socket.IO Authentication Middleware', () => {
    it('authenticates valid access token and assigns tenant and role data', async () => {
      const fakeSocket = {
        handshake: { auth: { token } },
        data: {}
      };
      let error = null;
      await authenticateSocket(fakeSocket, (err) => { error = err; });

      expect(error).toBeUndefined();
      expect(fakeSocket.data.user).toBeDefined();
      expect(fakeSocket.data.user.id).toBe(String(user._id));
      expect(fakeSocket.data.user.role).toBe('college_admin');
      expect(fakeSocket.data.user.institution).toBe(String(inst._id));
    });

    it('rejects socket connection when token is absent', async () => {
      const fakeSocket = {
        handshake: { auth: {} },
        data: {}
      };
      let error = null;
      await authenticateSocket(fakeSocket, (err) => { error = err; });

      expect(error).toBeDefined();
      expect(error.message).toContain('Not authorized, no token provided');
    });

    it('rejects socket connection when token is invalid or expired', async () => {
      const fakeSocket = {
        handshake: { auth: { token: 'invalid.token.payload' } },
        data: {}
      };
      let error = null;
      await authenticateSocket(fakeSocket, (err) => { error = err; });

      expect(error).toBeDefined();
      expect(error.message).toContain('Not authorized, token failed');
    });
  });
});
