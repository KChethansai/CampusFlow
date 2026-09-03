import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Create enrollment
export const createEnrollment = asyncHandler(async (req, res) => {
  const { student, course, academicYear, semester, status } = req.body;

  const enrollment = await Enrollment.create({
    student,
    course,
    academicYear,
    semester,
    status,
    institution: req.user.institution,
  });

  res.status(201).json({ success: true, data: enrollment });
});

// List all enrollments scoped to institution
export const getAllEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ institution: req.user.institution })
    .populate('student')
    .populate('course');

  res.json({ success: true, data: enrollments });
});

// Get single enrollment by ID
export const getEnrollmentById = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id)
    .populate('student')
    .populate('course');

  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  res.json({ success: true, data: enrollment });
});

// Update enrollment
export const updateEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  res.json({ success: true, data: enrollment });
});

// Delete enrollment
export const deleteEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findByIdAndDelete(req.params.id);

  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  res.json({ success: true, message: 'Enrollment deleted' });
});
