import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';

let mongod;
let adminToken;
let studentToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const inst = await Institution.create({
    name: 'Search Institute',
    code: 'SRCH',
    emailDomainPattern: 'test.edu',
    address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    contactEmail: 'search@test.edu'
  });
  const other = await Institution.create({
    name: 'Other Institute',
    code: 'OTHR',
    emailDomainPattern: 'test.edu',
    address: { city: 'Mysore', state: 'Karnataka', country: 'India' },
    contactEmail: 'other@test.edu'
  });
  const dept = await Department.create({ name: 'CSE', code: 'CSE', institution: inst._id });
  await Course.create({ name: 'Data Structures', code: 'CS201', department: dept._id, institution: inst._id });
  await Course.create({ name: 'Data Structures', code: 'CS201', department: dept._id, institution: other._id });

  await User.create({
    name: 'Search Admin', email: 'sadmin@test.edu', password: 'Admin@123',
    role: 'college_admin', institution: inst._id, isEmailVerified: true, isActive: true
  });
  await User.create({
    name: 'Searchable Student', email: 'searchable@test.edu', password: 'Student@123',
    role: 'student', institution: inst._id, isEmailVerified: true, isActive: true
  });

  adminToken = (await request(app).post('/api/v1/auth/login')
    .send({ email: 'sadmin@test.edu', password: 'Admin@123' })).body.accessToken;
  studentToken = (await request(app).post('/api/v1/auth/login')
    .send({ email: 'searchable@test.edu', password: 'Student@123' })).body.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Global search API', () => {
  it('requires at least 2 characters', async () => {
    const res = await request(app).get('/api/v1/search?q=a')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('returns tenant-scoped courses only (no cross-tenant leakage)', async () => {
    const res = await request(app).get('/api/v1/search?q=Data Structures')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const courses = res.body.data.filter((r) => r.entity === 'Courses');
    expect(courses.length).toBe(1); // other institution's CS201 stays hidden
  });

  it('hides People from students but shows them to staff', async () => {
    const asStudent = await request(app).get('/api/v1/search?q=Searchable')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(asStudent.status).toBe(200);
    expect(asStudent.body.data.some((r) => r.entity === 'People')).toBe(false);

    const asAdmin = await request(app).get('/api/v1/search?q=Searchable')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(asAdmin.body.data.some((r) => r.entity === 'People')).toBe(true);
  });

  it('rejects unauthenticated search', async () => {
    const res = await request(app).get('/api/v1/search?q=Data');
    expect(res.status).toBe(401);
  });
});
