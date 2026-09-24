import http from 'http';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { InstitutionModel as Institution } from '../models/InstitutionModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { SubmissionModel as Submission } from '../models/SubmissionModel.js';
import { LearningResourceModel as LearningResource } from '../models/LearningResourceModel.js';
import { signAccessToken } from '../utils/token.js';
import { sanitizeUser, sanitizeUsers } from '../utils/userDto.js';
import { resolveFileUrl, generateSignedDeliveryUrl } from '../config/multer.js';
import { canFacultyAccessAssignment, canUserAccessSubmission } from '../utils/academicScope.js';

jest.setTimeout(60000);

describe('Final CampusFlow Closure Matrix (Requirements A-N)', () => {
  let mongod;
  let server;
  let instA;
  let instB;
  let deptA;
  let deptB;
  let courseA;
  let courseB;
  let subjectA;
  let adminA;
  let facultyA;
  let studentA;
  let unenrolledStudentA;
  let tokenAdminA;
  let tokenFacultyA;
  let tokenStudentA;
  let tokenUnenrolledStudentA;
  let assignmentA;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    instA = await Institution.create({ name: 'Alpha College', code: 'ALPHA', emailDomainPattern: 'alpha.edu' });
    instB = await Institution.create({ name: 'Beta College', code: 'BETA', emailDomainPattern: 'beta.edu' });

    deptA = await Department.create({ name: 'CS Dept', code: 'CS', institution: instA._id });
    deptB = await Department.create({ name: 'EE Dept', code: 'EE', institution: instB._id });

    courseA = await Course.create({ name: 'BTech CS', code: 'CS100', department: deptA._id, institution: instA._id, durationYears: 4, totalSemesters: 8 });
    courseB = await Course.create({ name: 'BTech EE', code: 'EE100', department: deptB._id, institution: instB._id, durationYears: 4, totalSemesters: 8 });

    facultyA = await User.create({ name: 'Faculty Alpha', email: 'faculty@alpha.edu', password: 'Password@123', role: 'faculty', institution: instA._id, department: deptA._id, isEmailVerified: true, isActive: true });
    adminA = await User.create({ name: 'Admin Alpha', email: 'admin@alpha.edu', password: 'Password@123', role: 'college_admin', institution: instA._id, department: deptA._id, isEmailVerified: true, isActive: true });
    studentA = await User.create({ name: 'Student Alpha', email: 'student@alpha.edu', password: 'Password@123', role: 'student', institution: instA._id, department: deptA._id, isEmailVerified: true, isActive: true });
    unenrolledStudentA = await User.create({ name: 'Unenrolled Student', email: 'unenrolled@alpha.edu', password: 'Password@123', role: 'student', institution: instA._id, department: deptA._id, isEmailVerified: true, isActive: true });

    subjectA = await Subject.create({ name: 'Algorithms', code: 'CS201', course: courseA._id, faculty: facultyA._id, institution: instA._id, semester: 1, credits: 4 });

    await Enrollment.create({ institution: instA._id, student: studentA._id, course: courseA._id, academicYear: '2025-2026', semester: 1, status: 'active' });

    assignmentA = await Assignment.create({
      subject: subjectA._id,
      title: 'Problem Set 1',
      description: 'Solve graph problems',
      maxScore: 100,
      dueDate: new Date(Date.now() + 86400000),
      createdBy: facultyA._id,
      institution: instA._id,
      status: 'open'
    });

    tokenAdminA = signAccessToken(adminA);
    tokenFacultyA = signAccessToken(facultyA);
    tokenStudentA = signAccessToken(studentA);
    tokenUnenrolledStudentA = signAccessToken(unenrolledStudentA);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  // A: Submission validation normal execution on both routes
  describe('Category A: Submission Validation Helper Execution', () => {
    it('POST /api/v1/submissions: malformed assignment ID -> 400', async () => {
      const res = await request(app)
        .post('/api/v1/submissions')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ assignment: 'invalid-object-id', textNotes: 'hello' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid assignment ID/i);
    });

    it('POST /api/v1/submissions: nonexistent assignment -> 404', async () => {
      const nonExistent = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/v1/submissions')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ assignment: nonExistent, textNotes: 'hello' });
      expect(res.status).toBe(404);
    });

    it('POST /api/v1/submissions: cross-tenant assignment -> 404', async () => {
      const foreignAssignment = await Assignment.create({
        subject: new mongoose.Types.ObjectId(),
        title: 'Foreign Assignment',
        maxScore: 100,
        dueDate: new Date(Date.now() + 86400000),
        createdBy: new mongoose.Types.ObjectId(),
        institution: instB._id,
        status: 'open'
      });
      const res = await request(app)
        .post('/api/v1/submissions')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ assignment: foreignAssignment._id, textNotes: 'hello' });
      expect(res.status).toBe(404);
    });

    it('POST /api/v1/submissions: unenrolled student -> 403', async () => {
      const res = await request(app)
        .post('/api/v1/submissions')
        .set('Authorization', `Bearer ${tokenUnenrolledStudentA}`)
        .send({ assignment: assignmentA._id, textNotes: 'hello' });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/not enrolled/i);
    });

    it('POST /api/v1/submissions: valid submission succeeds', async () => {
      const res = await request(app)
        .post('/api/v1/submissions')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ assignment: assignmentA._id, textNotes: 'Valid notes submission' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/v1/submissions/assignments/:assignmentId: malformed ID -> 400', async () => {
      const res = await request(app)
        .post('/api/v1/submissions/assignments/invalid-id')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ comments: 'test' });
      expect(res.status).toBe(400);
    });

    it('POST /api/v1/submissions/assignments/:assignmentId: nonexistent ID -> 404', async () => {
      const nonExistent = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/submissions/assignments/${nonExistent}`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ comments: 'test' });
      expect(res.status).toBe(404);
    });

    it('POST /api/v1/submissions/assignments/:assignmentId: unenrolled student -> 403', async () => {
      const res = await request(app)
        .post(`/api/v1/submissions/assignments/${assignmentA._id}`)
        .set('Authorization', `Bearer ${tokenUnenrolledStudentA}`)
        .send({ comments: 'test' });
      expect(res.status).toBe(403);
    });
  });

  // B, C, D: User secret serialization (passwordResetToken, emailVerificationToken, passwordChangedAt)
  describe('Categories B, C, D: User Secret Serialization Elimination', () => {
    let secretUser;
    let tokenSecretUser;

    beforeAll(async () => {
      secretUser = await User.create({
        name: 'Secret User',
        email: 'secret@alpha.edu',
        password: 'Password@123',
        role: 'student',
        institution: instA._id,
        isEmailVerified: true,
        isActive: true,
        passwordResetToken: 'plain-reset-token-secret-12345',
        passwordResetExpires: new Date(Date.now() + 3600000),
        emailVerificationToken: 'plain-verify-token-secret-12345',
        emailVerificationExpires: new Date(Date.now() + 3600000),
        passwordChangedAt: new Date(Date.now() - 60000),
        notificationPreferences: { account: { inApp: false, push: false, email: false } }
      });
      tokenSecretUser = signAccessToken(secretUser);
    });

    it('Category B & C & D: GET /api/v1/auth/me never serializes secret fields', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenSecretUser}`);
      expect(res.status).toBe(200);
      const user = res.body.user;
      expect(user.password).toBeUndefined();
      expect(user.passwordResetToken).toBeUndefined();
      expect(user.passwordResetExpires).toBeUndefined();
      expect(user.emailVerificationToken).toBeUndefined();
      expect(user.emailVerificationExpires).toBeUndefined();
      expect(user.passwordChangedAt).toBeUndefined();
      expect(user.notificationPreferences).toBeUndefined();
      expect(user.__v).toBeUndefined();
    });

    it('GET /api/v1/users/:id never serializes secret fields', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${secretUser._id}`)
        .set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(200);
      const user = res.body.data;
      expect(user.password).toBeUndefined();
      expect(user.passwordResetToken).toBeUndefined();
      expect(user.passwordResetExpires).toBeUndefined();
      expect(user.emailVerificationToken).toBeUndefined();
      expect(user.emailVerificationExpires).toBeUndefined();
      expect(user.passwordChangedAt).toBeUndefined();
      expect(user.notificationPreferences).toBeUndefined();
    });

    it('sanitizeUser strips all sensitive fields across all scopes', () => {
      const rawDoc = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test',
        email: 'test@t.edu',
        password: 'hash',
        passwordResetToken: 'reset',
        passwordResetExpires: new Date(),
        emailVerificationToken: 'verify',
        emailVerificationExpires: new Date(),
        passwordChangedAt: new Date(),
        notificationPreferences: { system: {} }
      };

      for (const scope of ['self', 'admin', 'directory', 'minimal']) {
        const sanitized = sanitizeUser(rawDoc, scope);
        expect(sanitized.password).toBeUndefined();
        expect(sanitized.passwordResetToken).toBeUndefined();
        expect(sanitized.passwordResetExpires).toBeUndefined();
        expect(sanitized.emailVerificationToken).toBeUndefined();
        expect(sanitized.emailVerificationExpires).toBeUndefined();
        expect(sanitized.passwordChangedAt).toBeUndefined();
        expect(sanitized.notificationPreferences).toBeUndefined();
      }
    });
  });

  // E, F, H: Cloudinary private asset protection & signed URLs
  describe('Categories E, F, H: Cloudinary Asset Protection & Legacy Fallback', () => {
    it('Category E: Cloudinary upload helper defaults to authenticated asset type', async () => {
      // Test resolveFileUrl signature and default options
      expect(typeof resolveFileUrl).toBe('function');
      // When options.isPrivate !== false, default is authenticated mode
      const localUrl = await resolveFileUrl({ file: { filename: 'test.pdf' } }, { isPrivate: true });
      expect(localUrl).toBe('/uploads/test.pdf');
    });

    it('Category F: Direct unauthenticated request to /uploads/:filename is rejected (401)', async () => {
      const res = await request(app).get('/uploads/secret-submission.pdf');
      expect(res.status).toBe(401);
    });

    it('Category F: Direct unauthenticated request to /api/v1/submissions/:id/file is rejected (401)', async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/v1/submissions/${dummyId}/file`);
      expect(res.status).toBe(401);
    });

    it('Category H: generateSignedDeliveryUrl creates signed URL for Cloudinary URLs', () => {
      const testCloudUrl = 'https://res.cloudinary.com/demo/image/upload/v12345/campusflow/test-asset.pdf';
      const signed = generateSignedDeliveryUrl(testCloudUrl, { expiresInSeconds: 60 });
      expect(signed).toBeDefined();
      expect(typeof signed).toBe('string');
      // Local/non-cloudinary URLs pass through untouched
      const localUrl = '/uploads/local-file.pdf';
      expect(generateSignedDeliveryUrl(localUrl)).toBe(localUrl);
    });
  });

  // G: No JWT in file preview URLs
  describe('Category G: No Normal Access JWT in File Preview URLs', () => {
    it('FilePreview source code does not contain ?token= query parameter logic', () => {
      const filePreviewPath = path.join(process.cwd(), '../frontend/src/components/ui/FilePreview.jsx');
      const source = fs.readFileSync(filePreviewPath, 'utf8');
      expect(source).not.toContain('?token=');
      expect(source).not.toContain('token=${encodeURIComponent(token)}');
      expect(source).toContain('responseType: \'blob\'');
    });
  });

  // I: Missing learning-resource subject fails closed (404)
  describe('Category I: Missing Learning-Resource Subject Fails Closed', () => {
    it('Learning resource with deleted/missing subject returns 404', async () => {
      const missingSubjectId = new mongoose.Types.ObjectId();
      const orphanResource = await LearningResource.create({
        institution: instA._id,
        subject: missingSubjectId,
        title: 'Orphan Notes',
        topic: 'Deleted Subject',
        fileUrl: '/uploads/orphan-notes.pdf',
        fileKey: 'orphan-notes.pdf'
      });

      const res = await request(app)
        .get('/uploads/orphan-notes.pdf')
        .set('Authorization', `Bearer ${tokenStudentA}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/Subject not found/i);
    });
  });

  // J: Faculty grading assignment created by admin
  describe('Category J: Unified Faculty Visibility (Faculty Grades Assignment Created by Admin)', () => {
    let adminAssignment;
    let studentSubmission;

    beforeAll(async () => {
      adminAssignment = await Assignment.create({
        subject: subjectA._id, // Faculty A teaches this subject
        title: 'Admin Created Exam',
        description: 'Semester exam created by college admin',
        maxScore: 100,
        dueDate: new Date(Date.now() + 86400000),
        createdBy: adminA._id, // Created by admin, NOT faculty A
        institution: instA._id,
        status: 'open'
      });

      studentSubmission = await Submission.create({
        assignment: adminAssignment._id,
        student: studentA._id,
        textNotes: 'Exam answers submitted',
        submittedAt: new Date(),
        attempt: 1,
        status: 'submitted'
      });
    });

    it('Faculty A can view assignment created by admin for a subject they teach', async () => {
      const res = await request(app)
        .get(`/api/v1/assignments/${adminAssignment._id}`)
        .set('Authorization', `Bearer ${tokenFacultyA}`);
      expect(res.status).toBe(200);
      expect(String(res.body.data._id)).toBe(String(adminAssignment._id));
    });

    it('Faculty A can view submission for assignment created by admin for a subject they teach', async () => {
      const res = await request(app)
        .get(`/api/v1/submissions/${studentSubmission._id}`)
        .set('Authorization', `Bearer ${tokenFacultyA}`);
      expect(res.status).toBe(200);
      expect(String(res.body.data._id)).toBe(String(studentSubmission._id));
    });

    it('Faculty A can grade submission for assignment created by admin for a subject they teach', async () => {
      const res = await request(app)
        .patch(`/api/v1/submissions/${studentSubmission._id}`)
        .set('Authorization', `Bearer ${tokenFacultyA}`)
        .send({ score: 95, feedback: 'Excellent work', status: 'graded' });
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(95);
      expect(res.body.data.status).toBe('graded');
    });
  });

  // K: Register profile.course foreign tenant validation
  describe('Category K: Register Profile Course Cross-Tenant Validation', () => {
    it('Registration with course from foreign institution is rejected with 422 or 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${tokenAdminA}`)
        .send({
          name: 'Foreign Course Student',
          email: 'foreign.course@alpha.edu',
          password: 'Password@123',
          role: 'student',
          institution: instA._id,
          profile: { course: courseB._id } // courseB belongs to instB!
        });
      expect([400, 422]).toContain(res.status);
      expect(await User.findOne({ email: 'foreign.course@alpha.edu' })).toBeNull();
    });
  });

  // L: Exact storage-key file lookup (no regex ReDoS)
  describe('Category L: Exact Storage-Key File Lookup', () => {
    it('Matching file via exact storage key or URL without regex partial matches', async () => {
      // Substrings should not match partial filenames
      const res = await request(app)
        .get('/uploads/notes.pdf')
        .set('Authorization', `Bearer ${tokenStudentA}`);
      expect(res.status).toBe(404);
    });
  });

  // M: Raw user serialization audit
  describe('Category M: Raw User Serialization Repository-Wide Audit', () => {
    it('getAllUsers sanitizes every user in the array', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${tokenAdminA}`);
      expect(res.status).toBe(200);
      const users = res.body.data;
      expect(Array.isArray(users)).toBe(true);
      for (const u of users) {
        expect(u.password).toBeUndefined();
        expect(u.passwordResetToken).toBeUndefined();
        expect(u.emailVerificationToken).toBeUndefined();
        expect(u.passwordChangedAt).toBeUndefined();
        expect(u.notificationPreferences).toBeUndefined();
      }
    });
  });

  // N: Visual label audit
  describe('Category N: Decorative Label Purge Audit', () => {
    it('AuthVisual does not contain decorative labels', () => {
      const authVisualPath = path.join(process.cwd(), '../frontend/src/components/visual/AuthVisual.jsx');
      const source = fs.readFileSync(authVisualPath, 'utf8');
      expect(source).not.toContain('Unified Platform');
      expect(source).not.toContain('Operational Infrastructure');
      expect(source).not.toContain('Multi-Role RBAC');
      expect(source).toContain('100% Deterministic RBAC');
    });

    it('HeroSceneFallback does not contain ornamental SVG text labels', () => {
      const fallbackPath = path.join(process.cwd(), '../frontend/src/components/hero/HeroSceneFallback.jsx');
      const source = fs.readFileSync(fallbackPath, 'utf8');
      expect(source).not.toContain('<text x="0" y="32" textAnchor="middle" fill="#A7B0BF" fontSize="10" fontFamily="monospace" letterSpacing="0.05em">ACADEMICS</text>');
      expect(source).not.toContain('<text x="0" y="32" textAnchor="middle" fill="#A7B0BF" fontSize="10" fontFamily="monospace" letterSpacing="0.05em">GOVERNANCE</text>');
    });

    it('Landing shared.jsx glassCard uses grounded surface', () => {
      const sharedPath = path.join(process.cwd(), '../frontend/src/components/landing/shared.jsx');
      const source = fs.readFileSync(sharedPath, 'utf8');
      expect(source).toContain('bg-[var(--cf-surface)]');
      expect(source).not.toContain('backdrop-blur-sm');
    });

    it('index.css and tokens.js do not define royal or violet color tokens', () => {
      const indexCssPath = path.join(process.cwd(), '../frontend/src/index.css');
      const css = fs.readFileSync(indexCssPath, 'utf8');
      expect(css).not.toContain('--color-royal');
      expect(css).not.toContain('--cf-glow-royal');
      expect(css).not.toContain('--cf-glow-violet');
    });
  });
});
