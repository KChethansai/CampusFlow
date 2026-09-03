import Submission from '../models/Submission.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// List all submissions
export const getAllSubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find()
    .populate('assignment')
    .populate('student');
  res.json({ success: true, data: submissions });
});

// Get single submission
export const getSubmissionById = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate('assignment')
    .populate('student');
  if (!submission) throw new ApiError(404, 'Submission not found');
  res.json({ success: true, data: submission });
});

// Create submission (student submits)
export const createSubmission = asyncHandler(async (req, res) => {
  const { assignment, fileUrl, textNotes } = req.body;
  const submission = await Submission.create({
    assignment,
    student: req.user._id,
    fileUrl,
    textNotes,
    submittedAt: new Date(),
    status: 'submitted',
  });
  res.status(201).json({ success: true, data: submission });
});

// Update submission (faculty grades)
export const updateSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!submission) throw new ApiError(404, 'Submission not found');
  res.json({ success: true, data: submission });
});
