import { UserModel as User } from '../models/UserModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';
import { AnnouncementModel as Announcement } from '../models/AnnouncementModel.js';
import { EventModel as Event } from '../models/EventModel.js';
import { JobDriveModel as JobDrive } from '../models/JobDriveModel.js';
import { CompanyModel as Company } from '../models/CompanyModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { eventAudienceFilter } from './eventcontroller.js';
import { getAnnouncementAudienceFilter } from './announcementcontroller.js';

const PER_ENTITY = 6; // bounded fan-in — one round trip, small payloads

const rx = (q) => new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape regex

// Cross-entity search scoped by institution + role. Users are
// admin/staff-only; students get courses/announcements/events/drives.
export const globalSearch = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 80);
  if (q.length < 2) return res.json({ success: true, data: [] });
  const re = rx(q);
  const inst = { institution: req.user.institution };
  const role = req.user.role;
  const canSeePeople = role !== 'student';

  const [annFilter, evFilter] = await Promise.all([
    getAnnouncementAudienceFilter(req.user),
    eventAudienceFilter(req.user)
  ]);

  const jobs = [
    Course.find({ ...inst, $or: [{ name: re }, { code: re }] })
      .select('name code').limit(PER_ENTITY).lean()
      .then((r) => r.map((x) => ({ entity: 'Courses', title: `${x.name} (${x.code})`, link: '/courses' }))),
    Announcement.find({ $and: [annFilter, { $or: [{ title: re }, { body: re }] }] })
      .select('title').limit(PER_ENTITY).lean()
      .then((r) => r.map((x) => ({ entity: 'Announcements', title: x.title, link: '/events' }))),
    Event.find({ $and: [evFilter, { $or: [{ title: re }, { description: re }] }] })
      .select('title').limit(PER_ENTITY).lean()
      .then((r) => r.map((x) => ({ entity: 'Events', title: x.title, link: '/events' }))),
    JobDrive.find({ ...inst, role: re })
      .select('role').limit(PER_ENTITY).lean()
      .then((r) => r.map((x) => ({ entity: 'Drives', title: x.role, link: '/placement' }))),
    Company.find({ ...inst, $or: [{ name: re }, { industry: re }] })
      .select('name').limit(PER_ENTITY).lean()
      .then((r) => r.map((x) => ({ entity: 'Companies', title: x.name, link: '/placement' })))
  ];
  if (canSeePeople) {
    jobs.push(
      User.find({ ...inst, $or: [{ name: re }, { email: re }] })
        .select('name email role').limit(PER_ENTITY).lean()
        .then((r) => r.map((x) => ({ entity: 'People', title: x.name || x.email, sub: x.role, link: '/directory' })))
    );
  }

  const groups = await Promise.all(jobs);
  res.json({ success: true, data: groups.flat() });
});
