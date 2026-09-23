// bulk-users.test: A3 email pattern + A4 POST /users/bulk (JSON and CSV).
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { emailMatchesPattern } from '../utils/emailPattern.js';
import { signAccessToken } from '../utils/token.js';

let mongod;
let inst;
let other;
let dept;
let foreignDept;
let adminToken;
let superToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  inst = await Institution.create({ name: 'Bulk Institute', code: 'BULK', emailDomainPattern: 'test.edu' });
  other = await Institution.create({ name: 'Foreign Institute', code: 'FRN', emailDomainPattern: 'foreign.edu' });
  dept = await Department.create({ name: 'CSE', code: 'CSE', institution: inst._id });
  foreignDept = await Department.create({ name: 'Mech', code: 'MECH', institution: other._id });

  // Tokens minted directly (login endpoint is rate-limited).
  const admin = await User.create({ name: 'Bulk Admin', email: 'admin@test.edu', password: 'Password@123', role: 'college_admin', institution: inst._id, isEmailVerified: true, isActive: true });
  const superAdmin = await User.create({ name: 'Bulk Super', email: 'super@test.edu', password: 'Password@123', role: 'super_admin', institution: inst._id, isEmailVerified: true, isActive: true });
  adminToken = signAccessToken(admin);
  superToken = signAccessToken(superAdmin);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('emailMatchesPattern', () => {
  it('accepts exact and subdomain suffixes, case-insensitively', async () => {
    expect(emailMatchesPattern('a@test.edu', 'test.edu')).toBe(true);
    expect(emailMatchesPattern('a@dept.test.edu', 'test.edu')).toBe(true);
    expect(emailMatchesPattern('A@TEST.EDU', 'test.edu')).toBe(true);
  });

  it('rejects lookalike domains without aborting', async () => {
    expect(emailMatchesPattern('a@not-test.edu', 'test.edu')).toBe(false);
    expect(emailMatchesPattern('a@other.edu', 'test.edu')).toBe(false);
    expect(emailMatchesPattern('not-an-address', '.*')).toBe(true); // shape checked by caller, not here
    expect(emailMatchesPattern('', 'test.edu')).toBe(false);
    expect(emailMatchesPattern('a@test.edu', '')).toBe(false);
  });

  it('falls back to regex when the pattern has metacharacters', async () => {
    expect(emailMatchesPattern('123456@test.edu', '^[0-9]{6}@test\\.edu$')).toBe(true);
    expect(emailMatchesPattern('x123456@test.edu', '^[0-9]{6}@test\\.edu$')).toBe(false);
    expect(emailMatchesPattern('a@test.edu', '([')).toBe(false); // invalid regex never matches
  });
});

describe('POST /users/bulk (JSON)', () => {
  it('creates 1 good row and fails 1 bad-domain + 1 duplicate without aborting', async () => {
    await User.create({ name: 'Taken', email: 'taken@test.edu', password: 'Password@123', role: 'student', institution: inst._id, isEmailVerified: true });
    const res = await request(app).post('/api/v1/users/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ users: [
        { name: 'Good', email: 'good@test.edu', role: 'student', department: dept._id },
        { name: 'Bad Domain', email: 'bad@other.edu', role: 'student' },
        { name: 'Dupe', email: 'taken@test.edu', role: 'student' }
      ] });
    expect(res.status).toBe(207);
    expect(res.body.data.succeeded).toBe(1);
    expect(res.body.data.failed).toBe(2);
    expect(res.body.data.results[0].data.tempPassword).toBeDefined();
    expect(res.body.data.results[0].data.password).toBeUndefined();
    expect(await User.findOne({ email: 'good@test.edu' })).not.toBeNull();
    expect(await User.findOne({ email: 'bad@other.edu' })).toBeNull();
  });

  it('rejects a cross-tenant department row', async () => {
    const res = await request(app).post('/api/v1/users/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ users: [{ name: 'Foreign Dept', email: 'foreign.dept@test.edu', role: 'student', department: foreignDept._id }] });
    expect(res.status).toBe(207);
    expect(res.body.data.succeeded).toBe(0);
    expect(res.body.data.failed).toBe(1);
    expect(await User.findOne({ email: 'foreign.dept@test.edu' })).toBeNull();
  });

  it('lets super_admin place a row in another institution', async () => {
    const res = await request(app).post('/api/v1/users/bulk')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ users: [{ name: 'Guest', email: 'guest@foreign.edu', role: 'faculty', institution: other._id }] });
    expect(res.status).toBe(207);
    expect(res.body.data.succeeded).toBe(1);
    const created = await User.findOne({ email: 'guest@foreign.edu' });
    expect(String(created.institution)).toBe(String(other._id));
  });
});

describe('POST /users/bulk (CSV)', () => {
  it('parses an uploaded CSV and reports per-row results', async () => {
    const csv = 'name,email,role,department\nCsv Good,csv.good@test.edu,student,\nCsv Bad,csv.bad@other.edu,student,';
    const res = await request(app).post('/api/v1/users/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from(csv), 'users.csv');
    expect(res.status).toBe(207);
    expect(res.body.data.succeeded).toBe(1);
    expect(res.body.data.failed).toBe(1);
    expect(await User.findOne({ email: 'csv.good@test.edu' })).not.toBeNull();
    expect(await User.findOne({ email: 'csv.bad@other.edu' })).toBeNull();
  });
});
