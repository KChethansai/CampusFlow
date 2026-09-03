import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';

let mongod;
let institution;
let adminToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  
  institution = await Institution.create({
    name: 'CRUD Test Institute',
    code: 'CTEST',
    address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' }
  });

  await User.create({
    name: 'CRUD Admin',
    email: 'crudadmin@test.edu',
    password: 'Admin@123',
    role: 'college_admin',
    institution: institution._id,
    isEmailVerified: true,
    isActive: true
  });

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'crudadmin@test.edu', password: 'Admin@123' });
    
  adminToken = loginRes.body.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Department CRUD', () => {
  let departmentId;
  
  it('should create department', async () => {
    const res = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Computer Science', code: 'CSE', description: 'CS Department' });
      
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Computer Science');
    expect(res.body.data.code).toBe('CSE');
    departmentId = res.body.data._id;
  });
  
  it('should list departments', async () => {
    const res = await request(app)
      .get('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
  
  it('should get department by id', async () => {
    const res = await request(app)
      .get(`/api/v1/departments/${departmentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Computer Science');
  });
  
  it('should update department', async () => {
    const res = await request(app)
      .patch(`/api/v1/departments/${departmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Updated description' });
      
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Updated description');
  });
  
  it('should reject duplicate department code for same institution', async () => {
    const res = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Another CSE', code: 'CSE' });
      
    expect(res.status).toBe(409);
  });
});

describe('Course CRUD', () => {
  let courseId;
  let deptId;
  
  beforeAll(async () => {
    const dept = await Department.findOne({ code: 'CSE', institution: institution._id });
    deptId = dept._id;
  });
  
  it('should create course', async () => {
    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        name: 'B.Tech CSE', 
        code: 'BTCSE', 
        department: deptId, 
        durationYears: 4, 
        totalSemesters: 8 
      });
      
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('B.Tech CSE');
    courseId = res.body.data._id;
  });
  
  it('should list courses', async () => {
    const res = await request(app)
      .get('/api/v1/courses')
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
  
  it('should get course by id', async () => {
    const res = await request(app)
      .get(`/api/v1/courses/${courseId}`)
      .set('Authorization', `Bearer ${adminToken}`);
      
    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe('BTCSE');
  });
});