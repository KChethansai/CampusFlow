import mongoose from 'mongoose';
import { TimetableModel as Timetable, TIMETABLE_DAYS } from '../models/TimetableModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { RoomModel as Room } from '../models/RoomModel.js';
import { UserModel as User } from '../models/UserModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick, scopedOne, tenantFilter } from '../utils/scope.js';
import { canHodAccessSubject, getHodDepartmentSubjectIds } from '../utils/academicScope.js';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const POPULATE = [
  { path: 'subject', select: 'name code semester course' },
  { path: 'faculty', select: 'name email role' },
  { path: 'room', select: 'name code capacity' },
];

/** Validate refs/time fields; returns resolved docs. Throws 400/404. */
const resolveSlotRefs = async (req, { subject, faculty, room, dayOfWeek, startTime, endTime }) => {
  if (!subject || !mongoose.isValidObjectId(subject)) throw new ApiError(400, 'Invalid subject ID');
  if (!room || !mongoose.isValidObjectId(room)) throw new ApiError(400, 'Invalid room ID');
  if (!TIMETABLE_DAYS.includes(dayOfWeek)) {
    throw new ApiError(400, `dayOfWeek must be one of ${TIMETABLE_DAYS.join(', ')}`);
  }
  if (!TIME_RE.test(startTime || '') || !TIME_RE.test(endTime || '')) {
    throw new ApiError(400, 'startTime and endTime must use HH:MM (24h)');
  }
  if (startTime >= endTime) {
    throw new ApiError(400, 'startTime must be before endTime');
  }

  const subjectDoc = await Subject.findOne({ _id: subject, institution: req.user.institution });
  if (!subjectDoc) throw new ApiError(404, 'Subject not found in institution');
  const roomDoc = await Room.findOne({ _id: room, institution: req.user.institution });
  if (!roomDoc) throw new ApiError(404, 'Room not found in institution');

  let facultyDoc = null;
  if (faculty) {
    if (!mongoose.isValidObjectId(faculty)) throw new ApiError(400, 'Invalid faculty ID');
    facultyDoc = await User.findOne({
      _id: faculty,
      institution: req.user.institution,
      role: { $in: ['hod', 'faculty', 'college_admin', 'super_admin'] },
    });
    if (!facultyDoc) throw new ApiError(404, 'Faculty user not found or unauthorized');
  }

  return { subjectDoc, roomDoc, facultyDoc };
};

/** Same room OR same faculty overlapping on the same day → clash.
 *  Zero-padded HH:MM strings compare lexicographically as times. */
const assertNoClash = async (req, { dayOfWeek, startTime, endTime, room, faculty }, excludeId = null) => {
  const holders = [{ room }];
  if (faculty) holders.push({ faculty });
  const clash = await Timetable.findOne({
    institution: req.user.institution,
    dayOfWeek,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    $or: holders,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  }).select('_id');
  if (clash) {
    throw new ApiError(400, 'Timetable clash: room or faculty already booked for this slot');
  }
};

const assertHodOwnDept = async (req, subjectDoc) => {
  if (req.user.role === 'hod' && !(await canHodAccessSubject(req.user, subjectDoc))) {
    throw new ApiError(403, 'You can only manage timetable entries in your own department');
  }
};

/** Subject IDs visible to the caller; null = all (admin). */
const visibleSubjectIds = async (user) => {
  if (user.role === 'student') {
    const courses = await Enrollment.find({
      student: user._id,
      institution: user.institution,
      status: 'active',
    }).distinct('course');
    if (!courses.length) return [];
    return await Subject.find({ course: { $in: courses }, institution: user.institution }).distinct('_id');
  }
  if (user.role === 'faculty') {
    return await Subject.find({ faculty: user._id, institution: user.institution }).distinct('_id');
  }
  if (user.role === 'hod') {
    return await getHodDepartmentSubjectIds(user);
  }
  return null;
};

// Create timetable entry
export const createTimetableEntry = asyncHandler(async (req, res) => {
  const { subject, faculty, room, dayOfWeek, startTime, endTime } = req.body;
  const { subjectDoc } = await resolveSlotRefs(req, { subject, faculty, room, dayOfWeek, startTime, endTime });
  await assertHodOwnDept(req, subjectDoc);
  await assertNoClash(req, { dayOfWeek, startTime, endTime, room, faculty });

  const entry = await Timetable.create({
    subject,
    faculty: faculty || undefined,
    room,
    dayOfWeek,
    startTime,
    endTime,
    institution: req.user.institution,
  });

  res.status(201).json({ success: true, data: entry });
});

// List timetable entries (paged, role-scoped)
export const getAllTimetableEntries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = tenantFilter(req);
  const subjectIds = await visibleSubjectIds(req.user);
  if (subjectIds) {
    filter.subject = { $in: subjectIds };
  }
  if (req.user.role === 'faculty') {
    filter.$or = [{ subject: { $in: subjectIds } }, { faculty: req.user._id }];
    delete filter.subject;
  }
  if (req.query.dayOfWeek) {
    if (!TIMETABLE_DAYS.includes(req.query.dayOfWeek)) {
      throw new ApiError(400, `dayOfWeek must be one of ${TIMETABLE_DAYS.join(', ')}`);
    }
    filter.dayOfWeek = req.query.dayOfWeek;
  }
  const [entries, total] = await Promise.all([
    Timetable.find(filter).populate(POPULATE).sort({ dayOfWeek: 1, startTime: 1 }).skip(skip).limit(limit),
    Timetable.countDocuments(filter),
  ]);

  pagedResponse(res, entries, total, { page, limit });
});

// Get single entry (tenant-scoped; out-of-scope reads as not-found)
export const getTimetableEntryById = asyncHandler(async (req, res) => {
  const entry = await scopedOne(Timetable, req, req.params.id, POPULATE);

  if (req.user.role === 'hod') {
    const subject = entry.subject?._id ? entry.subject : await Subject.findById(entry.subject);
    if (!(await canHodAccessSubject(req.user, subject))) {
      throw new ApiError(404, 'Timetable entry not found');
    }
  } else if (req.user.role === 'faculty') {
    const teaches = entry.faculty && String(entry.faculty?._id || entry.faculty) === String(req.user._id);
    const subject = entry.subject?._id ? entry.subject : await Subject.findById(entry.subject).select('faculty');
    const ownsSubject = subject && String(subject.faculty) === String(req.user._id);
    if (!teaches && !ownsSubject) throw new ApiError(404, 'Timetable entry not found');
  } else if (req.user.role === 'student') {
    const allowed = await visibleSubjectIds(req.user);
    const sid = entry.subject?._id || entry.subject;
    if (!allowed.map(String).includes(String(sid))) throw new ApiError(404, 'Timetable entry not found');
  }

  res.json({ success: true, data: entry });
});

// Update entry (tenant-scoped, allowlisted)
export const updateTimetableEntry = asyncHandler(async (req, res) => {
  const existing = await Timetable.findOne({ _id: req.params.id, institution: req.user.institution });
  if (!existing) throw new ApiError(404, 'Timetable entry not found');

  const merged = {
    subject: req.body.subject ?? existing.subject,
    faculty: req.body.faculty !== undefined ? req.body.faculty : existing.faculty,
    room: req.body.room ?? existing.room,
    dayOfWeek: req.body.dayOfWeek ?? existing.dayOfWeek,
    startTime: req.body.startTime ?? existing.startTime,
    endTime: req.body.endTime ?? existing.endTime,
  };
  if (merged.faculty) {
    if (!mongoose.isValidObjectId(merged.faculty)) throw new ApiError(400, 'Invalid faculty ID');
  }

  const { subjectDoc } = await resolveSlotRefs(req, { ...merged, faculty: merged.faculty || undefined });
  if (req.user.role === 'hod') {
    const existingSubject = await Subject.findOne({ _id: existing.subject, institution: req.user.institution });
    if (!existingSubject || !(await canHodAccessSubject(req.user, existingSubject))) {
      throw new ApiError(404, 'Timetable entry not found');
    }
    await assertHodOwnDept(req, subjectDoc);
  }
  await assertNoClash(
    req,
    { dayOfWeek: merged.dayOfWeek, startTime: merged.startTime, endTime: merged.endTime, room: merged.room, faculty: merged.faculty || undefined },
    existing._id
  );

  const updates = pick(req.body, ['subject', 'faculty', 'room', 'dayOfWeek', 'startTime', 'endTime']);
  const entry = await Timetable.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    updates,
    { new: true, runValidators: true }
  );
  if (!entry) throw new ApiError(404, 'Timetable entry not found');

  res.json({ success: true, data: entry });
});

// Delete entry (tenant-scoped)
export const deleteTimetableEntry = asyncHandler(async (req, res) => {
  if (req.user.role === 'hod') {
    const existing = await Timetable.findOne({ _id: req.params.id, institution: req.user.institution });
    const subject = existing && await Subject.findOne({ _id: existing.subject, institution: req.user.institution });
    if (!existing || !(await canHodAccessSubject(req.user, subject))) {
      throw new ApiError(404, 'Timetable entry not found');
    }
  }
  const entry = await Timetable.findOneAndDelete({
    _id: req.params.id,
    institution: req.user.institution,
  });

  if (!entry) {
    throw new ApiError(404, 'Timetable entry not found');
  }

  res.json({ success: true, message: 'Timetable entry deleted' });
});
