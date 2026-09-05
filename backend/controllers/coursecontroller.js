import { CourseModel as Course } from '../models/CourseModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick, scopedOne, tenantFilter } from '../utils/scope.js';

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

// List all courses scoped to institution (paginated)
export const getAllCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = tenantFilter(req);
  const [courses, total] = await Promise.all([
    Course.find(filter).populate('department').skip(skip).limit(limit),
    Course.countDocuments(filter),
  ]);

  pagedResponse(res, courses, total, { page, limit });
});

// Get single course by ID (tenant-scoped)
export const getCourseById = asyncHandler(async (req, res) => {
  const course = await scopedOne(Course, req, req.params.id, 'department');

  res.json({ success: true, data: course });
});

// Update course (tenant-scoped, allowlisted)
export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    pick(req.body, ['name', 'code', 'durationYears', 'totalSemesters', 'department', 'isActive']),
    {
      new: true,
      runValidators: true,
    }
  );

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  res.json({ success: true, data: course });
});

// Delete course (tenant-scoped)
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOneAndDelete({
    _id: req.params.id,
    institution: req.user.institution,
  });

  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  res.json({ success: true, message: 'Course deleted' });
});
