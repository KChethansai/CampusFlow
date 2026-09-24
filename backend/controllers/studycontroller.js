// study controller: rule-based study assistance computed from real data.
// NOT an LLM: weak subjects from submission scores + attendance, revision
// plan from deadlines + weaknesses, resources matched by subject. Every number
// traces to a record the caller is authorized to see.
import mongoose from 'mongoose';
import { SubmissionModel as Submission } from '../models/SubmissionModel.js';
import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { AttendanceSessionModel as AttendanceSession } from '../models/AttendanceSessionModel.js';
import { LearningResourceModel as LearningResource } from '../models/LearningResourceModel.js';
import { UserModel as User } from '../models/UserModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse } from '../utils/scope.js';

const WEAK_SCORE_PCT = 60;
const WEAK_ATTENDANCE_PCT = 75;

const resolveStudent = async (req) => {
  if (req.user.role === 'student' || !req.query.studentId) {
    return req.user._id;
  }
  const student = await User.findOne({ _id: req.query.studentId, institution: req.user.institution, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found');
  return student._id;
};

// GET /study/plan[?studentId=] — weak subjects, revision plan, resources
export const getStudyPlan = asyncHandler(async (req, res) => {
  const studentId = await resolveStudent(req);
  const institution = req.user.institution;

  // --- scores per subject from graded submissions ---
  const graded = await Submission.find({ student: studentId, status: 'graded', score: { $ne: null } })
    .populate({ path: 'assignment', select: 'title subject maxScore dueDate' });
  const bySubject = {};
  graded.forEach((s) => {
    const a = s.assignment;
    if (!a?.subject || !a.maxScore) return;
    const key = String(a.subject);
    (bySubject[key] = bySubject[key] || { scores: [], max: a.maxScore, title: a.title }).scores.push(s.score);
  });

  // --- attendance per subject (same aggregate the attendance API uses) ---
  const attendance = await AttendanceSession.aggregate([
    { $match: { institution: new mongoose.Types.ObjectId(institution), 'records.student': new mongoose.Types.ObjectId(studentId) } },
    { $unwind: '$records' },
    { $match: { 'records.student': new mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: '$subject',
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$records.status', ['present', 'late', 'od']] }, 1, 0] } }
      }
    },
    { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
    { $unwind: '$subject' },
    { $project: { subjectId: '$_id', name: '$subject.name', pct: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } }
  ]);
  const attendanceBySubject = Object.fromEntries(attendance.map((a) => [String(a.subjectId), a]));

  // --- weak subjects: low scores OR low attendance, with reasons ---
  const weakSubjects = [];
  const seen = new Set();
  Object.entries(bySubject).forEach(([subjectId, info]) => {
    const avg = info.scores.reduce((a, b) => a + b, 0) / info.scores.length;
    const pct = Math.round((avg / info.max) * 100);
    const att = attendanceBySubject[subjectId];
    const reasons = [];
    if (pct < WEAK_SCORE_PCT) reasons.push(`average score ${pct}% across ${info.scores.length} graded submission${info.scores.length > 1 ? 's' : ''}`);
    if (att && att.pct < WEAK_ATTENDANCE_PCT) reasons.push(`attendance ${Math.round(att.pct)}% in ${att.name}`);
    if (reasons.length) {
      seen.add(subjectId);
      weakSubjects.push({ subjectId, name: att?.name || 'Subject', avgScorePct: pct, attendancePct: att ? Math.round(att.pct) : null, reasons });
    }
  });
  attendance.forEach((a) => {
    const id = String(a.subjectId);
    if (!seen.has(id) && a.pct < WEAK_ATTENDANCE_PCT) {
      weakSubjects.push({ subjectId: id, name: a.name, avgScorePct: null, attendancePct: Math.round(a.pct), reasons: [`attendance ${Math.round(a.pct)}% in ${a.name}`] });
    }
  });
  weakSubjects.sort((a, b) => (a.avgScorePct ?? 100) - (b.avgScorePct ?? 100));

  // --- revision plan: overdue + upcoming assignments, then weak-subject blocks ---
  const now = new Date();
  const { EnrollmentModel: Enrollment } = await import('../models/EnrollmentModel.js');
  const { SubjectModel: Subject } = await import('../models/SubjectModel.js');
  const enrollments = await Enrollment.find({ student: studentId, institution, status: 'active' }).select('course');
  const courseIds = enrollments.map((e) => e.course);
  const enrolledSubjects = (await Subject.find({ institution, course: { $in: courseIds } }).select('_id')).map((s) => s._id);

  const assignments = await Assignment.find({ institution, subject: { $in: enrolledSubjects } })
    .select('title subject dueDate status maxScore')
    .sort({ dueDate: 1 });
  const submittedIds = new Set(
    (await Submission.find({ student: studentId }).select('assignment')).map((s) => String(s.assignment))
  );
  const revisionPlan = [];
  assignments
    .filter((a) => !submittedIds.has(String(a._id)) && ['published', 'open'].includes(a.status))
    .slice(0, 10)
    .forEach((a) => {
      const overdue = a.dueDate && new Date(a.dueDate) < now;
      revisionPlan.push({
        title: a.title,
        detail: overdue ? `Overdue since ${new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — submit first` : `Due ${a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'soon'}`,
        dueDate: a.dueDate,
        priority: overdue ? 'high' : 'medium',
        kind: 'assignment'
      });
    });
  weakSubjects.slice(0, 5).forEach((w) => {
    revisionPlan.push({
      title: `Review ${w.name}`,
      detail: w.reasons.join('; '),
      priority: 'medium',
      kind: 'review',
      subjectId: w.subjectId
    });
  });

  // --- resources matched to weak subjects, then to upcoming work ---
  const focusIds = [...new Set([
    ...weakSubjects.map((w) => w.subjectId),
    ...assignments.filter((a) => a.subject).map((a) => String(a.subject))
  ])].slice(0, 10);
  const resources = focusIds.length
    ? await LearningResource.find({ institution, subject: { $in: focusIds } }).populate('subject', 'name').limit(20)
    : [];

  res.json({
    success: true,
    data: {
      generatedFrom: {
        gradedSubmissions: graded.length,
        attendanceSessions: attendance.reduce((n, a) => n + 1, 0),
        method: 'rule-based (scores + attendance + deadlines), not an LLM'
      },
      weakSubjects,
      revisionPlan,
      resources
    }
  });
});

// GET /learning-resources[?subject=] — role & tenant-scoped resource library
export const getLearningResources = asyncHandler(async (req, res) => {
  const filter = { institution: req.user.institution };
  const { page, limit, skip } = pageParams(req);

  if (req.user.role === 'student') {
    const { EnrollmentModel: Enrollment } = await import('../models/EnrollmentModel.js');
    const { SubjectModel: Subject } = await import('../models/SubjectModel.js');
    const enrollments = await Enrollment.find({ student: req.user._id, institution: req.user.institution, status: 'active' }).select('course');
    const courseIds = enrollments.map((e) => e.course);
    const subjects = await Subject.find({ institution: req.user.institution, course: { $in: courseIds } }).select('_id');
    const allowedSubjectIds = subjects.map((s) => s._id);

    if (req.query.subject) {
      const isAllowed = allowedSubjectIds.some((id) => id.toString() === req.query.subject.toString());
      if (!isAllowed) {
        return pagedResponse(res, [], 0, { page, limit });
      }
      filter.subject = req.query.subject;
    } else {
      filter.subject = { $in: allowedSubjectIds };
    }
  } else if (req.user.role === 'faculty') {
    const { SubjectModel: Subject } = await import('../models/SubjectModel.js');
    const subjects = await Subject.find({ institution: req.user.institution, faculty: req.user._id }).select('_id');
    const allowedSubjectIds = subjects.map((s) => s._id);

    if (req.query.subject) {
      const isAllowed = allowedSubjectIds.some((id) => id.toString() === req.query.subject.toString());
      if (!isAllowed) {
        return pagedResponse(res, [], 0, { page, limit });
      }
      filter.subject = req.query.subject;
    } else {
      filter.subject = { $in: allowedSubjectIds };
    }
  } else if (req.query.subject) {
    filter.subject = req.query.subject;
  }

  const [total, resources] = await Promise.all([
    LearningResource.countDocuments(filter),
    LearningResource.find(filter).populate('subject', 'name').sort('-createdAt').skip(skip).limit(limit)
  ]);
  pagedResponse(res, resources, total, { page, limit });
});

// POST /learning-resources — faculty/admin curated library writes.
// Accepts JSON (external `url`) or multipart (`file` attachment for
// PDFs/docs, plus fields). At least one of url/file is required.
export const createLearningResource = asyncHandler(async (req, res) => {
  const { subject, topic, title, url, type, difficulty } = req.body;
  if (!subject) throw new ApiError(422, 'subject is required');
  const { SubjectModel: Subject } = await import('../models/SubjectModel.js');
  const subj = await Subject.findOne({ _id: subject, institution: req.user.institution });
  if (!subj) {
    const { discardUploadedFile } = await import('../config/multer.js');
    discardUploadedFile(req);
    throw new ApiError(404, 'Subject not found');
  }
  if (req.user.role === 'faculty' && subj.faculty?.toString() !== req.user._id.toString()) {
    const { discardUploadedFile } = await import('../config/multer.js');
    discardUploadedFile(req);
    throw new ApiError(403, 'Forbidden: You can only create learning resources for your assigned subjects');
  }
  const { cleanUrl } = await import('../utils/sanitize.js');
  if (!url && !req.file) throw new ApiError(422, 'Provide an external url or attach a file');
  const doc = await LearningResource.create({
    institution: req.user.institution,
    subject: subj._id,
    topic,
    title,
    url: cleanUrl(url),
    // server-resolved URL (Cloudinary or local; never client-supplied, so cleanUrl exempt)
    fileUrl: req.file ? await (await import('../config/multer.js')).resolveFileUrl(req) : undefined,
    fileName: req.file?.originalname,
    fileSize: req.file?.size,
    type: type || (req.file ? 'document' : undefined),
    difficulty,
  });
  res.status(201).json({ success: true, data: doc });
});

// PATCH /learning-resources/:id — tenant-scoped, allowlisted (+ file swap)
export const updateLearningResource = asyncHandler(async (req, res) => {
  const existing = await LearningResource.findOne({ _id: req.params.id, institution: req.user.institution });
  if (!existing) throw new ApiError(404, 'LearningResource not found');
  if (req.user.role === 'faculty') {
    const { SubjectModel: Subject } = await import('../models/SubjectModel.js');
    const subj = await Subject.findOne({ _id: existing.subject, institution: req.user.institution });
    if (!subj || subj.faculty?.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Forbidden: You can only update learning resources for your assigned subjects');
    }
  }

  const { pick } = await import('../utils/scope.js');
  const { cleanUrl } = await import('../utils/sanitize.js');
  const patch = pick(req.body, ['topic', 'title', 'url', 'type', 'difficulty']);
  if (patch.url !== undefined) patch.url = cleanUrl(patch.url);
  if (req.file) {
    patch.fileUrl = `/uploads/${req.file.filename}`;
    patch.fileName = req.file.originalname;
    patch.fileSize = req.file.size;
    if (!patch.type) patch.type = 'document';
  }
  const doc = await LearningResource.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    patch,
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: doc });
});

// DELETE /learning-resources/:id — tenant-scoped
export const deleteLearningResource = asyncHandler(async (req, res) => {
  const existing = await LearningResource.findOne({ _id: req.params.id, institution: req.user.institution });
  if (!existing) throw new ApiError(404, 'LearningResource not found');
  if (req.user.role === 'faculty') {
    const { SubjectModel: Subject } = await import('../models/SubjectModel.js');
    const subj = await Subject.findOne({ _id: existing.subject, institution: req.user.institution });
    if (!subj || subj.faculty?.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Forbidden: You can only delete learning resources for your assigned subjects');
    }
  }

  await LearningResource.findOneAndDelete({
    _id: req.params.id,
    institution: req.user.institution,
  });
  res.json({ success: true, message: 'Learning resource deleted' });
});
