import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// List all assignments scoped to institution
export const getAllAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ institution: req.user.institution })
    .populate('subject')
    .populate('createdBy');
  res.json({ success: true, data: assignments });
});

// Get single assignment
export const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('subject')
    .populate('createdBy');
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  res.json({ success: true, data: assignment });
});

// Create assignment
export const createAssignment = asyncHandler(async (req, res) => {
  const { subject, title, description, maxScore, dueDate, allowResubmission, maxResubmissions } = req.body;
  const assignment = await Assignment.create({
    subject,
    title,
    description,
    maxScore,
    dueDate,
    allowResubmission,
    maxResubmissions,
    createdBy: req.user._id,
    institution: req.user.institution,
  });
  res.status(201).json({ success: true, data: assignment });
});

// Update assignment
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  res.json({ success: true, data: assignment });
});

// Delete assignment
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findByIdAndDelete(req.params.id);
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  res.json({ success: true, message: 'Assignment deleted' });
});

const TRANSITIONS = {
  draft: ['published'],
  published: ['open', 'archived'],
  open: ['closed'],
  closed: ['open', 'graded'],
  graded: ['archived']
};

export const updateAssignmentStatus = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!assignment) throw new ApiError(404, 'Assignment not found');

  const allowed = TRANSITIONS[assignment.status] || [];
  if (!allowed.includes(req.body.status)) {
    throw new ApiError(400, `Invalid status transition from ${assignment.status} to ${req.body.status}`);
  }

  assignment.status = req.body.status;
  assignment.audit.push({ action: `status:${req.body.status}`, by: req.user._id });
  await assignment.save();

  res.json({ success: true, data: assignment });
});