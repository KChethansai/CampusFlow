import mongoose from 'mongoose';
import { AttendanceSessionModel as AttendanceSession } from '../models/AttendanceSessionModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { scopedOne } from '../utils/scope.js';

// Mark (create) an attendance session
export const markSession = asyncHandler(async (req, res) => {
  const { subject, date, period, records } = req.body;

  // Subject must belong to the caller's institution.
  const subjectDoc = await Subject.findOne({ _id: subject, institution: req.user.institution });
  if (!subjectDoc) {
    throw new ApiError(404, 'Subject not found');
  }

  const session = await AttendanceSession.create({
    institution: req.user.institution,
    subject,
    date,
    period,
    markedBy: req.user._id,
    records,
  });

  res.status(201).json({ success: true, data: session });
});

// List attendance sessions (with optional subject / date filters)
export const getSessions = asyncHandler(async (req, res) => {
  const filter = { institution: req.user.institution };

  if (req.query.subject) {
    filter.subject = req.query.subject;
  }
  if (req.query.date) {
    filter.date = new Date(req.query.date);
  }

  const sessions = await AttendanceSession.find(filter)
    .populate('subject')
    .populate('markedBy');

  // Students see only their own rows (peer records stay private).
  if (req.user.role === 'student') {
    const mine = sessions.map((s) => {
      const obj = s.toObject();
      obj.records = (obj.records || []).filter(
        (r) => String(r.student) === String(req.user._id)
      );
      return obj;
    });
    return res.json({ success: true, data: mine });
  }

  res.json({ success: true, data: sessions });
});

// Get single session by ID (tenant-scoped)
export const getSessionById = asyncHandler(async (req, res) => {
  const session = await scopedOne(AttendanceSession, req, req.params.id, ['subject', 'markedBy']);

  res.json({ success: true, data: session });
});

// Aggregate attendance for a single student across subjects
export const getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

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
