// digest: weekly per-role email digest (node-cron). Pending assignments,
// upcoming events, unread announcements. No-op without SMTP (sendEmail
// skips) and never throws into boot — a failed run logs, nothing more.
import cron from 'node-cron';
import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { EventModel as Event } from '../models/EventModel.js';
import { AnnouncementModel as Announcement } from '../models/AnnouncementModel.js';
import { NotificationModel as Notification } from '../models/NotificationModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { UserModel as User } from '../models/UserModel.js';
import { getNotificationPreferences } from '../models/UserModel.js';
import { sendEmail, isSmtpConfigured } from './email.service.js';

const esc = (s) => String(s || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const li = (items) => items.length
  ? `<ul>${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
  : '<p>Nothing pending — clear week.</p>';

export const buildDigest = async (user) => {
  const now = new Date();
  const weekOut = new Date(now.getTime() + 7 * 86400000);
  const prefs = getNotificationPreferences(user.notificationPreferences);
  const isInstitutionAdmin = ['super_admin', 'college_admin'].includes(user.role);
  const activeCourseIds = user.role === 'student'
    ? (await Enrollment.find({ student: user._id, institution: user.institution, status: 'active' }).distinct('course'))
    : [];
  const activeSubjectIds = activeCourseIds.length
    ? await Subject.find({ institution: user.institution, course: { $in: activeCourseIds } }).distinct('_id')
    : [];
  const visibleSubjectIds = user.role === 'faculty'
    ? await Subject.find({ institution: user.institution, faculty: user._id }).distinct('_id')
    : activeSubjectIds;
  const departmentScope = isInstitutionAdmin ? {} : user.department
    ? { $or: [{ department: { $exists: false } }, { department: null }, { department: user.department }] }
    : { $or: [{ department: { $exists: false } }, { department: null }] };
  const assignmentScope = user.role === 'student'
    ? { status: { $in: ['published', 'open'] }, subject: { $in: activeSubjectIds } }
    : user.role === 'faculty'
      ? { status: { $in: ['published', 'open'] }, createdBy: user._id }
      : isInstitutionAdmin ? { status: { $in: ['published', 'open'] } } : { _id: null };
  const announcementScope = !isInstitutionAdmin
    ? { $and: [departmentScope, { $or: [{ subject: { $exists: false } }, { subject: null }, { subject: { $in: visibleSubjectIds } }] }] }
    : departmentScope;
  const eventScope = isInstitutionAdmin ? {} : {
    $and: [departmentScope, { $or: [
      { visibility: { $in: ['public', 'internal'] } },
      { visibility: { $exists: false } },
      ...(user.department ? [{ visibility: 'department', department: user.department }] : [])
    ] }]
  };
  const [assignments, events, announcements, unread] = await Promise.all([
    prefs.assignment.email ? Assignment.find({ institution: user.institution, dueDate: { $gte: now, $lte: weekOut }, ...assignmentScope })
      .select('title dueDate').sort('dueDate').limit(8).lean() : [],
    prefs.event.email ? Event.find({ institution: user.institution, startAt: { $gte: now, $lte: weekOut }, ...eventScope })
      .select('title startAt').sort('startAt').limit(8).lean() : [],
    prefs.announcement.email ? Announcement.find({ institution: user.institution, createdAt: { $gte: new Date(now.getTime() - 7 * 86400000) }, ...announcementScope })
      .select('title').sort('-createdAt').limit(8).lean() : [],
    Notification.find({ recipient: user._id, isRead: false }).select('category').lean()
  ]);
  const otherCategories = Object.keys(prefs).filter((category) => prefs[category].email && !['assignment', 'event', 'announcement'].includes(category));
  const otherCategoryFilter = [{ category: { $in: otherCategories } }];
  if (otherCategories.includes('system')) otherCategoryFilter.push({ category: { $exists: false } });
  const recentNotifications = otherCategories.length
    ? await Notification.find({ recipient: user._id, createdAt: { $gte: new Date(now.getTime() - 7 * 86400000) }, $or: otherCategoryFilter })
      .select('title category').sort('-createdAt').limit(20).lean()
    : [];
  const otherUpdates = recentNotifications
    .filter((notification) => otherCategories.includes(notification.category || 'system'))
    .slice(0, 8).map((notification) => notification.title);
  const unreadCount = unread.filter((notification) => prefs[notification.category || 'system'].email).length;
  const subject = `CampusFlow weekly digest — ${unreadCount} unread, ${assignments.length} due soon`;
  const html = `
    <h2>Hi ${esc(user.name)}, your week on CampusFlow</h2>
    <h3>Due within 7 days (${assignments.length})</h3>
    ${li(assignments.map((a) => `${a.title} — due ${a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-IN') : 'soon'}`))}
    <h3>Upcoming events (${events.length})</h3>
    ${li(events.map((e) => `${e.title} — ${e.startAt ? new Date(e.startAt).toLocaleString('en-IN') : 'TBA'}`))}
    <h3>Announcements this week (${announcements.length})</h3>
    ${li(announcements.map((a) => a.title))}
    <h3>Other updates (${otherUpdates.length})</h3>
    ${li(otherUpdates)}
    <p>${unreadCount} unread notification${unreadCount === 1 ? '' : 's'} waiting in your center.</p>
  `;
  return { subject, html };
};

export const runDigestOnce = async () => {
  if (!isSmtpConfigured()) return { skipped: true };
  const users = await User.find({ isActive: true, institution: { $exists: true } })
    .select('name email institution role notificationPreferences').lean();
  let sent = 0;
  for (const u of users) {
    if (!u.email || !Object.values(getNotificationPreferences(u.notificationPreferences)).some((preference) => preference.email)) continue;
    try {
      const { subject, html } = await buildDigest(u);
      await sendEmail({ to: u.email, subject, html });
      sent += 1;
    } catch { /* one bad address never blocks the batch */ }
  }
  return { sent };
};

let scheduled = false;

export const startDigestJob = () => {
  if (scheduled) return; // singleton — hot-reload safe
  scheduled = true;
  // Sundays 06:00 IST; missed-tick tolerant (weekly cadence).
  cron.schedule('0 6 * * 0', () => {
    runDigestOnce().catch(() => {});
  }, { timezone: 'Asia/Kolkata' });
};
