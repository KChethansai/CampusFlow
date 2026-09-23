import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { UserModel as User } from '../models/UserModel.js';
import { EventModel as Event } from '../models/EventModel.js';
import { AnnouncementModel as Announcement } from '../models/AnnouncementModel.js';
import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { buildDigest } from '../services/digest.service.js';
import { createNotification } from '../services/notification.service.js';

jest.setTimeout(30000);

let mongod;
let userA;
let userB;
let tokenA;
let tokenB;

const login = async (email) => (await request(app).post('/api/v1/auth/login').send({ email, password: 'Password@123' })).body.accessToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  userA = await User.create({ name: 'Student A', email: 'a@prefs.edu', password: 'Password@123', role: 'student', isEmailVerified: true });
  userB = await User.create({ name: 'Student B', email: 'b@prefs.edu', password: 'Password@123', role: 'student', isEmailVerified: true });
  tokenA = await login(userA.email);
  tokenB = await login(userB.email);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe('per-user onboarding and notification preferences', () => {
  it('persists tour completion on the authenticated user only', async () => {
    expect((await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${tokenA}`)).body.user.onboardingTourCompleted).toBe(false);
    expect((await request(app).patch('/api/v1/users/me/onboarding-tour').send({ completed: true })).status).toBe(401);
    expect((await request(app).patch('/api/v1/users/me/onboarding-tour').set('Authorization', `Bearer ${tokenA}`).send({ completed: true, userId: userB._id })).status).toBe(400);
    const completed = await request(app).patch('/api/v1/users/me/onboarding-tour').set('Authorization', `Bearer ${tokenA}`).send({ completed: true });
    expect(completed.status).toBe(200);
    expect(completed.body.data.onboardingTourCompleted).toBe(true);
    expect((await User.findById(userB._id)).onboardingTourCompleted).toBe(false);
    expect((await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${tokenA}`)).body.user.onboardingTourCompleted).toBe(true);
  });

  it('defaults every supported channel on and accepts only partial allowlisted updates', async () => {
    expect((await request(app).get('/api/v1/notifications/preferences')).status).toBe(401);
    const defaults = await request(app).get('/api/v1/notifications/preferences').set('Authorization', `Bearer ${tokenA}`);
    expect(defaults.status).toBe(200);
    expect(Object.keys(defaults.body.data)).toEqual(['assignment', 'event', 'announcement', 'request', 'placement', 'account', 'system']);
    expect(Object.values(defaults.body.data).every((preference) => preference.inApp && preference.push && preference.email)).toBe(true);

    const update = await request(app).patch('/api/v1/notifications/preferences').set('Authorization', `Bearer ${tokenA}`)
      .send({ preferences: { placement: { push: false, email: false } } });
    expect(update.status).toBe(200);
    expect(update.body.data.placement).toEqual({ inApp: true, push: false, email: false });
    expect(update.body.data.event).toEqual({ inApp: true, push: true, email: true });
    expect((await request(app).patch('/api/v1/notifications/preferences').set('Authorization', `Bearer ${tokenA}`)
      .send({ recipient: userB._id, preferences: { placement: { email: false } } })).status).toBe(400);
    expect((await request(app).patch('/api/v1/notifications/preferences').set('Authorization', `Bearer ${tokenA}`)
      .send({ preferences: { unknown: { email: false } } })).status).toBe(400);
    expect((await request(app).get('/api/v1/notifications/preferences').set('Authorization', `Bearer ${tokenB}`)).body.data.placement.email).toBe(true);
  });

  it('uses channel preferences for in-app visibility and weekly digest content', async () => {
    await request(app).patch('/api/v1/notifications/preferences').set('Authorization', `Bearer ${tokenA}`)
      .send({ preferences: {
      account: { inApp: false, push: false, email: true },
      request: { inApp: true, push: false, email: false },
      system: { inApp: false, push: false, email: false },
      placement: { inApp: false, push: true, email: false }
    } });
    expect(await createNotification({ recipient: userA._id, title: 'Suppressed update', category: 'system' })).toBeNull();
    await createNotification({ recipient: userA._id, title: 'Account update', category: 'account' });
    await createNotification({ recipient: userA._id, title: 'Request update', category: 'request' });
    await createNotification({ recipient: userA._id, title: 'Realtime-only update', category: 'placement' });

    const visible = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${tokenA}`);
    expect(visible.status).toBe(200);
    expect(visible.body.data.map((notification) => notification.title)).toContain('Request update');
    expect(visible.body.data.map((notification) => notification.title)).not.toContain('Account update');
    expect(visible.body.data.map((notification) => notification.title)).not.toContain('Realtime-only update');
    const digest = await buildDigest(await User.findById(userA._id).lean());
    expect(digest.html).toContain('Account update');
    expect(digest.html).not.toContain('Request update');
    expect(digest.subject).toContain('1 unread');
  });

  it('keeps department-only content and draft assignments out of unrelated digests', async () => {
    const institution = new mongoose.Types.ObjectId();
    const ownDepartment = new mongoose.Types.ObjectId();
    const otherDepartment = new mongoose.Types.ObjectId();
    userA.institution = institution;
    userA.department = ownDepartment;
    userB.institution = institution;
    await Promise.all([userA.save(), userB.save()]);
    const soon = new Date(Date.now() + 86400000);
    await Event.create([
      { institution, title: 'Public campus event', startAt: soon, visibility: 'public' },
      { institution, department: otherDepartment, title: 'Other department event', startAt: soon, visibility: 'department' }
    ]);
    await Announcement.create([
      { institution, title: 'Campus announcement', createdBy: userB._id },
      { institution, department: otherDepartment, title: 'Other department announcement', createdBy: userB._id }
    ]);
    const course = await Course.create({ institution, department: ownDepartment, name: 'Computing', code: 'CS' });
    const subject = await Subject.create({ institution, course: course._id, code: 'CS101', name: 'Computing 101', semester: 1 });
    await Enrollment.create({ institution, student: userA._id, course: course._id, academicYear: '2026', semester: 1 });
    await Assignment.create([
      { institution, subject: subject._id, title: 'Published course assignment', dueDate: soon, status: 'open', createdBy: userB._id },
      { institution, subject: subject._id, title: 'Draft course assignment', dueDate: soon, status: 'draft', createdBy: userB._id }
    ]);

    const digest = await buildDigest(await User.findById(userA._id).lean());
    expect(digest.html).toContain('Public campus event');
    expect(digest.html).toContain('Campus announcement');
    expect(digest.html).not.toContain('Other department event');
    expect(digest.html).not.toContain('Other department announcement');
    expect(digest.html).toContain('Published course assignment');
    expect(digest.html).not.toContain('Draft course assignment');
  });
});
