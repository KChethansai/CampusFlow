import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';

let mongod;
let adminToken;
let studentToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const inst = await Institution.create({
    name: 'Analytics Institute',
    code: 'ANLY',
    emailDomainPattern: 'test.edu',
    address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    contactEmail: 'analytics@test.edu'
  });

  await User.create({
    name: 'Analytics Admin', email: 'aadmin@test.edu', password: 'Admin@123',
    role: 'college_admin', institution: inst._id, isEmailVerified: true, isActive: true
  });
  await User.create({
    name: 'Analytics Student', email: 'astudent@test.edu', password: 'Student@123',
    role: 'student', institution: inst._id, isEmailVerified: true, isActive: true,
    profile: { cgpa: 8.5 }
  });

  adminToken = (await request(app).post('/api/v1/auth/login')
    .send({ email: 'aadmin@test.edu', password: 'Admin@123' })).body.accessToken;
  studentToken = (await request(app).post('/api/v1/auth/login')
    .send({ email: 'astudent@test.edu', password: 'Student@123' })).body.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Analytics API', () => {
  it('serves placement funnel with real stage buckets', async () => {
    const res = await request(app).get('/api/v1/analytics/placement-funnel')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.map((d) => d.stage)).toEqual(['drives', 'applied', 'shortlisted', 'offer']);
  });

  it('serves enrollment overview with GPA buckets', async () => {
    const res = await request(app).get('/api/v1/analytics/enrollment-overview')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.gpa.find((b) => b.range === '8–9').count).toBe(1);
  });

  it('serves attendance trend to students (own data only)', async () => {
    const res = await request(app).get('/api/v1/analytics/attendance-trend')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('rejects unauthenticated analytics', async () => {
    const res = await request(app).get('/api/v1/analytics/placement-funnel');
    expect(res.status).toBe(401);
  });
});
