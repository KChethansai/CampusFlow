// audience.test: rigorous audience isolation & server-side authorization
// for events, announcements, and global search.
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { EventModel as Event } from '../models/EventModel.js';
import { AnnouncementModel as Announcement } from '../models/AnnouncementModel.js';

jest.setTimeout(30000);

let mongod;
let inst;
let deptA;
let deptB;
let courseA;
let courseB;
let subjectA;
let subjectB;

let superAdminToken;
let collegeAdminToken;
let facultyAToken;
let facultyBToken;
let studentAToken;
let studentBToken;
let unaffiliatedStudentToken;

let publicEvent;
let deptAEvent;
let deptBEvent;
let internalEvent;

let globalAnnounce;
let deptAAnnounce;
let deptBAnnounce;
let subjectAAnnounce;
let subjectBAnnounce;

const login = async (email, password = 'Password@123') => {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.accessToken;
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  inst = await Institution.create({
    name: 'Audience University',
    code: 'AU',
    contactEmail: 'admin@au.edu',
    emailDomainPattern: 'au.edu'
  });

  deptA = await Department.create({ name: 'Computer Science', code: 'CSE', institution: inst._id });
  deptB = await Department.create({ name: 'Electrical Engineering', code: 'ECE', institution: inst._id });

  courseA = await Course.create({
    name: 'B.Tech CSE',
    code: 'BCSE',
    department: deptA._id,
    institution: inst._id,
    durationYears: 4,
    totalSemesters: 8
  });
  courseB = await Course.create({
    name: 'B.Tech ECE',
    code: 'BECE',
    department: deptB._id,
    institution: inst._id,
    durationYears: 4,
    totalSemesters: 8
  });

  const mkUser = (data) =>
    User.create({
      password: 'Password@123',
      isEmailVerified: true,
      isActive: true,
      institution: inst._id,
      ...data
    });

  const superAdmin = await mkUser({ name: 'Super Admin', email: 'super@au.edu', role: 'super_admin' });
  const collegeAdmin = await mkUser({ name: 'College Admin', email: 'college@au.edu', role: 'college_admin' });
  const facultyA = await mkUser({ name: 'Faculty A', email: 'fac.a@au.edu', role: 'faculty', department: deptA._id });
  const facultyB = await mkUser({ name: 'Faculty B', email: 'fac.b@au.edu', role: 'faculty', department: deptB._id });
  const studentA = await mkUser({ name: 'Student A', email: 'stu.a@au.edu', role: 'student', department: deptA._id });
  const studentB = await mkUser({ name: 'Student B', email: 'stu.b@au.edu', role: 'student', department: deptB._id });
  const unaffiliatedStudent = await mkUser({ name: 'Student Unaffil', email: 'stu.un@au.edu', role: 'student' });

  subjectA = await Subject.create({
    name: 'Operating Systems',
    code: 'CS101',
    course: courseA._id,
    institution: inst._id,
    faculty: facultyA._id,
    semester: 3,
    credits: 4
  });

  subjectB = await Subject.create({
    name: 'Signals and Systems',
    code: 'EC101',
    course: courseB._id,
    institution: inst._id,
    faculty: facultyB._id,
    semester: 3,
    credits: 4
  });

  // Enroll student A in course A
  await Enrollment.create({
    student: studentA._id,
    course: courseA._id,
    institution: inst._id,
    academicYear: '2025-2026',
    semester: 3,
    status: 'active'
  });

  // Enroll student B in course B
  await Enrollment.create({
    student: studentB._id,
    course: courseB._id,
    institution: inst._id,
    academicYear: '2025-2026',
    semester: 3,
    status: 'active'
  });

  superAdminToken = await login('super@au.edu');
  collegeAdminToken = await login('college@au.edu');
  facultyAToken = await login('fac.a@au.edu');
  facultyBToken = await login('fac.b@au.edu');
  studentAToken = await login('stu.a@au.edu');
  studentBToken = await login('stu.b@au.edu');
  unaffiliatedStudentToken = await login('stu.un@au.edu');

  // Seed Events
  publicEvent = await Event.create({
    institution: inst._id,
    title: 'Campus Spring Fest',
    description: 'All campus public event',
    visibility: 'public',
    type: 'cultural',
    startAt: new Date(Date.now() + 86400000)
  });

  internalEvent = await Event.create({
    institution: inst._id,
    title: 'Placement Orientation Session',
    description: 'Internal to all members',
    visibility: 'internal',
    type: 'placement',
    startAt: new Date(Date.now() + 172800000)
  });

  deptAEvent = await Event.create({
    institution: inst._id,
    department: deptA._id,
    title: 'CSE Code Hackathon Exclusive',
    description: 'Department CSE only',
    visibility: 'department',
    type: 'technical',
    startAt: new Date(Date.now() + 259200000)
  });

  deptBEvent = await Event.create({
    institution: inst._id,
    department: deptB._id,
    title: 'ECE Robotics Workshop Exclusive',
    description: 'Department ECE only',
    visibility: 'department',
    type: 'academic',
    startAt: new Date(Date.now() + 345600000)
  });

  // Seed Announcements
  globalAnnounce = await Announcement.create({
    institution: inst._id,
    title: 'Campus Renovation Update',
    body: 'Central library closed this Saturday',
    createdBy: collegeAdmin._id
  });

  deptAAnnounce = await Announcement.create({
    institution: inst._id,
    department: deptA._id,
    title: 'CSE Lab Maintenance Notice',
    body: 'Linux lab server reboot on Friday',
    createdBy: facultyA._id
  });

  deptBAnnounce = await Announcement.create({
    institution: inst._id,
    department: deptB._id,
    title: 'ECE Cleanroom Safety Guidelines',
    body: 'Follow cleanroom protocol',
    createdBy: facultyB._id
  });

  subjectAAnnounce = await Announcement.create({
    institution: inst._id,
    department: deptA._id,
    subject: subjectA._id,
    title: 'Operating Systems Assignment 1 Released',
    body: 'Kernel module assignment is up',
    createdBy: facultyA._id
  });

  subjectBAnnounce = await Announcement.create({
    institution: inst._id,
    department: deptB._id,
    subject: subjectB._id,
    title: 'Signals Exam Date Announced',
    body: 'Mid-term on Fourier transforms',
    createdBy: facultyB._id
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Event audience isolation', () => {
  it('allows super_admin and college_admin to list all events including department ones', async () => {
    const res = await request(app).get('/api/v1/events').set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    const titles = res.body.data.map((e) => e.title);
    expect(titles).toContain('Campus Spring Fest');
    expect(titles).toContain('CSE Code Hackathon Exclusive');
    expect(titles).toContain('ECE Robotics Workshop Exclusive');
  });

  it('student in Dept A can see public, internal, and Dept A events, but NOT Dept B events', async () => {
    const res = await request(app).get('/api/v1/events').set('Authorization', `Bearer ${studentAToken}`);
    expect(res.status).toBe(200);
    const titles = res.body.data.map((e) => e.title);
    expect(titles).toContain('Campus Spring Fest');
    expect(titles).toContain('Placement Orientation Session');
    expect(titles).toContain('CSE Code Hackathon Exclusive');
    expect(titles).not.toContain('ECE Robotics Workshop Exclusive');
  });

  it('student in Dept A receives 404 when directly requesting Dept B event by ID', async () => {
    const res = await request(app).get(`/api/v1/events/${deptBEvent._id}`).set('Authorization', `Bearer ${studentAToken}`);
    expect(res.status).toBe(404);
  });

  it('student in Dept A receives 404 when trying to export ICS for Dept B event', async () => {
    const res = await request(app).get(`/api/v1/events/${deptBEvent._id}/ics`).set('Authorization', `Bearer ${studentAToken}`);
    expect(res.status).toBe(404);
  });

  it('student in Dept A receives 404 when trying to register for Dept B event', async () => {
    const res = await request(app).post(`/api/v1/events/${deptBEvent._id}/register`).set('Authorization', `Bearer ${studentAToken}`);
    expect(res.status).toBe(404);
  });

  it('student in Dept A can successfully register for Dept A event', async () => {
    const res = await request(app).post(`/api/v1/events/${deptAEvent._id}/register`).set('Authorization', `Bearer ${studentAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('student without department cannot see department-scoped events', async () => {
    const res = await request(app).get('/api/v1/events').set('Authorization', `Bearer ${unaffiliatedStudentToken}`);
    expect(res.status).toBe(200);
    const titles = res.body.data.map((e) => e.title);
    expect(titles).toContain('Campus Spring Fest');
    expect(titles).not.toContain('CSE Code Hackathon Exclusive');
    expect(titles).not.toContain('ECE Robotics Workshop Exclusive');
  });
});

describe('Announcement audience isolation', () => {
  it('allows admins to list all announcements across all departments and subjects', async () => {
    const res = await request(app).get('/api/v1/announcements').set('Authorization', `Bearer ${collegeAdminToken}`);
    expect(res.status).toBe(200);
    const titles = res.body.data.map((a) => a.title);
    expect(titles).toContain('Campus Renovation Update');
    expect(titles).toContain('CSE Lab Maintenance Notice');
    expect(titles).toContain('ECE Cleanroom Safety Guidelines');
    expect(titles).toContain('Operating Systems Assignment 1 Released');
    expect(titles).toContain('Signals Exam Date Announced');
  });

  it('student in Dept A with enrollment in Subject A sees global, Dept A, and Subject A announcements, but NOT Dept B or Subject B', async () => {
    const res = await request(app).get('/api/v1/announcements').set('Authorization', `Bearer ${studentAToken}`);
    expect(res.status).toBe(200);
    const titles = res.body.data.map((a) => a.title);
    expect(titles).toContain('Campus Renovation Update');
    expect(titles).toContain('CSE Lab Maintenance Notice');
    expect(titles).toContain('Operating Systems Assignment 1 Released');
    expect(titles).not.toContain('ECE Cleanroom Safety Guidelines');
    expect(titles).not.toContain('Signals Exam Date Announced');
  });

  it('student in Dept A receives 404 when directly accessing Dept B announcement by ID', async () => {
    const res = await request(app).get(`/api/v1/announcements/${deptBAnnounce._id}`).set('Authorization', `Bearer ${studentAToken}`);
    expect(res.status).toBe(404);
  });

  it('student in Dept A receives 404 when directly accessing Subject B announcement by ID', async () => {
    const res = await request(app).get(`/api/v1/announcements/${subjectBAnnounce._id}`).set('Authorization', `Bearer ${studentAToken}`);
    expect(res.status).toBe(404);
  });

  it('faculty B cannot update or delete announcement created by faculty A', async () => {
    const patchRes = await request(app)
      .patch(`/api/v1/announcements/${deptAAnnounce._id}`)
      .set('Authorization', `Bearer ${facultyBToken}`)
      .send({ title: 'Hacked Title' });
    expect(patchRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/v1/announcements/${deptAAnnounce._id}`)
      .set('Authorization', `Bearer ${facultyBToken}`);
    expect(deleteRes.status).toBe(404);
  });

  it('faculty A can update their own announcement', async () => {
    const res = await request(app)
      .patch(`/api/v1/announcements/${deptAAnnounce._id}`)
      .set('Authorization', `Bearer ${facultyAToken}`)
      .send({ title: 'CSE Lab Maintenance Notice (Updated)' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('CSE Lab Maintenance Notice (Updated)');
  });
});

describe('Global search audience isolation', () => {
  it('excludes unauthorized department events and announcements from search results', async () => {
    const res = await request(app).get('/api/v1/search?q=Exclusive').set('Authorization', `Bearer ${studentAToken}`);
    expect(res.status).toBe(200);
    const titles = res.body.data.map((item) => item.title);
    expect(titles).toContain('CSE Code Hackathon Exclusive');
    expect(titles).not.toContain('ECE Robotics Workshop Exclusive');
  });

  it('allows super_admin to search and find all department events and announcements', async () => {
    const res = await request(app).get('/api/v1/search?q=Exclusive').set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    const titles = res.body.data.map((item) => item.title);
    expect(titles).toContain('CSE Code Hackathon Exclusive');
    expect(titles).toContain('ECE Robotics Workshop Exclusive');
  });
});
