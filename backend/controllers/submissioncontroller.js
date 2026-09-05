import { SubmissionModel as Submission } from '../models/SubmissionModel.js';
import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { cleanUrl } from '../utils/sanitize.js';
import { pick } from '../utils/scope.js';

// Assignments visible to the caller: students see their own submissions only;
// faculty see submissions for assignments they created; admins see the tenant.
const visibleAssignmentIds = async (req) => {
  if (req.user.role === 'student') return null; // filtered by student instead
  if (req.user.role === 'faculty') {
    const mine = await Assignment.find({ createdBy: req.user._id }).select('_id');
    return mine.map((a) => a._id);
  }
  const scoped = await Assignment.find({ institution: req.user.institution }).select('_id');
  return scoped.map((a) => a._id);
};

// List submissions — tenant/ownership scoped (never the whole collection)
export const getAllSubmissions = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'student') {
    filter.student = req.user._id;
  } else {
    filter.assignment = { $in: await visibleAssignmentIds(req) };
  }
  const submissions = await Submission.find(filter)
    .populate('assignment')
    .populate('student');
  res.json({ success: true, data: submissions });
});

// Get single submission — same visibility rules as the list
export const getSubmissionById = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate('assignment')
    .populate('student');
  if (!submission) throw new ApiError(404, 'Submission not found');
  if (req.user.role === 'student') {
    if (String(submission.student?._id || submission.student) !== String(req.user._id)) {
      throw new ApiError(404, 'Submission not found');
    }
  } else {
    const allowed = await visibleAssignmentIds(req);
    if (!allowed.some((id) => String(id) === String(submission.assignment?._id || submission.assignment))) {
      throw new ApiError(404, 'Submission not found');
    }
  }
  res.json({ success: true, data: submission });
});

// Create submission (student submits) — student forced from session
export const createSubmission = asyncHandler(async (req, res) => {
  const { assignment, fileUrl, textNotes } = req.body;
  const submission = await Submission.create({
    assignment,
    student: req.user._id,
    fileUrl: cleanUrl(fileUrl, 'fileUrl'),
    textNotes,
    submittedAt: new Date(),
    status: 'submitted',
  });
  res.status(201).json({ success: true, data: submission });
});

// Update submission (faculty grades) — allowlisted, visibility-checked
export const updateSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate('assignment');
  if (!submission) throw new ApiError(404, 'Submission not found');
  const allowed = await visibleAssignmentIds(req);
  if (!allowed.some((id) => String(id) === String(submission.assignment?._id || submission.assignment))) {
    throw new ApiError(404, 'Submission not found');
  }
  Object.assign(submission, pick(req.body, ['score', 'feedback', 'status']));
  await submission.save();
  res.json({ success: true, data: submission });
});
