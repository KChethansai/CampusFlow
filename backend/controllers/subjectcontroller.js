import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Create subject
export const createSubject = asyncHandler(async (req, res) => {
  const { course, code, name, semester, credits, faculty, syllabusFileUrl } = req.body;

  const subject = await Subject.create({
    course,
    code,
    name,
    semester,
    credits,
    faculty,
    syllabusFileUrl,
    institution: req.user.institution,
  });

  res.status(201).json({ success: true, data: subject });
});

// List all subjects scoped to institution
export const getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ institution: req.user.institution })
    .populate('course')
    .populate('faculty');

  res.json({ success: true, data: subjects });
});

// Get single subject by ID
export const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('course')
    .populate('faculty');

  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }

  res.json({ success: true, data: subject });
});

// Update subject
export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }

  res.json({ success: true, data: subject });
});

// Delete subject
export const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);

  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }

  res.json({ success: true, message: 'Subject deleted' });
});
