import mongoose from 'mongoose';
import { AttendanceSessionModel as AttendanceSession } from '../models/AttendanceSessionModel.js';
import { JobApplicationModel as JobApplication } from '../models/JobApplicationModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { UserModel as User } from '../models/UserModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const objId = (v) => (mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : null);

// Attendance trend: per-session present% over the term, optionally one
// student (?student=) or one subject (?subject=). present+od count as attended.
export const attendanceTrend = asyncHandler(async (req, res) => {
  const match = { institution: new mongoose.Types.ObjectId(req.user.institution) };
  const subject = req.query.subject ? objId(req.query.subject) : null;
  if (subject) match.subject = subject;
  const student = req.query.student ? objId(req.query.student) : null;
  // Students see only their own trend; staff may pass ?student=.
  const effectiveStudent = req.user.role === 'student' ? new mongoose.Types.ObjectId(req.user._id) : student;
  if (effectiveStudent) match['records.student'] = effectiveStudent;

  const sessions = await AttendanceSession.find(match)
    .select('date subject records')
    .populate('subject', 'name')
    .sort('date')
    .limit(120)
    .lean();
  const data = sessions.map((s) => {
    const rows = effectiveStudent
      ? s.records.filter((r) => String(r.student) === String(effectiveStudent))
      : s.records;
    const attended = rows.filter((r) => r.status === 'present' || r.status === 'od').length;
    return {
      date: s.date,
      label: new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      subject: s.subject?.name || '',
      rate: rows.length ? Math.round((attended / rows.length) * 100) : 0
    };
  });
  res.json({ success: true, data });
});

// Placement funnel: drives → applications → shortlisted → offers(+placed).
export const placementFunnel = asyncHandler(async (req, res) => {
  const inst = new mongoose.Types.ObjectId(req.user.institution);
  const [drives, apps] = await Promise.all([
    (await import('../models/JobDriveModel.js')).JobDriveModel.countDocuments({ institution: inst }),
    JobApplication.aggregate([
      { $lookup: { from: 'jobdrives', localField: 'drive', foreignField: '_id', as: 'd' } },
      { $unwind: '$d' },
      { $match: { 'd.institution': inst } },
      { $group: { _id: '$stage', count: { $sum: 1 } } }
    ])
  ]);
  const byStage = Object.fromEntries(apps.map((a) => [a._id, a.count]));
  const shortlisted = ['shortlisted', 'assessment', 'interview_1', 'interview_2', 'hr_round', 'interview']
    .reduce((n, s) => n + (byStage[s] || 0), 0);
  const data = [
    { stage: 'drives', count: drives },
    { stage: 'applied', count: apps.reduce((n, a) => n + a.count, 0) },
    { stage: 'shortlisted', count: shortlisted },
    { stage: 'offer', count: (byStage.offer || 0) + (byStage.placed || 0) }
  ];
  res.json({ success: true, data });
});

// Admin overview: active enrollments per department + GPA distribution.
export const enrollmentOverview = asyncHandler(async (req, res) => {
  const inst = new mongoose.Types.ObjectId(req.user.institution);
  const [byDept, gpas] = await Promise.all([
    Enrollment.aggregate([
      { $match: { institution: inst, status: 'active' } },
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'c' } },
      { $unwind: '$c' },
      { $lookup: { from: 'departments', localField: 'c.department', foreignField: '_id', as: 'dep' } },
      { $unwind: { path: '$dep', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$dep.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    User.find({ institution: inst, role: 'student', 'profile.cgpa': { $ne: null } })
      .select('profile.cgpa')
      .limit(2000)
      .lean()
  ]);
  const buckets = [
    { range: '<6', count: 0 },
    { range: '6–7', count: 0 },
    { range: '7–8', count: 0 },
    { range: '8–9', count: 0 },
    { range: '9+', count: 0 }
  ];
  gpas.forEach(({ profile }) => {
    const g = Number(profile?.cgpa);
    if (Number.isNaN(g)) return;
    const i = g < 6 ? 0 : g < 7 ? 1 : g < 8 ? 2 : g < 9 ? 3 : 4;
    buckets[i].count += 1;
  });
  res.json({
    success: true,
    data: {
      byDepartment: byDept.map((d) => ({ department: d._id || 'Unassigned', count: d.count })),
      gpa: buckets
    }
  });
});
