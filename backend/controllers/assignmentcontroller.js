import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pick, scopedOne } from '../utils/scope.js';

// List all assignments scoped to institution
export const getAllAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ institution: req.user.institution })
    .populate('subject')
    .populate('createdBy');
  res.json({ success: true, data: assignments });
});

// Get single assignment (tenant-scoped)
export const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await scopedOne(Assignment, req, req.params.id, ['subject', 'createdBy']);
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

// Update assignment — tenant-scoped, allowlisted (no institution/createdBy/status override)
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    pick(req.body, ['subject', 'title', 'description', 'maxScore', 'dueDate', 'allowResubmission', 'maxResubmissions']),
    { new: true, runValidators: true },
  );
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  res.json({ success: true, data: assignment });
});

// Delete assignment (tenant-scoped)
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, institution: req.user.institution });
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