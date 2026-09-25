// userProtection.test: super_admin platform-role protection + placement attendance scope.
// Server-side enforcement is the source of truth; frontend hiding is presentation only.
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';

jest.setTimeout(60000);

let mongod;
let superAdminId, collegeAdminId, facultyId;
let tSuper, tCollegeAdmin;

const login = async (email, password = 'Password@123') =>
  (await request(app).post('/api/v1/auth/login').send({ email, password })).body.accessToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const inst = await Institution.create({ name: 'Prot', code: 'PROT', emailDomainPattern: 'prot.edu' });
  const mk = (over) => User.create({ password: 'Password@123', isEmailVerified: true, isActive: true, ...over });
  const sa = await mk({ name: 'Root', email: 'root@prot.edu', role: 'super_admin', institution: inst._id });
  await mk({ name: 'Admin', email: 'admin@prot.edu', role: 'college_admin', institution: inst._id });
  await mk({ name: 'Fac', email: 'fac@prot.edu', role: 'faculty', institution: inst._id });
  await mk({ name: 'Place', email: 'place@prot.edu', role: 'placement_officer', institution: inst._id });
  superAdminId = sa._id;
  collegeAdminId = (await User.findOne({ email: 'admin@prot.edu' }))._id;
  facultyId = (await User.findOne({ email: 'fac@prot.edu' }))._id;

  tSuper = await login('root@prot.edu');
  tCollegeAdmin = await login('admin@prot.edu');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const auth = (t) => ({ Authorization: `Bearer ${t}` });
const otherId = () => new mongoose.Types.ObjectId().toString();

describe('super_admin platform protection', () => {
  it('college_admin list excludes super_admin accounts', async () => {
    const res = await request(app).get('/api/v1/users').set(auth(tCollegeAdmin));
    expect(res.status).toBe(200);
    const roles = (res.body.data || []).map((u) => u.role);
    expect(roles).not.toContain('super_admin');
  });

  it('college_admin cannot retrieve a super_admin profile (404-masked)', async () => {
    const res = await request(app).get(`/api/v1/users/${superAdminId}`).set(auth(tCollegeAdmin));
    expect(res.status).toBe(404);
    expect(res.body.data).toBeUndefined();
  });

  it('college_admin cannot modify a super_admin (404-masked)', async () => {
    const res = await request(app).patch(`/api/v1/users/${superAdminId}`)
      .set(auth(tCollegeAdmin)).send({ name: 'Hacked' });
    expect(res.status).toBe(404);
    expect((await User.findById(superAdminId)).name).toBe('Root');
  });

  it('college_admin cannot deactivate a super_admin', async () => {
    const res = await request(app).delete(`/api/v1/users/${superAdminId}`).set(auth(tCollegeAdmin));
    expect(res.status).toBe(404);
    expect((await User.findById(superAdminId)).isActive).toBe(true);
  });

  it('college_admin cannot change any user role (403)', async () => {
    const res = await request(app).patch(`/api/v1/users/${facultyId}`)
      .set(auth(tCollegeAdmin)).send({ role: 'hod' });
    expect(res.status).toBe(403);
  });

  it('super_admin retains full admin visibility and control', async () => {
    const list = await request(app).get('/api/v1/users').set(auth(tSuper));
    expect(list.status).toBe(200);
    expect(list.body.data.map((u) => u.role)).toContain('super_admin');
    const get = await request(app).get(`/api/v1/users/${collegeAdminId}`).set(auth(tSuper));
    expect(get.status).toBe(200);
  });

  it('legitimate same-tenant college_admin operations still work', async () => {
    const get = await request(app).get(`/api/v1/users/${facultyId}`).set(auth(tCollegeAdmin));
    expect(get.status).toBe(200);
    const patch = await request(app).patch(`/api/v1/users/${facultyId}`)
      .set(auth(tCollegeAdmin)).send({ name: 'Fac Updated' });
    expect(patch.status).toBe(200);
    expect(patch.body.data.name).toBe('Fac Updated');
  });

  it('lower roles cannot reach user mutation endpoints (403)', async () => {
    const tFac = await login('fac@prot.edu');
    expect((await request(app).patch(`/api/v1/users/${facultyId}`)
      .set(auth(tFac)).send({ name: 'x' })).status).toBe(403);
    expect((await request(app).delete(`/api/v1/users/${facultyId}`)
      .set(auth(tFac))).status).toBe(403);
  });
});

describe('placement_officer attendance scope', () => {
  it('placement_officer is denied session list and single-session reads', async () => {
    const tPlace = await login('place@prot.edu');
    expect((await request(app).get('/api/v1/attendance').set(auth(tPlace))).status).toBe(403);
    expect((await request(app).get(`/api/v1/attendance/${otherId()}`).set(auth(tPlace))).status).toBe(403);
  });
});
