import { CourseModel as Course } from '../models/CourseModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Create course
export const createCourse = asyncHandler(async (req, res) => {
  const { name, code, durationYears, totalSemesters, department } = req.body;

  const course = await Course.create({
    name,
    code,
    durationYears,
    totalSemesters,
    department,
    institution: req.user.institution,
  });

  res.status(201).json({ success: true, data: course });
});

// List all courses scoped to institution
export const getAllCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ institution: req.user.institution })
    .populate('department');

  res.json({ success: true, data: courses });
});

// Get single course by ID
export const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('department');

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  res.json({ success: true, data: course });
});

// Update course
export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  res.json({ success: true, data: course });
});

// Delete course
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  res.json({ success: true, message: 'Course deleted' });
});
