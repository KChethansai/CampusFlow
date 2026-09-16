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

describe('Institution CRUD (super_admin only)', () => {
  let superToken;
  let studentToken;
  let institutionId;

  beforeAll(async () => {
    await User.create({
      name: 'CRUD Super',
      email: 'crudsuper@test.edu',
      password: 'Admin@123',
      role: 'super_admin',
      institution: institution._id,
      isEmailVerified: true,
      isActive: true
    });
    await User.create({
      name: 'CRUD Student',
      email: 'crudstudent@test.edu',
      password: 'Student@123',
      role: 'student',
      institution: institution._id,
      isEmailVerified: true,
      isActive: true,
      profile: { rollNumber: 'CRUD001' }
    });
    const superRes = await request(app).post('/api/v1/auth/login').send({ email: 'crudsuper@test.edu', password: 'Admin@123' });
    superToken = superRes.body.accessToken;
    const stuRes = await request(app).post('/api/v1/auth/login').send({ email: 'crudstudent@test.edu', password: 'Student@123' });
    studentToken = stuRes.body.accessToken;
  });

  it('should create institution as super_admin', async () => {
    const res = await request(app)
      .post('/api/v1/institutions')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ name: 'New Institute', code: 'NEWINST' });
    expect(res.status).toBe(201);
    expect(res.body.data.code).toBe('NEWINST');
    institutionId = res.body.data._id;
  });

  it('should reject duplicate institution code', async () => {
    const res = await request(app)
      .post('/api/v1/institutions')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ name: 'Dupe', code: 'NEWINST' });
    expect(res.status).toBe(409);
  });

  it('should deny institution creation to student', async () => {
    const res = await request(app)
      .post('/api/v1/institutions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Hack', code: 'HACK' });
    expect(res.status).toBe(403);
  });

  it('should list and get institutions', async () => {
    const list = await request(app).get('/api/v1/institutions').set('Authorization', `Bearer ${superToken}`);
    expect(list.status).toBe(200);
    const one = await request(app).get(`/api/v1/institutions/${institutionId}`).set('Authorization', `Bearer ${superToken}`);
    expect(one.status).toBe(200);
  });

  it('should update and delete institution as super_admin', async () => {
    const updated = await request(app)
      .patch(`/api/v1/institutions/${institutionId}`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ name: 'Renamed Institute' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe('Renamed Institute');
    const del = await request(app)
      .delete(`/api/v1/institutions/${institutionId}`)
      .set('Authorization', `Bearer ${superToken}`);
    expect(del.status).toBe(200);
  });
});

describe('Learning resource writes (faculty/admin)', () => {
  let subjectId;

  beforeAll(async () => {
    const { SubjectModel: Subject } = await import('../models/SubjectModel.js');
    const { CourseModel: Course } = await import('../models/CourseModel.js');
    let course = await Course.findOne({ institution: institution._id });
    if (!course) {
      const dept = await Department.findOne({ institution: institution._id });
      course = await Course.create({ name: 'T', code: 'T101', department: dept._id, institution: institution._id, durationYears: 4, totalSemesters: 8 });
    }
    const subj = await Subject.create({
      institution: institution._id,
      course: course._id,
      code: 'LR101',
      name: 'LR Subject',
      semester: 1,
      credits: 3
    });
    subjectId = subj._id;
  });

  it('should create, update and delete a learning resource', async () => {
    const created = await request(app)
      .post('/api/v1/study/learning-resources')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subject: subjectId, topic: 'T', title: 'R1', url: 'https://example.com/r1', type: 'link', difficulty: 'beginner' });
    expect(created.status).toBe(201);
    const id = created.body.data._id;

    const updated = await request(app)
      .patch(`/api/v1/study/learning-resources/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'R1 updated' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe('R1 updated');

    const del = await request(app)
      .delete(`/api/v1/study/learning-resources/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
  });
});