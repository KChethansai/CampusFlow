import mongoose from 'mongoose';
import { SubmissionModel as Submission } from '../models/SubmissionModel.js';
import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
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
    .populate('assignment', 'title subject maxScore dueDate status')
    .populate('student', 'name email rollNumber department profile.cgpa profile.batchYear');
  res.json({ success: true, data: submissions });
});

// Get single submission — same visibility rules as the list
export const getSubmissionById = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate('assignment', 'title subject maxScore dueDate status')
    .populate('student', 'name email rollNumber department profile.cgpa profile.batchYear');
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

// Helper to validate student assignment submission requirements
const validateAssignmentForSubmission = async (assignmentId, user) => {
  if (!assignmentId || !mongoose.isValidObjectId(assignmentId)) {
    throw new ApiError(400, 'Invalid assignment ID');
  }

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment || String(assignment.institution) !== String(user.institution)) {
    throw new ApiError(404, 'Assignment not found');
  }

  if (assignment.status === 'draft' || assignment.status === 'archived') {
    throw new ApiError(400, 'Assignment is not open for submissions');
  }

  // Validate subject exists in same institution
  const subjectDoc = await Subject.findOne({ _id: assignment.subject, institution: user.institution });
  if (!subjectDoc) {
    throw new ApiError(404, 'Subject not found');
  }

  // Active course enrollment check: student must be actively enrolled in the course
  const enrolled = await Enrollment.findOne({
    institution: user.institution,
    student: user._id,
    course: subjectDoc.course,
    status: 'active'
  });
  if (!enrolled) {
    throw new ApiError(403, 'You are not enrolled in the course for this assignment');
  }

  return assignment;
};

// Create submission (student submits) — student forced from session, full validation
export const createSubmission = asyncHandler(async (req, res) => {
  const { assignment: assignmentId, fileUrl, textNotes } = req.body;
  const assignment = await validateAssignmentForSubmission(assignmentId, req.user);

  const comments = (textNotes || '').toString().slice(0, 5000);
  const cleanedUrl = cleanUrl(fileUrl, 'fileUrl');
  if (!cleanedUrl && !comments.trim()) {
    throw new ApiError(422, 'Attach a file or add comments to submit');
  }

  const existing = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
  if (existing) {
    if (!assignment.allowResubmission) {
      throw new ApiError(400, 'Resubmission is not allowed for this assignment');
    }
    if (assignment.maxResubmissions === 0 || existing.attempt > assignment.maxResubmissions) {
      throw new ApiError(400, 'Maximum resubmission attempts reached');
    }
  }

  const late = assignment.dueDate && new Date(assignment.dueDate).getTime() < Date.now();
  const patch = {
    fileUrl: cleanedUrl || existing?.fileUrl,
    textNotes: comments || existing?.textNotes,
    submittedAt: new Date(),
    status: late ? 'late' : 'submitted',
    attempt: (existing?.attempt || 0) + 1,
  };

  const submission = existing
    ? await Submission.findByIdAndUpdate(existing._id, patch, { new: true, runValidators: true })
    : await Submission.create({ assignment: assignment._id, student: req.user._id, ...patch });

  res.status(201).json({ success: true, data: submission });
});

// Submit assignment files (student, multipart) — creates or updates the
// student's submission for the assignment. `studentId` in the payload is
// accepted but ignored: identity always comes from the session. `comments`
// maps to textNotes. Status is `late` when past the due date.
export const submitAssignmentFiles = asyncHandler(async (req, res) => {
  let assignment;
  try {
    assignment = await validateAssignmentForSubmission(req.params.assignmentId, req.user);
  } catch (err) {
    const { discardUploadedFile } = await import('../config/multer.js');
    discardUploadedFile(req);
    throw err;
  }

  const comments = (req.body.comments ?? req.body.textNotes ?? '').toString().slice(0, 5000);
  if (!req.file && !comments.trim()) {
    throw new ApiError(422, 'Attach a file or add comments to submit');
  }

  const existing = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
  if (existing) {
    if (!assignment.allowResubmission) {
      const { discardUploadedFile } = await import('../config/multer.js');
      discardUploadedFile(req);
      throw new ApiError(400, 'Resubmission is not allowed for this assignment');
    }
    if (assignment.maxResubmissions === 0 || existing.attempt > assignment.maxResubmissions) {
      const { discardUploadedFile } = await import('../config/multer.js');
      discardUploadedFile(req);
      throw new ApiError(400, 'Maximum resubmission attempts reached');
    }
  }

  const late = assignment.dueDate && new Date(assignment.dueDate).getTime() < Date.now();
  const patch = {
    textNotes: comments || existing?.textNotes,
    submittedAt: new Date(),
    status: late ? 'late' : 'submitted',
    attempt: (existing?.attempt || 0) + 1,
  };
  if (req.file) {
    const { resolveFileUrl } = await import('../config/multer.js');
    patch.fileUrl = await resolveFileUrl(req); // Cloudinary URL or local path
  }
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
