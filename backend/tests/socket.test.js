import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import {
  authenticateSocket,
  emitToInstitution,
  emitToUser,
  setIO,
} from '../config/socket.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';

jest.setTimeout(60000);

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const useSocketSrc = fs.readFileSync(
  path.join(repoRoot, 'frontend', 'src', 'store', 'useSocket.js'),
  'utf8'
);

// Backend realtime emit call sites — every literal event name must be
// subscribed frontend-side, otherwise the emit is silently dropped.
const EMIT_SITES = [
  'backend/controllers/attendancecontroller.js',
  'backend/controllers/requestcontroller.js',
  'backend/controllers/announcementcontroller.js',
  'backend/services/notification.service.js',
];

const backendEvents = () => {
  const found = new Set();
  for (const rel of EMIT_SITES) {
    const src = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
    for (const m of src.matchAll(/publishRealtimeTo(?:Institution|User)\([^,]+,\s*'([^']+)'/g)) {
      found.add(m[1]);
    }
    for (const m of src.matchAll(/\.emit\(\s*'([^']+)'/g)) {
      found.add(m[1]);
    }
    // Announcement dispatch takes the event as a variable — capture explicit
    // event args and the default parameter value as well.
    for (const m of src.matchAll(/dispatchAnnouncementRealtime\([^()]*,\s*'([^']+)'\s*\)/g)) {
      found.add(m[1]);
    }
    for (const m of src.matchAll(/eventName\s*=\s*'([^']+)'/g)) {
      found.add(m[1]);
    }
  }
  return [...found];
};

const frontendChannels = () => {
  const m = useSocketSrc.match(/\[([^\]]*'[\w:-]+'[^\]]*)\]\.forEach\(\(channel\)/);
  if (!m) return [];
  return [...m[1].matchAll(/'([\w:-]+)'/g)].map((x) => x[1]);
};

describe('Socket.IO realtime contract', () => {
  let mongod;
  let inst;
  let student;
  let token;

  const fakeIO = () => {
    const calls = [];
    return {
      calls,
      to(room) {
        return {
          emit: (event, payload) => {
            calls.push({ room, event, payload });
          },
        };
      },
    };
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    inst = await Institution.create({
      name: 'Socket Institute',
      code: 'SOCK',
      emailDomainPattern: 'sock.edu',
    });
    student = await User.create({
      name: 'Socket Student',
      email: 'sock@sock.edu',
      password: 'Student@123',
      role: 'student',
      institution: inst._id,
      isEmailVerified: true,
      isActive: true,
    });
    token = (
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'sock@sock.edu', password: 'Student@123' })
    ).body.accessToken;
  });

  afterAll(async () => {
    setIO(null);
    await mongoose.disconnect();
    await mongod.stop();
  });

  afterEach(() => {
    setIO(null);
  });

  it('subscribes frontend to every event the backend emits (no silent drops)', () => {
    const events = backendEvents();
    expect(events.length).toBeGreaterThan(0);
    const channels = frontendChannels();
    for (const event of events) {
      expect(channels).toContain(event);
    }
  });

  it('subscribes to announcement:updated emitted by the update path', () => {
    expect(frontendChannels()).toContain('announcement:updated');
  });

  it('re-reads the access token on every (re)handshake instead of pinning a stale value', () => {
    // Static `socket.auth = { token: ... }` pins the refreshed token; the next
    // reconnect after it expires fails. Function form re-reads storage.
    expect(useSocketSrc).toMatch(/socket\.auth\s*=\s*\(cb\)\s*=>/);
    expect(useSocketSrc).not.toMatch(/socket\.auth\s*=\s*\{\s*token/);
  });

  it('emitToInstitution targets only the institution room (no cross-tenant broadcast)', () => {
    const io = fakeIO();
    setIO(io);
    emitToInstitution(String(inst._id), 'attendance:marked', { sessionId: 's1' });
    expect(io.calls).toHaveLength(1);
    expect(io.calls[0].room).toBe(`institution:${inst._id}`);
    expect(io.calls[0].event).toBe('attendance:marked');
  });

  it('emitToUser targets only that user room', () => {
    const io = fakeIO();
    setIO(io);
    emitToUser(String(student._id), 'notification:new', { hello: 1 });
    expect(io.calls).toHaveLength(1);
    expect(io.calls[0].room).toBe(`user:${student._id}`);
  });

  it('accepts a valid handshake token and scopes rooms from the DB record', async () => {
    const socket = { handshake: { auth: { token } }, data: {} };
    let err = 'unset';
    await authenticateSocket(socket, (e) => {
      err = e;
    });
    expect(err).toBeUndefined();
    expect(socket.data.user.id).toBe(String(student._id));
    expect(socket.data.user.institution).toBe(String(inst._id));
    expect(socket.data.user.role).toBe('student');
  });

  it('rejects handshake with missing token', async () => {
    const socket = { handshake: {}, data: {} };
    let err = null;
    await authenticateSocket(socket, (e) => {
      err = e;
    });
    expect(err).toBeInstanceOf(Error);
  });

  it('rejects handshake with invalid token signature', async () => {
    const socket = { handshake: { auth: { token: 'bad.jwt.token' } }, data: {} };
    let err = null;
    await authenticateSocket(socket, (e) => {
      err = e;
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Not authorized, token failed');
  });

  it('rejects handshake token via query string (auth.token only)', async () => {
    const socket = { handshake: { query: { token } }, data: {} };
    let err = null;
    await authenticateSocket(socket, (e) => {
      err = e;
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Not authorized, no token provided');
  });
});
