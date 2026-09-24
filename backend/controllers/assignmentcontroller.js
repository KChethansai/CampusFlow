import mongoose from 'mongoose';
import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
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

  if (!subject || !mongoose.isValidObjectId(subject)) {
    throw new ApiError(400, 'Invalid subject ID');
  }

  const subjectDoc = await Subject.findOne({ _id: subject, institution: req.user.institution });
  if (!subjectDoc) {
    throw new ApiError(404, 'Subject not found');
  }

  if (req.user.role === 'faculty' && String(subjectDoc.faculty) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only create assignments for subjects you teach');
  }

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

// Update assignment — tenant-scoped, ownership-enforced, allowlisted
export const updateAssignment = asyncHandler(async (req, res) => {
  const filter = ['super_admin', 'college_admin'].includes(req.user.role)
    ? { _id: req.params.id, institution: req.user.institution }
    : { _id: req.params.id, institution: req.user.institution, createdBy: req.user._id };

  if (req.body.subject) {
    if (!mongoose.isValidObjectId(req.body.subject)) throw new ApiError(400, 'Invalid subject ID');
    const subjectDoc = await Subject.findOne({ _id: req.body.subject, institution: req.user.institution });
    if (!subjectDoc) throw new ApiError(404, 'Subject not found');
    if (req.user.role === 'faculty' && String(subjectDoc.faculty) !== String(req.user._id)) {
      throw new ApiError(403, 'You can only assign subjects you teach');
    }
  }

  const assignment = await Assignment.findOneAndUpdate(
    filter,
    pick(req.body, ['subject', 'title', 'description', 'maxScore', 'dueDate', 'allowResubmission', 'maxResubmissions']),
    { new: true, runValidators: true },
  );
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  res.json({ success: true, data: assignment });
});

// Delete assignment (tenant-scoped, ownership-enforced)
export const deleteAssignment = asyncHandler(async (req, res) => {
  const filter = ['super_admin', 'college_admin'].includes(req.user.role)
    ? { _id: req.params.id, institution: req.user.institution }
    : { _id: req.params.id, institution: req.user.institution, createdBy: req.user._id };

  const assignment = await Assignment.findOneAndDelete(filter);
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
  const filter = ['super_admin', 'college_admin'].includes(req.user.role)
    ? { _id: req.params.id, institution: req.user.institution }
    : { _id: req.params.id, institution: req.user.institution, createdBy: req.user._id };
  const assignment = await Assignment.findOne(filter);
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