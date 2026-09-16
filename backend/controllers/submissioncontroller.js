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

// Submit assignment files (student, multipart) — creates or updates the
// student's submission for the assignment. `studentId` in the payload is
// accepted but ignored: identity always comes from the session. `comments`
// maps to textNotes. Status is `late` when past the due date.
export const submitAssignmentFiles = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment || String(assignment.institution) !== String(req.user.institution)) {
    const { discardUploadedFile } = await import('../config/multer.js');
    discardUploadedFile(req);
    throw new ApiError(404, 'Assignment not found');
  }
  const comments = (req.body.comments ?? req.body.textNotes ?? '').toString().slice(0, 5000);
  if (!req.file && !comments.trim()) {
    throw new ApiError(422, 'Attach a file or add comments to submit');
  }
  const late = assignment.dueDate && new Date(assignment.dueDate).getTime() < Date.now();
  const existing = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
  const patch = {
    textNotes: comments || existing?.textNotes,
    submittedAt: new Date(),
    status: late ? 'late' : 'submitted',
    attempt: (existing?.attempt || 0) + 1,
  };
  if (req.file) patch.fileUrl = `/uploads/${req.file.filename}`;
  const submission = existing
    ? await Submission.findByIdAndUpdate(existing._id, patch, { new: true, runValidators: true })
    : await Submission.create({ assignment: assignment._id, student: req.user._id, ...patch });
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
