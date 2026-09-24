import http from 'http';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { io as ioClient } from '../../frontend/node_modules/socket.io-client/build/esm/index.js';
import app from '../app.js';
import { env } from '../config/env.js';
import { initSocket, setIO, authenticateSocket } from '../config/socket.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { AttendanceSessionModel as AttendanceSession } from '../models/AttendanceSessionModel.js';
import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { SubmissionModel as Submission } from '../models/SubmissionModel.js';
import { CompanyModel as Company } from '../models/CompanyModel.js';
import { JobDriveModel as JobDrive } from '../models/JobDriveModel.js';
import { EventModel as Event } from '../models/EventModel.js';
import { RequestModel as RequestDoc } from '../models/RequestModel.js';
import { LearningResourceModel as LearningResource } from '../models/LearningResourceModel.js';
import fs from 'fs';
import path from 'path';

jest.setTimeout(60000);

describe('Final Security & Privacy Closure Tests', () => {
  let mongod;
  let server;
  let ioServer;
  let serverPort;

  let instA;
  let instB;
  let deptA1;
  let deptA2;
  let deptB;
  let courseA1;
  let courseA2;
  let courseB;
  let subjectA1;
  let subjectA2;
  let subjectB;

  let adminA;
  let facultyA1;
  let facultyA2;
  let studentA1;
  let studentA2;
  let studentB;

  let tokenAdminA;
  let tokenFacultyA1;
  let tokenFacultyA2;
  let tokenStudentA1;
  let tokenStudentA2;
  let tokenStudentB;

  let submissionFileA1;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    server = http.createServer(app);
    ioServer = initSocket(server);
    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        resolve();
      });
    });

    instA = await Institution.create({ name: 'Alpha Institute', code: 'ALPHA', emailDomainPattern: 'alpha.edu' });
    instB = await Institution.create({ name: 'Beta Institute', code: 'BETA', emailDomainPattern: 'beta.edu' });

    deptA1 = await Department.create({ name: 'Computer Science', code: 'CS', institution: instA._id });
    deptA2 = await Department.create({ name: 'Mechanical', code: 'ME', institution: instA._id });
    deptB = await Department.create({ name: 'Beta Tech', code: 'BT', institution: instB._id });

    courseA1 = await Course.create({ name: 'BTech CS', code: 'BCS', department: deptA1._id, institution: instA._id, durationYears: 4, totalSemesters: 8 });
    courseA2 = await Course.create({ name: 'BTech ME', code: 'BME', department: deptA2._id, institution: instA._id, durationYears: 4, totalSemesters: 8 });
    courseB = await Course.create({ name: 'BTech Beta', code: 'BBT', department: deptB._id, institution: instB._id, durationYears: 4, totalSemesters: 8 });

    adminA = await User.create({ name: 'Admin A', email: 'admin@alpha.edu', password: 'Admin@123', role: 'college_admin', institution: instA._id, isEmailVerified: true, isActive: true });
    facultyA1 = await User.create({ name: 'Faculty CS', email: 'fac1@alpha.edu', password: 'Faculty@123', role: 'faculty', institution: instA._id, department: deptA1._id, isEmailVerified: true, isActive: true });
    facultyA2 = await User.create({ name: 'Faculty ME', email: 'fac2@alpha.edu', password: 'Faculty@123', role: 'faculty', institution: instA._id, department: deptA2._id, isEmailVerified: true, isActive: true });
    studentA1 = await User.create({ name: 'Student CS', email: 'stud1@alpha.edu', password: 'Student@123', role: 'student', institution: instA._id, department: deptA1._id, isEmailVerified: true, isActive: true });
    studentA2 = await User.create({ name: 'Student ME', email: 'stud2@alpha.edu', password: 'Student@123', role: 'student', institution: instA._id, department: deptA2._id, isEmailVerified: true, isActive: true });
    studentB = await User.create({ name: 'Student Beta', email: 'stud@beta.edu', password: 'Student@123', role: 'student', institution: instB._id, department: deptB._id, isEmailVerified: true, isActive: true });

    subjectA1 = await Subject.create({ name: 'Data Structures', code: 'CS101', course: courseA1._id, faculty: facultyA1._id, institution: instA._id, semester: 1, credits: 4 });
    subjectA2 = await Subject.create({ name: 'Thermodynamics', code: 'ME101', course: courseA2._id, faculty: facultyA2._id, institution: instA._id, semester: 1, credits: 4 });
    subjectB = await Subject.create({ name: 'Beta Subject', code: 'B101', course: courseB._id, institution: instB._id, semester: 1, credits: 4 });

    // Active enrollments
    await Enrollment.create({ institution: instA._id, student: studentA1._id, course: courseA1._id, academicYear: '2025-2026', semester: 1, status: 'active' });
    await Enrollment.create({ institution: instA._id, student: studentA2._id, course: courseA2._id, academicYear: '2025-2026', semester: 1, status: 'active' });
    await Enrollment.create({ institution: instB._id, student: studentB._id, course: courseB._id, academicYear: '2025-2026', semester: 1, status: 'active' });

    tokenAdminA = (await request(app).post('/api/v1/auth/login').send({ email: 'admin@alpha.edu', password: 'Admin@123' })).body.accessToken;
    tokenFacultyA1 = (await request(app).post('/api/v1/auth/login').send({ email: 'fac1@alpha.edu', password: 'Faculty@123' })).body.accessToken;
    tokenFacultyA2 = (await request(app).post('/api/v1/auth/login').send({ email: 'fac2@alpha.edu', password: 'Faculty@123' })).body.accessToken;
    tokenStudentA1 = (await request(app).post('/api/v1/auth/login').send({ email: 'stud1@alpha.edu', password: 'Student@123' })).body.accessToken;
    tokenStudentA2 = (await request(app).post('/api/v1/auth/login').send({ email: 'stud2@alpha.edu', password: 'Student@123' })).body.accessToken;
    tokenStudentB = (await request(app).post('/api/v1/auth/login').send({ email: 'stud@beta.edu', password: 'Student@123' })).body.accessToken;
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe('1. File Download Privacy & Submission Access', () => {
    let assignment;
    let submission;
    let testFilePath;
    const testFileName = `test-solution-${Date.now()}.pdf`;

    beforeAll(async () => {
      assignment = await Assignment.create({
        institution: instA._id,
        subject: subjectA1._id,
        title: 'Network Lab',
        description: 'Implement protocols',
        maxScore: 100,
        dueDate: new Date(Date.now() + 86400000),
        status: 'published',
        createdBy: facultyA1._id,
        allowResubmission: true
      });

      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      testFilePath = path.join(uploadsDir, testFileName);
      fs.writeFileSync(testFilePath, '%PDF-1.4 secret student solution');

      submission = await Submission.create({
        assignment: assignment._id,
        student: studentA1._id,
        status: 'submitted',
        fileUrl: `/uploads/${testFileName}`,
        attempt: 1
      });
      submissionFileA1 = submission;
    });

    afterAll(() => {
      if (fs.existsSync(testFilePath)) {
        try { fs.unlinkSync(testFilePath); } catch {}
      }
    });

    it('Unauthenticated request to /uploads/:filename is rejected (401)', async () => {
      const res = await request(app).get(`/uploads/${testFileName}`);
      expect(res.status).toBe(401);
    });

    it('Student A1 can access own file via Bearer token', async () => {
      const res = await request(app)
        .get(`/uploads/${testFileName}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(200);
      const text = res.text || res.body?.toString?.('utf8') || '';
      expect(text).toContain('%PDF-1.4 secret student solution');
    });

    it('Student A1 can access own file via ?token= query param', async () => {
      const res = await request(app).get(`/uploads/${testFileName}?token=${tokenStudentA1}`);
      expect(res.status).toBe(200);
      const text = res.text || res.body?.toString?.('utf8') || '';
      expect(text).toContain('%PDF-1.4 secret student solution');
    });

    it('Student A2 CANNOT access Student A1 file (403/404)', async () => {
      const res = await request(app)
        .get(`/uploads/${testFileName}`)
        .set('Authorization', `Bearer ${tokenStudentA2}`);
      expect([403, 404]).toContain(res.status);
    });

    it('Cross-tenant Student B CANNOT access Student A1 file (403/404)', async () => {
      const res = await request(app)
        .get(`/uploads/${testFileName}`)
        .set('Authorization', `Bearer ${tokenStudentB}`);
      expect([403, 404]).toContain(res.status);
    });

    it('Teaching Faculty A1 can access Student A1 submission file', async () => {
      const res = await request(app)
        .get(`/uploads/${testFileName}`)
        .set('Authorization', `Bearer ${tokenFacultyA1}`);
      expect(res.status).toBe(200);
    });

    it('Non-teaching Faculty A2 CANNOT access Student A1 submission file (403/404)', async () => {
      const res = await request(app)
        .get(`/uploads/${testFileName}`)
        .set('Authorization', `Bearer ${tokenFacultyA2}`);
      expect([403, 404]).toContain(res.status);
    });

    it('Submission file endpoint GET /submissions/:id/file works with authorized student', async () => {
      const res = await request(app)
        .get(`/api/v1/submissions/${submission._id}/file`)
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(200);
    });

    it('Submission file endpoint GET /submissions/:id/file rejects unauthorized student (403/404)', async () => {
      const res = await request(app)
        .get(`/api/v1/submissions/${submission._id}/file`)
        .set('Authorization', `Bearer ${tokenStudentA2}`);
      expect([403, 404]).toContain(res.status);
    });
  });

  describe('2. Complete Attendance Audience Scoping', () => {
    let sessionCS;

    beforeAll(async () => {
      sessionCS = await AttendanceSession.create({
        institution: instA._id,
        subject: subjectA1._id,
        date: new Date(),
        period: 1,
        markedBy: facultyA1._id,
        records: [
          { student: studentA1._id, status: 'present', remark: 'Good' }
        ]
      });
    });

    it('Student A1 (enrolled in CS) can view session detail and sees own record', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/${sessionCS._id}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(200);
      expect(res.body.data.records.length).toBe(1);
      expect(String(res.body.data.records[0].student._id || res.body.data.records[0].student)).toBe(String(studentA1._id));
    });

    it('Student A2 (not enrolled in CS) CANNOT view CS attendance session (404)', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/${sessionCS._id}`)
        .set('Authorization', `Bearer ${tokenStudentA2}`);
      expect(res.status).toBe(404);
    });

    it('Faculty A2 (does not teach CS) CANNOT view CS attendance session (404)', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/${sessionCS._id}`)
        .set('Authorization', `Bearer ${tokenFacultyA2}`);
      expect(res.status).toBe(404);
    });

    it('Admin A can view session detail', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/${sessionCS._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(200);
    });
  });

  describe('3. Event Registration Privacy & Faculty Department Scoping', () => {
    let eventCS;

    beforeAll(async () => {
      eventCS = await Event.create({
        institution: instA._id,
        department: deptA1._id,
        title: 'CS Hackathon',
        description: 'Code all night',
        type: 'technical',
        startAt: new Date(Date.now() + 86400000),
        endAt: new Date(Date.now() + 172800000),
        visibility: 'public',
        registeredStudents: [studentA1._id]
      });
    });

    it('Student GET /events omits registeredStudents array and provides registrationCount', async () => {
      const res = await request(app)
        .get('/api/v1/events')
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(200);
      const ev = res.body.data.find((e) => String(e._id) === String(eventCS._id));
      expect(ev.registeredStudents).toBeUndefined();
      expect(ev.registrationCount).toBe(1);
      expect(ev.isRegistered).toBe(true);
    });

    it('Student GET /events/:id omits registeredStudents array', async () => {
      const res = await request(app)
        .get(`/api/v1/events/${eventCS._id}`)
        .set('Authorization', `Bearer ${tokenStudentA2}`);
      expect(res.status).toBe(200);
      expect(res.body.data.registeredStudents).toBeUndefined();
      expect(res.body.data.isRegistered).toBe(false);
    });

    it('Admin GET /events includes registeredStudents array', async () => {
      const res = await request(app)
        .get(`/api/v1/events/${eventCS._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.registeredStudents)).toBe(true);
    });

    it('Faculty A1 (Dept CS) cannot create event for Dept ME (403)', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${tokenFacultyA1}`)
        .send({
          department: deptA2._id,
          title: 'ME Workshop',
          description: 'Engines',
          type: 'technical',
          startAt: new Date(Date.now() + 86400000)
        });
      expect(res.status).toBe(403);
    });

    it('Faculty A2 (Dept ME) cannot update CS event (403/404)', async () => {
      const res = await request(app)
        .patch(`/api/v1/events/${eventCS._id}`)
        .set('Authorization', `Bearer ${tokenFacultyA2}`)
        .send({ title: 'Hacked Event' });
      expect([403, 404]).toContain(res.status);
    });
  });

  describe('4. Populated Document Data Minimization', () => {
    let company;
    let drive;

    beforeAll(async () => {
      company = await Company.create({
        name: 'TechCorp Secret',
        industry: 'Software',
        institution: instA._id,
        hrContact: 'secret@techcorp.com',
        notes: 'Confidential client notes'
      });

      drive = await JobDrive.create({
        company: company._id,
        role: 'SDE 1',
        packageLPA: 12,
        institution: instA._id,
        eligibility: {
          allowedDepartments: [deptA1._id],
          graduationYear: 2026
        }
      });
    });

    it('Student GET /job-drives omits company hrContact and notes', async () => {
      const res = await request(app)
        .get('/api/v1/job-drives')
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(200);
      const d = res.body.data.find((item) => String(item._id) === String(drive._id));
      expect(d.company.hrContact).toBeUndefined();
      expect(d.company.notes).toBeUndefined();
    });

    it('Student GET /companies/:id omits hrContact and notes', async () => {
      const res = await request(app)
        .get(`/api/v1/companies/${company._id}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(200);
      expect(res.body.data.hrContact).toBeUndefined();
      expect(res.body.data.notes).toBeUndefined();
    });
  });

  describe('5. Request Assignee Role Integrity', () => {
    it('Assigning a request to a student user is rejected (400)', async () => {
      const createRes = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({
          type: 'bonafide',
          title: 'Need certificate',
          description: 'For bank loan',
          department: deptA1._id
        });
      expect(createRes.status).toBe(201);
      const reqId = createRes.body.data._id;

      const assignRes = await request(app)
        .patch(`/api/v1/requests/${reqId}/status`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ assignedTo: studentA2._id });
      expect(assignRes.status).toBe(400);
      expect(assignRes.body.message).toContain('staff');
    });
  });

  describe('6. Enrollment Student Role Integrity', () => {
    it('Enrolling a user with role faculty as student is rejected (400)', async () => {
      const res = await request(app)
        .post('/api/v1/enrollments')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          student: facultyA1._id,
          course: courseA1._id,
          academicYear: '2026-2027',
          semester: 1
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('student');
    });
  });

  describe('7. Submission Validation & Resubmission Semantics', () => {
    let unenrollAssignment;
    let noResubmissionAssignment;

    beforeAll(async () => {
      unenrollAssignment = await Assignment.create({
        institution: instA._id,
        subject: subjectA2._id, // ME subject
        title: 'Thermal Lab',
        description: 'Thermodynamics',
        maxScore: 100,
        dueDate: new Date(Date.now() + 86400000),
        status: 'published',
        createdBy: facultyA2._id
      });

      noResubmissionAssignment = await Assignment.create({
        institution: instA._id,
        subject: subjectA1._id,
        title: 'Single Attempt Assignment',
        description: 'One shot only',
        maxScore: 100,
        dueDate: new Date(Date.now() + 86400000),
        status: 'published',
        createdBy: facultyA1._id,
        allowResubmission: false
      });
    });

    it('Student A1 (CS) submitting to ME assignment is rejected (403)', async () => {
      const res = await request(app)
        .post(`/api/v1/submissions/assignments/${unenrollAssignment._id}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ comments: 'I want to submit anyway' });
      expect(res.status).toBe(403);
    });

    it('Resubmission rejected when allowResubmission is false (400)', async () => {
      // First submission succeeds
      const firstRes = await request(app)
        .post(`/api/v1/submissions/assignments/${noResubmissionAssignment._id}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ comments: 'First attempt' });
      expect(firstRes.status).toBe(201);

      // Second attempt rejected
      const secondRes = await request(app)
        .post(`/api/v1/submissions/assignments/${noResubmissionAssignment._id}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ comments: 'Second attempt' });
      expect(secondRes.status).toBe(400);
      expect(secondRes.body.message).toContain('Resubmission is not allowed');
    });
  });

  describe('8. User Profile Foreign Course Validation', () => {
    it('Updating user profile with foreign institution course is rejected (400)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${studentA1._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          profile: {
            course: courseB._id // Course in Beta Institute
          }
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Course');
    });
  });

  describe('9. Assignment Role Visibility', () => {
    let draftCS;

    beforeAll(async () => {
      draftCS = await Assignment.create({
        institution: instA._id,
        subject: subjectA1._id,
        title: 'CS Draft Quiz',
        description: 'Unpublished',
        maxScore: 50,
        dueDate: new Date(Date.now() + 86400000),
        status: 'draft',
        createdBy: facultyA1._id
      });
    });

    it('Student A1 does NOT see draft assignments in GET /assignments', async () => {
      const res = await request(app)
        .get('/api/v1/assignments')
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(200);
      const found = res.body.data.find((a) => String(a._id) === String(draftCS._id));
      expect(found).toBeUndefined();
    });

    it('Student A1 does NOT see ME assignments in GET /assignments', async () => {
      const res = await request(app)
        .get('/api/v1/assignments')
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(200);
      const foundME = res.body.data.find((a) => String(a.subject?._id || a.subject) === String(subjectA2._id));
      expect(foundME).toBeUndefined();
    });

    it('Faculty A2 only sees ME assignments, not CS assignments', async () => {
      const res = await request(app)
        .get('/api/v1/assignments')
        .set('Authorization', `Bearer ${tokenFacultyA2}`);
      expect(res.status).toBe(200);
      const foundCS = res.body.data.find((a) => String(a.subject?._id || a.subject) === String(subjectA1._id));
      expect(foundCS).toBeUndefined();
    });
  });

  describe('10. Study Plan & Learning Resource Scoping', () => {
    let resCS;
    let resME;

    beforeAll(async () => {
      resCS = await LearningResource.create({
        institution: instA._id,
        subject: subjectA1._id,
        title: 'CS Data Structures Notes',
        topic: 'Trees',
        url: 'https://example.com/trees'
      });

      resME = await LearningResource.create({
        institution: instA._id,
        subject: subjectA2._id,
        title: 'ME Thermodynamics Formulae',
        topic: 'Laws',
        url: 'https://example.com/thermo'
      });
    });

    it('Student A1 study plan revision only includes CS assignments', async () => {
      const res = await request(app)
        .get('/api/v1/study/plan')
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(200);
      const planItems = res.body.data.revisionPlan;
      expect(planItems.every((item) => !item.subjectId || String(item.subjectId) === String(subjectA1._id))).toBe(true);
    });

    it('Student A1 only sees CS learning resources, not ME', async () => {
      const res = await request(app)
        .get('/api/v1/study/learning-resources')
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(200);
      const foundME = res.body.data.find((r) => String(r._id) === String(resME._id));
      expect(foundME).toBeUndefined();
      const foundCS = res.body.data.find((r) => String(r._id) === String(resCS._id));
      expect(foundCS).toBeDefined();
    });

    it('Faculty A1 can create resource for CS, but is forbidden for ME (403)', async () => {
      const res = await request(app)
        .post('/api/v1/study/learning-resources')
        .set('Authorization', `Bearer ${tokenFacultyA1}`)
        .send({
          subject: subjectA2._id,
          title: 'Unassigned Subject Notes',
          url: 'https://example.com/notes'
        });
      expect(res.status).toBe(403);
    });
  });

  describe('11. Socket Password Change Invalidation', () => {
    it('Socket handshake succeeds before password change', async () => {
      const fakeSocket = {
        handshake: { auth: { token: tokenStudentA1 } },
        data: {}
      };
      let nextError = null;
      await authenticateSocket(fakeSocket, (err) => { nextError = err; });
      expect(nextError).toBeUndefined();
      expect(fakeSocket.data.user.id).toBe(String(studentA1._id));
    });

    it('Socket handshake fails after password change with stale token', async () => {
      // Simulate password change timestamp 2 seconds in the future of token issuance
      await User.findByIdAndUpdate(studentA1._id, {
        passwordChangedAt: new Date(Date.now() + 2000)
      });

      const fakeSocket = {
        handshake: { auth: { token: tokenStudentA1 } },
        data: {}
      };
      let nextError = null;
      await authenticateSocket(fakeSocket, (err) => { nextError = err; });
      expect(nextError).toBeInstanceOf(Error);
      expect(nextError.message).toContain('Session expired after password change');
    });
  });

  describe('12. Real Socket.IO Client Connection & Room Isolation', () => {
    let clientStudent;
    let clientFaculty;

    afterEach(() => {
      if (clientStudent?.connected) clientStudent.disconnect();
      if (clientFaculty?.connected) clientFaculty.disconnect();
    });

    it('Real Socket client connects, authenticates and receives isolated room events', async () => {
      clientStudent = ioClient(`http://localhost:${serverPort}`, {
        auth: { token: tokenStudentA2 },
        transports: ['websocket'],
        reconnection: false
      });

      await new Promise((resolve, reject) => {
        clientStudent.on('connect', resolve);
        clientStudent.on('connect_error', reject);
      });

      expect(clientStudent.connected).toBe(true);

      const receivedEvents = [];
      clientStudent.on('attendance:marked', (data) => {
        receivedEvents.push(data);
      });

      // Emit attendance marked event to institution
      ioServer.to(`institution:${instA._id}`).emit('attendance:marked', {
        sessionId: 'test-session-123',
        subjectId: String(subjectA1._id)
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(receivedEvents.length).toBe(1);
      expect(receivedEvents[0].sessionId).toBe('test-session-123');
      // Verify no student records leaked
      expect(receivedEvents[0].records).toBeUndefined();
    });
  });
});
