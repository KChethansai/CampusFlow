import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { env } from '../config/env.js';
import { authenticateSocket, setIO } from '../config/socket.js';
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
import { JobApplicationModel as JobApplication } from '../models/JobApplicationModel.js';
import { EventModel as Event } from '../models/EventModel.js';
import { AnnouncementModel as Announcement } from '../models/AnnouncementModel.js';
import { RequestModel as RequestDoc } from '../models/RequestModel.js';

jest.setTimeout(45000);

describe('Final Blocker Security & Verification Tests', () => {
  let mongod;

  let instA;
  let instB;
  let deptA1;
  let deptA2;
  let deptB1;
  let courseA1;
  let courseB1;
  let subjectA1;
  let subjectA2;
  let subjectB1;
  let companyA;
  let companyB;

  let adminA;
  let facultyA1;
  let facultyA2;
  let studentA1;
  let studentA2;
  let studentAUnenrolled;
  let facultyB;
  let studentB;

  let tokenAdminA;
  let tokenFacultyA1;
  let tokenFacultyA2;
  let tokenStudentA1;
  let tokenStudentA2;
  let tokenStudentAUnenrolled;
  let tokenFacultyB;
  let tokenStudentB;

  let emittedEvents = [];

  const login = async (email, password = 'Password@123') => {
    const res = await request(app).post('/api/v1/auth/login').send({ email, password });
    return res.body.accessToken;
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    // Create institutions
    instA = await Institution.create({ name: 'Alpha Institute', code: 'ALPH', emailDomainPattern: 'alpha.edu' });
    instB = await Institution.create({ name: 'Beta Institute', code: 'BETA', emailDomainPattern: 'beta.edu' });

    // Departments
    deptA1 = await Department.create({ name: 'CS Dept A', code: 'CSA', institution: instA._id });
    deptA2 = await Department.create({ name: 'EE Dept A', code: 'EEA', institution: instA._id });
    deptB1 = await Department.create({ name: 'CS Dept B', code: 'CSB', institution: instB._id });

    // Courses
    courseA1 = await Course.create({ name: 'BTech CS A', code: 'BCSA', department: deptA1._id, institution: instA._id, durationYears: 4, totalSemesters: 8 });
    courseB1 = await Course.create({ name: 'BTech CS B', code: 'BCSB', department: deptB1._id, institution: instB._id, durationYears: 4, totalSemesters: 8 });

    // Users
    adminA = await User.create({ name: 'Admin A', email: 'admin@alpha.edu', password: 'Password@123', role: 'college_admin', institution: instA._id, isEmailVerified: true, isActive: true });
    facultyA1 = await User.create({ name: 'Faculty A1', email: 'fac1@alpha.edu', password: 'Password@123', role: 'faculty', institution: instA._id, department: deptA1._id, isEmailVerified: true, isActive: true });
    facultyA2 = await User.create({ name: 'Faculty A2', email: 'fac2@alpha.edu', password: 'Password@123', role: 'faculty', institution: instA._id, department: deptA1._id, isEmailVerified: true, isActive: true });
    studentA1 = await User.create({ name: 'Student A1', email: 'stu1@alpha.edu', password: 'Password@123', role: 'student', institution: instA._id, department: deptA1._id, isEmailVerified: true, isActive: true });
    studentA2 = await User.create({ name: 'Student A2', email: 'stu2@alpha.edu', password: 'Password@123', role: 'student', institution: instA._id, department: deptA1._id, isEmailVerified: true, isActive: true });
    studentAUnenrolled = await User.create({ name: 'Student Unenrolled', email: 'unenrolled@alpha.edu', password: 'Password@123', role: 'student', institution: instA._id, department: deptA2._id, isEmailVerified: true, isActive: true });

    facultyB = await User.create({ name: 'Faculty B', email: 'fac@beta.edu', password: 'Password@123', role: 'faculty', institution: instB._id, department: deptB1._id, isEmailVerified: true, isActive: true });
    studentB = await User.create({ name: 'Student B', email: 'stu@beta.edu', password: 'Password@123', role: 'student', institution: instB._id, department: deptB1._id, isEmailVerified: true, isActive: true });

    // Subjects
    subjectA1 = await Subject.create({ name: 'Algorithms', code: 'CS101', course: courseA1._id, institution: instA._id, semester: 1, credits: 4, faculty: facultyA1._id });
    subjectA2 = await Subject.create({ name: 'Databases', code: 'CS102', course: courseA1._id, institution: instA._id, semester: 1, credits: 4, faculty: facultyA2._id });
    subjectB1 = await Subject.create({ name: 'Algorithms B', code: 'BCS101', course: courseB1._id, institution: instB._id, semester: 1, credits: 4, faculty: facultyB._id });

    // Companies
    companyA = await Company.create({ name: 'Alpha Tech', institution: instA._id });
    companyB = await Company.create({ name: 'Beta Tech', institution: instB._id });

    // Enrollments
    await Enrollment.create({ student: studentA1._id, course: courseA1._id, institution: instA._id, status: 'active', academicYear: '2025-2026', semester: 1 });
    await Enrollment.create({ student: studentA2._id, course: courseA1._id, institution: instA._id, status: 'active', academicYear: '2025-2026', semester: 1 });
    await Enrollment.create({ student: studentB._id, course: courseB1._id, institution: instB._id, status: 'active', academicYear: '2025-2026', semester: 1 });

    // Tokens
    tokenAdminA = await login('admin@alpha.edu');
    tokenFacultyA1 = await login('fac1@alpha.edu');
    tokenFacultyA2 = await login('fac2@alpha.edu');
    tokenStudentA1 = await login('stu1@alpha.edu');
    tokenStudentA2 = await login('stu2@alpha.edu');
    tokenStudentAUnenrolled = await login('unenrolled@alpha.edu');
    tokenFacultyB = await login('fac@beta.edu');
    tokenStudentB = await login('stu@beta.edu');

    setIO({
      to: (room) => ({
        emit: (event, payload) => {
          emittedEvents.push({ room, event, payload });
        }
      })
    });
  });

  afterAll(async () => {
    setIO(null);
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe('1. Attendance Session Detail Authorization (GET /attendance/:id)', () => {
    let sessionId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${tokenFacultyA1}`)
        .send({
          subject: subjectA1._id,
          date: new Date().toISOString(),
          period: 1,
          records: [
            { student: studentA1._id, status: 'present', remark: 'On time' },
            { student: studentA2._id, status: 'absent', remark: 'Unexcused' }
          ]
        });
      expect(res.status).toBe(201);
      sessionId = res.body.data._id;
    });

    it('Student A1 retrieves own record and receives ONLY their own attendance row', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/${sessionId}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.records)).toBe(true);
      expect(res.body.data.records.length).toBe(1);

      const record = res.body.data.records[0];
      const recordStudentId = String(record.student?._id || record.student);
      expect(recordStudentId).toBe(String(studentA1._id));
      expect(record.status).toBe('present');

      // Crucial: ensure Student B / Student A2 data is completely absent
      const serialized = JSON.stringify(res.body.data);
      expect(serialized).not.toContain(String(studentA2._id));
      expect(serialized).not.toContain('Unexcused');
    });

    it('Faculty receives full roster containing all students', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/${sessionId}`)
        .set('Authorization', `Bearer ${tokenFacultyA1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records.length).toBe(2);
    });

    it('Cross-institution student cannot access attendance session', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/${sessionId}`)
        .set('Authorization', `Bearer ${tokenStudentB}`);

      expect(res.status).toBe(404);
    });
  });

  describe('2. Attendance Socket Privacy', () => {
    it('institution-wide attendance:marked broadcast does NOT leak session.records', async () => {
      emittedEvents = [];

      // Faculty marks attendance
      const res = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${tokenFacultyA1}`)
        .send({
          subject: subjectA1._id,
          date: new Date().toISOString(),
          period: 2,
          records: [
            { student: studentA1._id, status: 'present', remark: 'Active' },
            { student: studentA2._id, status: 'present', remark: 'Active' }
          ]
        });
      expect(res.status).toBe(201);

      // Verify emitToInstitution was called with minimal metadata
      const instEvent = emittedEvents.find(
        (e) => e.room === `institution:${instA._id}` && e.event === 'attendance:marked'
      );
      expect(instEvent).toBeDefined();
      expect(instEvent.payload.sessionId).toBeDefined();
      expect(instEvent.payload.records).toBeUndefined();

      // Verify student-scoped notifications were sent individually
      const student1Event = emittedEvents.find(
        (e) => e.room === `user:${studentA1._id}` && e.event === 'attendance:marked'
      );
      expect(student1Event).toBeDefined();
      expect(student1Event.payload.status).toBe('present');
    });
  });

  describe('3. Announcement Socket Audience Isolation', () => {
    it('department-restricted announcement does NOT emit to general institution room', async () => {
      emittedEvents = [];

      const res = await request(app)
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${tokenFacultyA1}`)
        .send({
          title: 'CS Only Secret',
          content: 'Secret content for CS dept',
          department: deptA1._id,
          priority: 'medium'
        });
      expect(res.status).toBe(201);

      // Restricted announcement MUST NOT be published to institution room
      const institutionAnnouncement = emittedEvents.find(
        (e) => e.room === `institution:${instA._id}` && e.event === 'announcement:posted'
      );
      expect(institutionAnnouncement).toBeUndefined();

      // Delivered only to targeted audience (studentA1 in deptA1)
      const recipientRooms = emittedEvents
        .filter((e) => e.event === 'announcement:posted')
        .map((e) => e.room);
      expect(recipientRooms).toContain(`user:${studentA1._id}`);
      expect(recipientRooms).not.toContain(`user:${studentAUnenrolled._id}`);
    });

    it('public announcement DOES emit to institution room', async () => {
      emittedEvents = [];

      const res = await request(app)
        .post('/api/v1/announcements')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          title: 'Campus Public Notice',
          content: 'Open to everyone',
          priority: 'low'
        });
      expect(res.status).toBe(201);

      // Public announcement must be broadcast to institution room
      const institutionEvent = emittedEvents.find(
        (e) => e.room === `institution:${instA._id}` && e.event === 'announcement:posted'
      );
      expect(institutionEvent).toBeDefined();
    });
  });

  describe('4. Job Application Detail Authorization (GET /job-applications/:id)', () => {
    let driveId;
    let applicationA1Id;
    let applicationA2Id;

    beforeAll(async () => {
      const drive = await JobDrive.create({
        institution: instA._id,
        company: companyA._id,
        role: 'Software Engineer',
        applicationDeadline: new Date(Date.now() + 86400000),
        eligibility: { allowedDepartments: [deptA1._id] }
      });
      driveId = drive._id;

      const app1 = await JobApplication.create({
        drive: driveId,
        student: studentA1._id,
        stage: 'applied',
        history: [{ stage: 'applied', at: new Date() }]
      });
      applicationA1Id = app1._id;

      const app2 = await JobApplication.create({
        drive: driveId,
        student: studentA2._id,
        stage: 'applied',
        history: [{ stage: 'applied', at: new Date() }]
      });
      applicationA2Id = app2._id;
    });

    it('Student A1 can get their own application', async () => {
      const res = await request(app)
        .get(`/api/v1/job-applications/${applicationA1Id}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(String(applicationA1Id));
    });

    it('Student A1 CANNOT get Student A2 application (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/job-applications/${applicationA2Id}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(404);
    });

    it('Cross-institution student cannot access application', async () => {
      const res = await request(app)
        .get(`/api/v1/job-applications/${applicationA1Id}`)
        .set('Authorization', `Bearer ${tokenStudentB}`);
      expect(res.status).toBe(404);
    });

    it('Admin can access student job applications', async () => {
      const res = await request(app)
        .get(`/api/v1/job-applications/${applicationA1Id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(200);
    });
  });

  describe('5. Assignment Ownership Authorization (PATCH / DELETE /assignments/:id)', () => {
    let assignmentA1Id;

    beforeEach(async () => {
      const a = await Assignment.create({
        institution: instA._id,
        subject: subjectA1._id,
        title: 'Algorithm HW',
        description: 'Solve p vs np',
        dueDate: new Date(Date.now() + 86400000),
        status: 'published',
        createdBy: facultyA1._id
      });
      assignmentA1Id = a._id;
    });

    it('Faculty A1 can update and delete own assignment', async () => {
      const updateRes = await request(app)
        .patch(`/api/v1/assignments/${assignmentA1Id}`)
        .set('Authorization', `Bearer ${tokenFacultyA1}`)
        .send({ title: 'Algorithm HW Revised' });
      expect(updateRes.status).toBe(200);

      const delRes = await request(app)
        .delete(`/api/v1/assignments/${assignmentA1Id}`)
        .set('Authorization', `Bearer ${tokenFacultyA1}`);
      expect(delRes.status).toBe(200);
    });

    it('Faculty A2 CANNOT update or delete Faculty A1 assignment (returns 404)', async () => {
      const updateRes = await request(app)
        .patch(`/api/v1/assignments/${assignmentA1Id}`)
        .set('Authorization', `Bearer ${tokenFacultyA2}`)
        .send({ title: 'Hacked Title' });
      expect(updateRes.status).toBe(404);

      const delRes = await request(app)
        .delete(`/api/v1/assignments/${assignmentA1Id}`)
        .set('Authorization', `Bearer ${tokenFacultyA2}`);
      expect(delRes.status).toBe(404);
    });

    it('Faculty from other institution cannot update or delete assignment', async () => {
      const updateRes = await request(app)
        .patch(`/api/v1/assignments/${assignmentA1Id}`)
        .set('Authorization', `Bearer ${tokenFacultyB}`)
        .send({ title: 'Beta Hack' });
      expect(updateRes.status).toBe(404);
    });

    it('College Admin can update and delete faculty assignments', async () => {
      const updateRes = await request(app)
        .patch(`/api/v1/assignments/${assignmentA1Id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({ title: 'Admin Revised' });
      expect(updateRes.status).toBe(200);

      const delRes = await request(app)
        .delete(`/api/v1/assignments/${assignmentA1Id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);
      expect(delRes.status).toBe(200);
    });
  });

  describe('6. Attendance Subject Authorization', () => {
    it('Faculty A1 can mark attendance for subject taught by Faculty A1', async () => {
      const res = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${tokenFacultyA1}`)
        .send({
          subject: subjectA1._id,
          date: new Date().toISOString(),
          period: 3,
          records: [{ student: studentA1._id, status: 'present' }]
        });
      expect(res.status).toBe(201);
    });

    it('Faculty A2 CANNOT mark attendance for subject taught by Faculty A1 (returns 403)', async () => {
      const res = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${tokenFacultyA2}`)
        .send({
          subject: subjectA1._id,
          date: new Date().toISOString(),
          period: 3,
          records: [{ student: studentA1._id, status: 'present' }]
        });
      expect(res.status).toBe(403);
    });

    it('Faculty from another institution cannot mark attendance (returns 404)', async () => {
      const res = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${tokenFacultyB}`)
        .send({
          subject: subjectA1._id,
          date: new Date().toISOString(),
          period: 3,
          records: [{ student: studentA1._id, status: 'present' }]
        });
      expect(res.status).toBe(404);
    });
  });

  describe('7. Attendance Record Student Integrity', () => {
    it('rejects nonexistent student ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${tokenFacultyA1}`)
        .send({
          subject: subjectA1._id,
          date: new Date().toISOString(),
          period: 4,
          records: [{ student: fakeId, status: 'present' }]
        });
      expect(res.status).toBe(400);
    });

    it('rejects foreign-institution student ID', async () => {
      const res = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${tokenFacultyA1}`)
        .send({
          subject: subjectA1._id,
          date: new Date().toISOString(),
          period: 4,
          records: [{ student: studentB._id, status: 'present' }]
        });
      expect(res.status).toBe(400);
    });

    it('rejects malformed student ID', async () => {
      const res = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${tokenFacultyA1}`)
        .send({
          subject: subjectA1._id,
          date: new Date().toISOString(),
          period: 4,
          records: [{ student: 'not-a-valid-id', status: 'present' }]
        });
      expect(res.status).toBe(400);
    });

    it('rejects duplicate student ID in records array', async () => {
      const res = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${tokenFacultyA1}`)
        .send({
          subject: subjectA1._id,
          date: new Date().toISOString(),
          period: 4,
          records: [
            { student: studentA1._id, status: 'present' },
            { student: studentA1._id, status: 'absent' }
          ]
        });
      expect(res.status).toBe(400);
    });

    it('rejects student not enrolled in the course for this subject', async () => {
      const res = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', `Bearer ${tokenFacultyA1}`)
        .send({
          subject: subjectA1._id,
          date: new Date().toISOString(),
          period: 4,
          records: [{ student: studentAUnenrolled._id, status: 'present' }]
        });
      expect(res.status).toBe(400);
    });
  });

  describe('8. Job Application Legacy vs Modern Parity', () => {
    let driveId;

    beforeAll(async () => {
      const drive = await JobDrive.create({
        institution: instA._id,
        company: companyA._id,
        role: 'Full Stack Engineer',
        applicationDeadline: new Date(Date.now() + 86400000),
        eligibility: { allowedDepartments: [deptA1._id] }
      });
      driveId = drive._id;
    });

    it('POST /job-applications enforces caller identity and rejects duplicate application', async () => {
      // First application via legacy route
      const res1 = await request(app)
        .post('/api/v1/job-applications')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({
          drive: driveId,
          student: studentA2._id // Attempt to submit as Student A2
        });
      expect(res1.status).toBe(201);
      // Identity was forced to Student A1
      expect(String(res1.body.data.student)).toBe(String(studentA1._id));

      // Duplicate application must be rejected
      const res2 = await request(app)
        .post('/api/v1/job-applications')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ drive: driveId });
      expect(res2.status).toBe(409);
    });

    it('POST /job-applications rejects ineligible student', async () => {
      const res = await request(app)
        .post('/api/v1/job-applications')
        .set('Authorization', `Bearer ${tokenStudentAUnenrolled}`) // from deptA2
        .send({ drive: driveId });
      expect([400, 403]).toContain(res.status);
    });
  });

  describe('9. Submissions Legacy vs Modern Parity', () => {
    let publishedAssignment;
    let draftAssignment;

    beforeAll(async () => {
      publishedAssignment = await Assignment.create({
        institution: instA._id,
        subject: subjectA1._id,
        title: 'Published HW',
        dueDate: new Date(Date.now() + 86400000),
        status: 'published',
        createdBy: facultyA1._id
      });

      draftAssignment = await Assignment.create({
        institution: instA._id,
        subject: subjectA1._id,
        title: 'Draft HW',
        dueDate: new Date(Date.now() + 86400000),
        status: 'draft',
        createdBy: facultyA1._id
      });
    });

    it('rejects submission for draft assignment on both routes', async () => {
      const resLegacy = await request(app)
        .post('/api/v1/submissions')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ assignment: draftAssignment._id, textNotes: 'My notes' });
      expect(resLegacy.status).toBe(400);

      const resModern = await request(app)
        .post(`/api/v1/submissions/assignments/${draftAssignment._id}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .field('comments', 'My notes');
      expect(resModern.status).toBe(400);
    });

    it('rejects cross-institution assignment on both routes', async () => {
      const resLegacy = await request(app)
        .post('/api/v1/submissions')
        .set('Authorization', `Bearer ${tokenStudentB}`)
        .send({ assignment: publishedAssignment._id, textNotes: 'My notes' });
      expect(resLegacy.status).toBe(404);

      const resModern = await request(app)
        .post(`/api/v1/submissions/assignments/${publishedAssignment._id}`)
        .set('Authorization', `Bearer ${tokenStudentB}`)
        .field('comments', 'My notes');
      expect(resModern.status).toBe(404);
    });
  });

  describe('10. Foreign-Reference Tenant Validation', () => {
    it('Course creation with cross-institution department is rejected', async () => {
      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          name: 'Cross Course',
          code: 'CC101',
          department: deptB1._id,
          durationYears: 4,
          totalSemesters: 8
        });
      expect([400, 404]).toContain(res.status);
    });

    it('Subject creation with cross-institution course or faculty is rejected', async () => {
      const resCourse = await request(app)
        .post('/api/v1/subjects')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          name: 'Cross Subject 1',
          code: 'CSX1',
          course: courseB1._id,
          semester: 1,
          credits: 3
        });
      expect([400, 404]).toContain(resCourse.status);

      const resFaculty = await request(app)
        .post('/api/v1/subjects')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          name: 'Cross Subject 2',
          code: 'CSX2',
          course: courseA1._id,
          faculty: facultyB._id,
          semester: 1,
          credits: 3
        });
      expect([400, 404]).toContain(resFaculty.status);
    });

    it('Event creation with cross-institution department is rejected', async () => {
      const res = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          title: 'Cross Event',
          type: 'seminar',
          department: deptB1._id,
          startAt: new Date(),
          endAt: new Date(Date.now() + 3600000)
        });
      expect([400, 404]).toContain(res.status);
    });

    it('JobDrive creation with cross-institution company is rejected', async () => {
      const res = await request(app)
        .post('/api/v1/job-drives')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          company: companyB._id,
          role: 'Cross Drive',
          applicationDeadline: new Date(Date.now() + 86400000)
        });
      expect([400, 404]).toContain(res.status);
    });

    it('Request creation with cross-institution department is rejected', async () => {
      const res = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({
          title: 'Cross Request',
          type: 'leave',
          department: deptB1._id,
          description: 'Need leave'
        });
      expect(res.status).toBe(400);
    });

    it('Request update with cross-institution assignedTo is rejected', async () => {
      const reqDoc = await RequestDoc.create({
        institution: instA._id,
        student: studentA1._id,
        department: deptA1._id,
        type: 'bonafide',
        title: 'Bonafide Certificate',
        description: 'Need bonafide',
        status: 'pending'
      });

      const res = await request(app)
        .patch(`/api/v1/requests/${reqDoc._id}/status`)
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          status: 'in_review',
          assignedTo: facultyB._id // foreign faculty
        });
      expect(res.status).toBe(400);
    });
  });

  describe('11. Analytics Role Guards', () => {
    it('Student calling /analytics/placement-funnel is forbidden (403)', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/placement-funnel')
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(403);
    });

    it('Student calling /analytics/enrollment-overview is forbidden (403)', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/enrollment-overview')
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(403);
    });

    it('College admin calling analytics endpoints succeeds (200)', async () => {
      const resFunnel = await request(app)
        .get('/api/v1/analytics/placement-funnel')
        .set('Authorization', `Bearer ${tokenAdminA}`);
      expect(resFunnel.status).toBe(200);

      const resOverview = await request(app)
        .get('/api/v1/analytics/enrollment-overview')
        .set('Authorization', `Bearer ${tokenAdminA}`);
      expect(resOverview.status).toBe(200);
    });
  });

  describe('12. Socket Handshake Authentication Middleware', () => {
    it('Valid token in auth.token succeeds and sets socket user', async () => {
      const fakeSocket = {
        handshake: { auth: { token: tokenStudentA1 } },
        data: {}
      };
      let nextError = null;
      await authenticateSocket(fakeSocket, (err) => { nextError = err; });

      expect(nextError).toBeUndefined();
      expect(fakeSocket.data.user).toBeDefined();
      expect(fakeSocket.data.user.id).toBe(String(studentA1._id));
      expect(fakeSocket.data.user.role).toBe('student');
    });

    it('Token in query string is rejected with unauthorized', async () => {
      const fakeSocket = {
        handshake: { query: { token: tokenStudentA1 } },
        data: {}
      };
      let nextError = null;
      await authenticateSocket(fakeSocket, (err) => { nextError = err; });

      expect(nextError).toBeInstanceOf(Error);
      expect(nextError.message).toBe('Not authorized, no token provided');
    });

    it('Missing token is rejected', async () => {
      const fakeSocket = {
        handshake: {},
        data: {}
      };
      let nextError = null;
      await authenticateSocket(fakeSocket, (err) => { nextError = err; });

      expect(nextError).toBeInstanceOf(Error);
      expect(nextError.message).toBe('Not authorized, no token provided');
    });

    it('Invalid token signature is rejected', async () => {
      const fakeSocket = {
        handshake: { auth: { token: 'invalid.jwt.token' } },
        data: {}
      };
      let nextError = null;
      await authenticateSocket(fakeSocket, (err) => { nextError = err; });

      expect(nextError).toBeInstanceOf(Error);
      expect(nextError.message).toBe('Not authorized, token failed');
    });
  });
});
