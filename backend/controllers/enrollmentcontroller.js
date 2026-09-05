import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { UserModel as User } from '../models/UserModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { logActivity } from '../services/activityLog.service.js';

// Create enrollment (admin-managed) — student and course must be in the tenant
export const createEnrollment = asyncHandler(async (req, res) => {
  const { student, course, academicYear, semester, status } = req.body;

  const [studentDoc, courseDoc] = await Promise.all([
    User.findOne({ _id: student, institution: req.user.institution }),
    Course.findOne({ _id: course, institution: req.user.institution })
  ]);
  if (!studentDoc || !courseDoc) {
    throw new ApiError(404, 'Student or course not found');
  }

  const enrollment = await Enrollment.create({
    student,
    course,
    academicYear,
    semester,
    status,
    institution: req.user.institution
  });

  await logActivity({
    req,
    action: 'enrollment.create',
    entityType: 'Enrollment',
    entityId: enrollment._id
  });

  res.status(201).json({ success: true, data: enrollment });
});

// List enrollments scoped to institution (students see only their own)
export const getAllEnrollments = asyncHandler(async (req, res) => {
  const query =
    req.user.role === 'student'
      ? { student: req.user._id }
      : { institution: req.user.institution };

  const enrollments = await Enrollment.find(query)
    .populate('student')
    .populate('course');

  res.json({ success: true, data: enrollments });
});

// Get single enrollment by ID (tenant-scoped; students see only their own)
export const getEnrollmentById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, institution: req.user.institution };
  if (req.user.role === 'student') filter.student = req.user._id;
  const enrollment = await Enrollment.findOne(filter)
    .populate('student')
    .populate('course');

  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  res.json({ success: true, data: enrollment });
});

// Update enrollment (tenant-scoped, allowlisted)
export const updateEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({ _id: req.params.id, institution: req.user.institution });

  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  const { status, academicYear, semester } = req.body;
  if (status !== undefined) enrollment.status = status;
  if (academicYear !== undefined) enrollment.academicYear = academicYear;
  if (semester !== undefined) enrollment.semester = semester;
  await enrollment.save();

  await logActivity({
    req,
    action: 'enrollment.update',
    entityType: 'Enrollment',
    entityId: enrollment._id
  });

  res.json({ success: true, data: enrollment });
});

// Delete enrollment (tenant-scoped)
export const deleteEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOneAndDelete({ _id: req.params.id, institution: req.user.institution });

  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  await logActivity({
    req,
    action: 'enrollment.delete',
    entityType: 'Enrollment',
    entityId: enrollment._id
  });

  res.json({ success: true, message: 'Enrollment deleted' });
});

// Student self-enrollment into a course
export const enrollSelf = asyncHandler(async (req, res) => {
  const { course, semester, academicYear } = req.body;
  if (!course) throw new ApiError(400, 'Course is required');

  const courseDoc = await Course.findOne({ _id: course, institution: req.user.institution });
  if (!courseDoc) throw new ApiError(404, 'Course not found');

  const year = academicYear || String(new Date().getFullYear());
  const sem = semester || 1;

  const existing = await Enrollment.findOne({
    student: req.user._id,
    course,
    academicYear: year
  });

  if (existing) {
    if (existing.status === 'active') {
      throw new ApiError(409, 'You are already enrolled in this course');
    }
    existing.status = 'active';
    existing.semester = sem;
    await existing.save();

    await logActivity({
      req,
      action: 'enrollment.self_enroll',
      entityType: 'Enrollment',
      entityId: existing._id
    });

    return res.json({ success: true, data: existing });
  }

  const enrollment = await Enrollment.create({
    student: req.user._id,
    course,
    academicYear: year,
    semester: sem,
    status: 'active',
    institution: req.user.institution
  });

  await logActivity({
    req,
    action: 'enrollment.self_enroll',
    entityType: 'Enrollment',
    entityId: enrollment._id
  });

  res.status(201).json({ success: true, data: enrollment });
});

// Student drops one of their own enrollments
export const dropSelfEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    _id: req.params.id,
    student: req.user._id
  });

  if (!enrollment) {
    throw new ApiError(404, 'Enrollment not found');
  }

  enrollment.status = 'dropped';
  await enrollment.save();

  await logActivity({
    req,
    action: 'enrollment.self_drop',
    entityType: 'Enrollment',
    entityId: enrollment._id
  });

  res.json({ success: true, data: enrollment });
});
