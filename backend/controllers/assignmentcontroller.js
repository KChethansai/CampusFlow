import mongoose from 'mongoose';
import { AssignmentModel as Assignment } from '../models/AssignmentModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pick, scopedOne, pageParams, pagedResponse } from '../utils/scope.js';
import { getFacultyTaughtSubjectIds, canFacultyAccessAssignment, getHodDepartmentSubjectIds, canHodAccessAssignment, canHodAccessSubject } from '../utils/academicScope.js';

// List all assignments scoped to institution and audience (paginated)
export const getAllAssignments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
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
    filter.status = { $ne: 'draft' };
  } else if (req.user.role === 'hod') {
    filter.subject = { $in: await getHodDepartmentSubjectIds(req.user) };
  } else if (req.user.role === 'faculty') {
    const taughtSubjects = await getFacultyTaughtSubjectIds(req.user);

    filter.$or = [
      { createdBy: req.user._id },
      { subject: { $in: taughtSubjects } }
    ];
  }

  const [assignments, total] = await Promise.all([
    Assignment.find(filter)
      .populate('subject', 'name code')
      .populate('createdBy', 'name email role')
      .skip(skip)
      .limit(limit),
    Assignment.countDocuments(filter),
  ]);
  pagedResponse(res, assignments, total, { page, limit });
});

// Get single assignment (tenant + audience scoped)
export const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({
    _id: req.params.id,
    institution: req.user.institution
  })
    .populate('subject', 'name code course')
    .populate('createdBy', 'name email role');

  if (!assignment) {
    throw new ApiError(404, 'Assignment not found');
  }

  if (req.user.role === 'student') {
    if (assignment.status === 'draft') {
      throw new ApiError(404, 'Assignment not found');
    }
    const isEnrolled = await Enrollment.findOne({
      student: req.user._id,
      course: assignment.subject?.course,
      institution: req.user.institution,
      status: 'active'
    });
    if (!isEnrolled) {
      throw new ApiError(404, 'Assignment not found');
    }
  } else if (req.user.role === 'faculty') {
    const isAllowed = await canFacultyAccessAssignment(req.user, assignment);
    if (!isAllowed) {
      throw new ApiError(404, 'Assignment not found');
    }
  } else if (req.user.role === 'hod') {
    const isAllowed = await canHodAccessAssignment(req.user, assignment);
    if (!isAllowed) {
      throw new ApiError(404, 'Assignment not found');
    }
  }

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

  if (req.user.role === 'hod' && !(await canHodAccessSubject(req.user, subjectDoc))) {
    throw new ApiError(403, 'You can only manage assignments in your own department');
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
  const assignment = await Assignment.findOne({ _id: req.params.id, institution: req.user.institution });
  if (!assignment) throw new ApiError(404, 'Assignment not found');

  if (req.user.role === 'faculty') {
    const isAllowed = await canFacultyAccessAssignment(req.user, assignment);
    if (!isAllowed) throw new ApiError(404, 'Assignment not found');
  }

  if (req.user.role === 'hod') {
    const isAllowed = await canHodAccessAssignment(req.user, assignment);
    if (!isAllowed) throw new ApiError(404, 'Assignment not found');
  }

  if (req.body.subject) {
    if (!mongoose.isValidObjectId(req.body.subject)) throw new ApiError(400, 'Invalid subject ID');
    const subjectDoc = await Subject.findOne({ _id: req.body.subject, institution: req.user.institution });
    if (!subjectDoc) throw new ApiError(404, 'Subject not found');
    if (req.user.role === 'faculty' && String(subjectDoc.faculty) !== String(req.user._id)) {
      throw new ApiError(403, 'You can only assign subjects you teach');
    }
    if (req.user.role === 'hod' && !(await canHodAccessSubject(req.user, subjectDoc))) {
      throw new ApiError(403, 'You can only manage assignments in your own department');
    }
  }

  const patch = pick(req.body, ['subject', 'title', 'description', 'maxScore', 'dueDate', 'allowResubmission', 'maxResubmissions']);
  Object.assign(assignment, patch);
  await assignment.save();
  res.json({ success: true, data: assignment });
});

// Delete assignment (tenant-scoped, ownership-enforced)
export const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, institution: req.user.institution });
  if (!assignment) throw new ApiError(404, 'Assignment not found');

  if (req.user.role === 'faculty') {
    const isAllowed = await canFacultyAccessAssignment(req.user, assignment);
    if (!isAllowed) throw new ApiError(404, 'Assignment not found');
  }

  if (req.user.role === 'hod') {
    const isAllowed = await canHodAccessAssignment(req.user, assignment);
    if (!isAllowed) throw new ApiError(404, 'Assignment not found');
  }

  await Assignment.deleteOne({ _id: assignment._id });
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
  const assignment = await Assignment.findOne({ _id: req.params.id, institution: req.user.institution });
  if (!assignment) throw new ApiError(404, 'Assignment not found');

  if (req.user.role === 'faculty') {
    const isAllowed = await canFacultyAccessAssignment(req.user, assignment);
    if (!isAllowed) throw new ApiError(404, 'Assignment not found');
  }

  if (req.user.role === 'hod') {
    const isAllowed = await canHodAccessAssignment(req.user, assignment);
    if (!isAllowed) throw new ApiError(404, 'Assignment not found');
  }

  const allowed = TRANSITIONS[assignment.status] || [];
  if (!allowed.includes(req.body.status)) {
    throw new ApiError(400, `Invalid status transition from ${assignment.status} to ${req.body.status}`);
  }

  assignment.status = req.body.status;
  assignment.audit.push({ action: `status:${req.body.status}`, by: req.user._id });
  await assignment.save();

  res.json({ success: true, data: assignment });
});