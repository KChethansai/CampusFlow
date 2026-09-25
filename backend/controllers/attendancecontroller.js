import mongoose from 'mongoose';
import { AttendanceSessionModel as AttendanceSession } from '../models/AttendanceSessionModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { UserModel as User } from '../models/UserModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { scopedOne, pageParams, pagedResponse } from '../utils/scope.js';
import { getHodDepartmentSubjectIds, canHodAccessSubject } from '../utils/academicScope.js';
import { publishRealtimeToInstitution, publishRealtimeToUser } from '../services/notification.service.js';

// Mark (create) an attendance session
export const markSession = asyncHandler(async (req, res) => {
  const { subject, date, period, records } = req.body;

  if (!subject || !mongoose.isValidObjectId(subject)) {
    throw new ApiError(400, 'Invalid subject ID');
  }

  // Subject must belong to the caller's institution.
  const subjectDoc = await Subject.findOne({ _id: subject, institution: req.user.institution });
  if (!subjectDoc) {
    throw new ApiError(404, 'Subject not found');
  }

  // Faculty may mark attendance ONLY for subjects they teach;
  // HOD may mark for any subject in their own department.
  if (req.user.role === 'faculty' && String(subjectDoc.faculty) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only mark attendance for subjects you teach');
  }
  if (req.user.role === 'hod' && !(await canHodAccessSubject(req.user, subjectDoc))) {
    throw new ApiError(403, 'You can only mark attendance for subjects in your own department');
  }

  if (!Array.isArray(records) || records.length === 0) {
    throw new ApiError(400, 'records must be a non-empty array');
  }

  const validStatuses = ['present', 'absent', 'late', 'od'];
  const studentIds = [];
  for (const record of records) {
    if (!record || !record.student || !mongoose.isValidObjectId(record.student)) {
      throw new ApiError(400, 'Invalid student ID in attendance records');
    }
    if (record.status && !validStatuses.includes(record.status)) {
      throw new ApiError(400, `Invalid attendance status: ${record.status}`);
    }
    studentIds.push(String(record.student));
  }

  if (new Set(studentIds).size !== studentIds.length) {
    throw new ApiError(400, 'Duplicate student record in attendance session');
  }

  // Validate student existence and tenant membership
  const verifiedStudents = await User.find({
    _id: { $in: studentIds },
    institution: req.user.institution,
    role: 'student'
  }).select('_id');

  if (verifiedStudents.length !== studentIds.length) {
    throw new ApiError(400, 'One or more students do not exist or belong to another institution');
  }

  // Validate students are actively enrolled in the subject's course
  const activeEnrollments = await Enrollment.find({
    institution: req.user.institution,
    course: subjectDoc.course,
    student: { $in: studentIds },
    status: 'active'
  }).distinct('student');

  if (activeEnrollments.length !== studentIds.length) {
    throw new ApiError(400, 'One or more students are not actively enrolled in the course for this subject');
  }

  // Duplicate-session prevention: one session per (institution, subject, calendar day, period).
  if (date) {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      throw new ApiError(400, 'Invalid date');
    }
    const dayStart = new Date(parsed);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    const existing = await AttendanceSession.findOne({
      institution: req.user.institution,
      subject,
      period: Number(period),
      date: { $gte: dayStart, $lt: dayEnd },
    }).select('_id');
    if (existing) {
      throw new ApiError(409, 'Attendance session already exists for this subject, date and period');
    }
  }

  const session = await AttendanceSession.create({
    institution: req.user.institution,
    subject,
    date,
    period,
    markedBy: req.user._id,
    records,
  });

  // Socket privacy: NEVER broadcast full session.records to institution room.
  // Send minimal metadata to institution room for realtime refresh signals.
  publishRealtimeToInstitution(req.user.institution, 'attendance:marked', {
    sessionId: session._id,
    subject: session.subject,
    date: session.date,
    period: session.period
  });

  // Send scoped payload to each individual student for their own record only
  for (const r of records) {
    publishRealtimeToUser(r.student, 'attendance:marked', {
      sessionId: session._id,
      subject: session.subject,
      date: session.date,
      period: session.period,
      status: r.status,
      remark: r.remark
    });
  }

  res.status(201).json({ success: true, data: session });
});

// List attendance sessions (with optional subject / date filters)
export const getSessions = asyncHandler(async (req, res) => {
  // Placement officers have no attendance workflow — per-student aggregates
  // remain available for eligibility checks, but bulk session reads are denied.
  if (req.user.role === 'placement_officer') {
    throw new ApiError(403, 'Placement officers do not have attendance access');
  }
  const filter = { institution: req.user.institution };

  if (req.user.role === 'student') {
    const activeCourses = await Enrollment.find({
      student: req.user._id,
      institution: req.user.institution,
      status: 'active'
    }).distinct('course');
    const enrolledSubjects = await Subject.find({
      course: { $in: activeCourses },
      institution: req.user.institution
    }).distinct('_id');

    filter.subject = { $in: enrolledSubjects };
    filter['records.student'] = req.user._id;
  } else if (req.user.role === 'hod') {
    filter.subject = { $in: await getHodDepartmentSubjectIds(req.user) };
  } else if (req.user.role === 'faculty') {
    const taughtSubjects = await Subject.find({
      faculty: req.user._id,
      institution: req.user.institution
    }).distinct('_id');

    filter.subject = { $in: taughtSubjects };
  }

  if (req.query.subject) {
    if (filter.subject?.$in) {
      const allowed = filter.subject.$in.map(String);
      if (!allowed.includes(String(req.query.subject))) {
        const { page, limit } = pageParams(req);
        return pagedResponse(res, [], 0, { page, limit });
      }
    }
    filter.subject = req.query.subject;
  }
  if (req.query.date !== undefined) {
    const parsed = new Date(req.query.date);
    if (Number.isNaN(parsed.getTime())) {
      throw new ApiError(400, 'Invalid date filter');
    }
    filter.date = parsed;
  }
  if (req.query.period !== undefined) {
    const period = Number(req.query.period);
    if (!Number.isInteger(period) || period < 1) {
      throw new ApiError(400, 'Invalid period filter');
    }
    filter.period = period;
  }

  const { page, limit, skip } = pageParams(req);
  const total = await AttendanceSession.countDocuments(filter);
  const sessions = await AttendanceSession.find(filter)
    .populate('subject', 'name code')
    .populate('markedBy', 'name email role')
    .skip(skip)
    .limit(limit);

  // Students see only their own rows (peer records stay private).
  if (req.user.role === 'student') {
    const mine = sessions.map((s) => {
      const obj = s.toObject();
      obj.records = (obj.records || []).filter(
        (r) => String(r.student?._id || r.student) === String(req.user._id)
      );
      return obj;
    });
    return pagedResponse(res, mine, total, { page, limit });
  }

  return pagedResponse(res, sessions, total, { page, limit });
});

// Get single session by ID (tenant + audience scoped)
export const getSessionById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid attendance session ID');
  }
  if (req.user.role === 'placement_officer') {
    throw new ApiError(403, 'Placement officers do not have attendance access');
  }

  const session = await AttendanceSession.findOne({
    _id: req.params.id,
    institution: req.user.institution
  })
    .populate('subject', 'name code course faculty')
    .populate('markedBy', 'name email role');

  if (!session) {
    throw new ApiError(404, 'Attendance session not found');
  }

  if (req.user.role === 'student') {
    const activeEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: session.subject?.course,
      institution: req.user.institution,
      status: 'active'
    });
    const hasRecord = (session.records || []).some(
      (r) => String(r.student?._id || r.student) === String(req.user._id)
    );
    if (!activeEnrollment || !hasRecord) {
      throw new ApiError(404, 'Attendance session not found');
    }

    const obj = session.toObject();
    obj.records = (obj.records || []).filter(
      (r) => String(r.student?._id || r.student) === String(req.user._id)
    );
    return res.json({ success: true, data: obj });
  }

  if (req.user.role === 'faculty') {
    const subjectDoc = await Subject.findOne({
      _id: session.subject?._id || session.subject,
      institution: req.user.institution
    });
    if (!subjectDoc || String(subjectDoc.faculty) !== String(req.user._id)) {
      throw new ApiError(404, 'Attendance session not found');
    }
  }

  if (req.user.role === 'hod') {
    const subjectDoc = await Subject.findOne({
      _id: session.subject?._id || session.subject,
      institution: req.user.institution
    });
    if (!subjectDoc || !(await canHodAccessSubject(req.user, subjectDoc))) {
      throw new ApiError(404, 'Attendance session not found');
    }
  }

  res.json({ success: true, data: session });
});

// Aggregate attendance for a single student across subjects
export const getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!mongoose.isValidObjectId(studentId)) {
    throw new ApiError(400, 'Invalid student ID');
  }

  // Students may only query themselves; staff stay within the tenant
  // (the aggregate below is institution-matched).
  if (req.user.role === 'student' && String(studentId) !== String(req.user._id)) {
    throw new ApiError(403, 'Access denied');
  }

  const attendance = await AttendanceSession.aggregate([
    {
      $match: {
        institution: new mongoose.Types.ObjectId(req.user.institution),
        'records.student': new mongoose.Types.ObjectId(studentId),
      },
    },
    { $unwind: '$records' },
    {
      $match: {
        'records.student': new mongoose.Types.ObjectId(studentId),
      },
    },
    {
      $group: {
        _id: '$subject',
        totalSessions: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] },
        },
        absent: {
          $sum: { $cond: [{ $eq: ['$records.status', 'absent'] }, 1, 0] },
        },
        late: {
          $sum: { $cond: [{ $eq: ['$records.status', 'late'] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id',
        foreignField: '_id',
        as: 'subject',
      },
    },
    { $unwind: '$subject' },
    {
      $project: {
        subject: '$subject.name',
        subjectId: '$_id',
        totalSessions: 1,
        present: 1,
        absent: 1,
        late: 1,
        percentage: {
          $multiply: [{ $divide: ['$present', '$totalSessions'] }, 100],
        },
      },
    },
  ]);

  res.json({ success: true, data: attendance });
});
