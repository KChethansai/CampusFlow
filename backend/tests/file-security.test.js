// file-security.test.js: regression coverage for the authenticated file-delivery
// chain (FilePreview blob fetch -> GET /uploads/:filename -> serveProtectedUpload,
// and multipart POST -> multer -> submitAssignmentFiles).
// Covers: unauthenticated download (401), cross-tenant download (404 on the
// resource path, denied on the submission path), path traversal blocked,
// oversized upload (413), disallowed extension (415 — the code's correct
// contract for "bad MIME"; the filter rejects by extension allowlist).
// Hermetic: NODE_ENV=test forces multer to local disk (no Cloudinary network).
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import app from '../app.js';
import { env } from '../config/env.js';
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

jest.setTimeout(60000);

describe('File delivery security regressions', () => {
  let mongod;
  let assignment;
  let tokenOwner;
  let tokenSameTenant;
  let tokenForeign;
  let submissionFile;
  let resourceFile;
  let canaryName;
  let canaryContent;
  const createdFiles = [];

  const uploadsDir = () => path.join(process.cwd(), 'uploads');
  const writeUpload = (name, content) => {
    if (!fs.existsSync(uploadsDir())) fs.mkdirSync(uploadsDir(), { recursive: true });
    const p = path.join(uploadsDir(), name);
    fs.writeFileSync(p, content);
    createdFiles.push(p);
    return name;
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    const stamp = Date.now();

    const instA = await Institution.create({ name: 'FileSec Alpha', code: `FS${stamp % 100000}`, emailDomainPattern: 'filesec-a.edu' });
    const instB = await Institution.create({ name: 'FileSec Beta', code: `FB${stamp % 100000}`, emailDomainPattern: 'filesec-b.edu' });
    const deptA = await Department.create({ name: 'FileSec CS', code: `FC${stamp % 100000}`, institution: instA._id });
    const courseA = await Course.create({ name: 'FileSec BTech', code: `FBT${stamp % 100000}`, department: deptA._id, institution: instA._id, durationYears: 4, totalSemesters: 8 });

    const facultyA = await User.create({ name: 'FileSec Faculty', email: `filesec-faculty-${stamp}@filesec-a.edu`, password: 'Password@123', role: 'faculty', institution: instA._id, department: deptA._id, isEmailVerified: true, isActive: true });
    const owner = await User.create({ name: 'FileSec Owner', email: `filesec-owner-${stamp}@filesec-a.edu`, password: 'Password@123', role: 'student', institution: instA._id, department: deptA._id, isEmailVerified: true, isActive: true });
    const peer = await User.create({ name: 'FileSec Peer', email: `filesec-peer-${stamp}@filesec-a.edu`, password: 'Password@123', role: 'student', institution: instA._id, department: deptA._id, isEmailVerified: true, isActive: true });
    const foreign = await User.create({ name: 'FileSec Foreign', email: `filesec-foreign-${stamp}@filesec-b.edu`, password: 'Password@123', role: 'student', institution: instB._id, isEmailVerified: true, isActive: true });

    const subjectA = await Subject.create({ name: 'FileSec Algos', code: `FA${stamp % 100000}`, course: courseA._id, faculty: facultyA._id, institution: instA._id, semester: 1, credits: 4 });
    // Both same-tenant students enrolled: peer is legitimately enrolled yet must
    // still be denied the owner's file (ownership isolation, not just enrollment).
    await Enrollment.create({ institution: instA._id, student: owner._id, course: courseA._id, academicYear: '2025-2026', semester: 1, status: 'active' });
    await Enrollment.create({ institution: instA._id, student: peer._id, course: courseA._id, academicYear: '2025-2026', semester: 1, status: 'active' });

    assignment = await Assignment.create({
      subject: subjectA._id,
      title: 'FileSec Problem Set',
      description: 'security fixture',
      maxScore: 100,
      dueDate: new Date(Date.now() + 86400000),
      createdBy: facultyA._id,
      institution: instA._id,
      status: 'open',
      allowResubmission: true
    });

    // Real file on disk behind a submission record.
    submissionFile = writeUpload(`filesec-sub-${stamp}.pdf`, '%PDF-1.4 filesec owner solution');
    await Submission.create({
      assignment: assignment._id,
      student: owner._id,
      status: 'submitted',
      fileUrl: `/uploads/${submissionFile}`,
      fileKey: submissionFile,
      attempt: 1
    });

    // Real file on disk behind a learning-resource record.
    resourceFile = writeUpload(`filesec-res-${stamp}.pdf`, '%PDF-1.4 filesec resource notes');
    await LearningResource.create({
      institution: instA._id,
      subject: subjectA._id,
      title: 'FileSec Notes',
      topic: 'traversal',
      fileUrl: `/uploads/${resourceFile}`,
      fileKey: resourceFile
    });

    // Canary OUTSIDE the upload dir: no traversal attempt may ever serve it.
    canaryName = `.filesec-canary-${stamp}.txt`;
    canaryContent = `TOP-SECRET-CANARY-${stamp}`;
    fs.writeFileSync(path.join(process.cwd(), canaryName), canaryContent);

    tokenOwner = signAccessToken(owner);
    tokenSameTenant = signAccessToken(peer);
    tokenForeign = signAccessToken(foreign);
  });

  afterAll(async () => {
    for (const p of createdFiles) {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
    }
    try { fs.unlinkSync(path.join(process.cwd(), canaryName)); } catch {}
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  it('owner downloads own submission file (200 control — fixture serves)', async () => {
    const res = await request(app)
      .get(`/uploads/${submissionFile}`)
      .set('Authorization', `Bearer ${tokenOwner}`);
    expect(res.status).toBe(200);
    const body = res.text ?? (Buffer.isBuffer(res.body) ? res.body.toString('utf8') : '');
    expect(body).toContain('filesec owner solution');
  });

  it('unauthenticated download is rejected (401)', async () => {
    const res = await request(app).get(`/uploads/${submissionFile}`);
    expect(res.status).toBe(401);
  });

  it('same-tenant non-owner is denied another student file', async () => {
    const res = await request(app)
      .get(`/uploads/${submissionFile}`)
      .set('Authorization', `Bearer ${tokenSameTenant}`);
    expect([403, 404]).toContain(res.status);
  });

  it('cross-tenant download of a submission file is denied', async () => {
    const res = await request(app)
      .get(`/uploads/${submissionFile}`)
      .set('Authorization', `Bearer ${tokenForeign}`);
    expect([403, 404]).toContain(res.status);
  });

  it('cross-tenant download of a learning resource returns 404 (no existence oracle)', async () => {
    const res = await request(app)
      .get(`/uploads/${resourceFile}`)
      .set('Authorization', `Bearer ${tokenForeign}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('path traversal attempts never escape the upload dir', async () => {
    const attempts = [
      `/uploads/..`,
      `/uploads/%2e%2e`,
      `/uploads/..%2f${canaryName}`,
      `/uploads/%2e%2e%2f${canaryName}`,
      `/uploads/..%5c..%5c${canaryName}`,
      `/uploads/%2e%2e%5c${canaryName}`
    ];
    for (const target of attempts) {
      const res = await request(app)
        .get(target)
        .set('Authorization', `Bearer ${tokenOwner}`);
      expect([400, 401, 403, 404]).toContain(res.status);
      expect(res.text || '').not.toContain(canaryContent);
    }
  });

  it('oversized upload is rejected with 413', async () => {
    const tooBig = Buffer.alloc((env.upload.maxMB + 1) * 1024 * 1024, 'a');
    const res = await request(app)
      .post(`/api/v1/submissions/assignments/${assignment._id}`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .attach('file', tooBig, { filename: 'big.pdf', contentType: 'application/pdf' })
      .field('comments', 'oversize attempt');
    expect(res.status).toBe(413);
  });

  it('disallowed extension upload is rejected with 415', async () => {
    const res = await request(app)
      .post(`/api/v1/submissions/assignments/${assignment._id}`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .attach('file', Buffer.from('MZ fake executable'), { filename: 'malware.exe', contentType: 'application/octet-stream' })
      .field('comments', 'bad type attempt');
    expect(res.status).toBe(415);
    expect(res.body.message).toMatch(/unsupported file type/i);
  });
});
