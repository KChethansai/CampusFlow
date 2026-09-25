// socket.test: permanent Socket.IO handshake + scoping guard.
// Covers: authenticated handshake, missing/invalid token rejection,
// inactive-user rejection, tenant/room scoping, targeted delivery.
// Uses a live server + socket.io-client round-trip (behavior, not mocks).
import http from 'http';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import { io as clientIO } from 'socket.io-client';
import app from '../app.js';
import {
  authenticateSocket,
  emitToInstitution,
  emitToUser,
  setIO,
  initSocket,
} from '../config/socket.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';

jest.setTimeout(60000);

let mongod;
let inst;
let student;
let token;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  inst = await Institution.create({ name: 'Sock Inst', code: 'SOCK', emailDomainPattern: 'sock.edu' });
  student = await User.create({
    name: 'Sock Student', email: 'sock@sock.edu', password: 'Student@123',
    role: 'student', institution: inst._id, isEmailVerified: true, isActive: true,
  });
  token = (await request(app).post('/api/v1/auth/login')
    .send({ email: 'sock@sock.edu', password: 'Student@123' })).body.accessToken;
});

afterAll(async () => {
  setIO(null);
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(() => {
  setIO(null);
});

const runAuth = (socket) => new Promise((resolve) => {
  authenticateSocket(socket, (err) => resolve(err));
});

describe('socket handshake', () => {
  it('accepts a valid token and scopes identity from the DB record', async () => {
    const socket = { handshake: { auth: { token } }, data: {} };
    expect(await runAuth(socket)).toBeUndefined();
    expect(socket.data.user.id).toBe(String(student._id));
    expect(socket.data.user.institution).toBe(String(inst._id));
    expect(socket.data.user.role).toBe('student');
  });

  it('rejects missing and forged tokens', async () => {
    expect(await runAuth({ handshake: {}, data: {} })).toBeInstanceOf(Error);
    expect(await runAuth({ handshake: { auth: { token: 'bad.jwt.token' } }, data: {} })).toBeInstanceOf(Error);
  });

  it('rejects tokens passed via query string (auth.token only)', async () => {
    const err = await runAuth({ handshake: { query: { token } }, data: {} });
    expect(err).toBeInstanceOf(Error);
  });

  it('rejects deactivated users even with a signed token', async () => {
    await User.updateOne({ _id: student._id }, { isActive: false });
    const err = await runAuth({ handshake: { auth: { token } }, data: {} });
    expect(err).toBeInstanceOf(Error);
    await User.updateOne({ _id: student._id }, { isActive: true });
  });
});

describe('live room scoping + delivery', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = http.createServer(app);
    initSocket(server);
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('delivers institution and user events only to the scoped client', async () => {
    const socket = clientIO(`http://127.0.0.1:${port}`, { auth: { token } });
    const received = [];
    await new Promise((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
    });
    socket.on('attendance:marked', (p) => received.push(['inst', p]));
    socket.on('notification:new', (p) => received.push(['user', p]));
    // Give the server a tick to finish joining rooms after connect.
    await new Promise((r) => setTimeout(r, 300));
    emitToInstitution(String(inst._id), 'attendance:marked', { sessionId: 's1' });
    emitToUser(String(student._id), 'notification:new', { hello: 1 });
    emitToInstitution('000000000000000000000000', 'attendance:marked', { sessionId: 'other' });
    await new Promise((r) => setTimeout(r, 500));
    socket.disconnect();
    expect(received).toContainEqual(['inst', { sessionId: 's1' }]);
    expect(received).toContainEqual(['user', { hello: 1 }]);
    expect(received.some(([, p]) => p.sessionId === 'other')).toBe(false);
  });

  it('refuses live connections with a forged token', async () => {
    const socket = clientIO(`http://127.0.0.1:${port}`, {
      auth: { token: 'bad.jwt.token' },
      reconnection: false,
    });
    const err = await new Promise((resolve) => {
      socket.on('connect', () => resolve(null));
      socket.on('connect_error', (e) => resolve(e));
    });
    socket.disconnect();
    expect(err).not.toBeNull();
  });
});
