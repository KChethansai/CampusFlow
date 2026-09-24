import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { AttendanceSessionModel as AttendanceSession } from '../models/AttendanceSessionModel.js';
import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { RequestModel as Request } from '../models/RequestModel.js';
import { SubmissionModel as Submission } from '../models/SubmissionModel.js';
import { NotificationModel as Notification } from '../models/NotificationModel.js';

// MongoMemoryServer may need more than Jest's 5s default on cold CI hosts.
jest.setTimeout(30000);

let mongod;
const oid = () => new mongoose.Types.ObjectId();
const hasKey = (indexes, key) => indexes.some((idx) => JSON.stringify(idx.key) === JSON.stringify(key));

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([
    Enrollment.createIndexes(),
    AttendanceSession.createIndexes(),
    Assignment.createIndexes(),
    Request.createIndexes(),
    Submission.createIndexes(),
    Notification.createIndexes()
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('data integrity: duplicate guards', () => {
  it('rejects a duplicate active enrollment for the same (student, course, academicYear)', async () => {
    const triple = { institution: oid(), student: oid(), course: oid(), academicYear: '2026', semester: 1 };
    await Enrollment.create({ ...triple, status: 'active' });
    await expect(Enrollment.create({ ...triple, status: 'active' })).rejects.toMatchObject({ code: 11000 });
  });

  it('supports reactivation in place without a second document', async () => {
    const triple = { institution: oid(), student: oid(), course: oid(), academicYear: '2026', semester: 1 };
    const doc = await Enrollment.create({ ...triple, status: 'dropped' });
    doc.status = 'active';
    await expect(doc.save()).resolves.toBeDefined();
    await expect(Enrollment.countDocuments({ student: triple.student, course: triple.course })).resolves.toBe(1);
  });

  it('blocks a duplicate attendance session at DB level for the same (institution, subject, date, period)', async () => {
    const base = { institution: oid(), subject: oid(), date: new Date('2026-09-24'), period: 1, markedBy: oid() };
    await AttendanceSession.create(base);
    await expect(AttendanceSession.create(base)).rejects.toMatchObject({ code: 11000 });
  });

  it('allows the same subject/date with a different period', async () => {
    const base = { institution: oid(), subject: oid(), date: new Date('2026-09-24'), period: 1, markedBy: oid() };
    await AttendanceSession.create(base);
    await expect(AttendanceSession.create({ ...base, period: 2 })).resolves.toBeDefined();
  });
});

describe('data integrity: key indexes exist', () => {
  it('enrollment dedupe + hot-filter indexes', async () => {
    const indexes = await Enrollment.collection.indexes();
    const unique = indexes.find((idx) => JSON.stringify(idx.key) === JSON.stringify({ student: 1, course: 1, academicYear: 1 }));
    expect(unique?.unique).toBe(true);
    expect(hasKey(indexes, { student: 1, status: 1 })).toBe(true);
  });

  it('attendance session uniqueness + hot-filter indexes', async () => {
    const indexes = await AttendanceSession.collection.indexes();
    const unique = indexes.find(
      (idx) => JSON.stringify(idx.key) === JSON.stringify({ institution: 1, subject: 1, date: 1, period: 1 })
    );
    expect(unique?.unique).toBe(true);
    expect(hasKey(indexes, { institution: 1, subject: 1, date: 1 })).toBe(true);
  });

  it('hot-filter indexes on assignment, request, submission, notification', async () => {
    expect(hasKey(await Assignment.collection.indexes(), { subject: 1, status: 1 })).toBe(true);
    expect(hasKey(await Request.collection.indexes(), { institution: 1, status: 1 })).toBe(true);
    const subUnique = (await Submission.collection.indexes()).find(
      (idx) => JSON.stringify(idx.key) === JSON.stringify({ assignment: 1, student: 1 })
    );
    expect(subUnique?.unique).toBe(true);
    expect(hasKey(await Notification.collection.indexes(), { recipient: 1, isRead: 1, createdAt: -1 })).toBe(true);
  });
});
