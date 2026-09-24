import mongoose from 'mongoose';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { CourseModel as Course } from '../models/CourseModel.js';
import { UserModel as User } from '../models/UserModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick, scopedOne, tenantFilter } from '../utils/scope.js';
import { getHodDepartmentSubjectIds, canHodAccessSubject } from '../utils/academicScope.js';
import { cleanUrl } from '../utils/sanitize.js';

// Create subject
export const createSubject = asyncHandler(async (req, res) => {
  const { course, code, name, semester, credits, faculty, syllabusFileUrl } = req.body;

  if (!course || !mongoose.isValidObjectId(course)) {
    throw new ApiError(400, 'Invalid course ID');
  }
  const courseDoc = await Course.findOne({ _id: course, institution: req.user.institution });
  if (!courseDoc) {
    throw new ApiError(404, 'Course not found in institution');
  }

  // HOD may create subjects only for courses in their own department.
  if (req.user.role === 'hod') {
    if (!req.user.department || String(courseDoc.department) !== String(req.user.department)) {
      throw new ApiError(403, 'You can only manage subjects in your own department');
    }
  }

  if (faculty) {
    if (!mongoose.isValidObjectId(faculty)) throw new ApiError(400, 'Invalid faculty ID');
    const facultyUser = await User.findOne({
      _id: faculty,
      institution: req.user.institution,
      role: { $in: ['hod', 'faculty', 'college_admin', 'super_admin'] }
    });
    if (!facultyUser) throw new ApiError(404, 'Faculty user not found or unauthorized');
  }

  const subject = await Subject.create({
    course,
    code,
    name,
    semester,
    credits,
    faculty,
    syllabusFileUrl: cleanUrl(syllabusFileUrl, 'syllabusFileUrl'),
    institution: req.user.institution,
  });

  res.status(201).json({ success: true, data: subject });
});

// List all subjects scoped to institution (paginated)
export const getAllSubjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = tenantFilter(req);
  // HOD sees only subjects in their own department (via course).
  if (req.user.role === 'hod') {
    filter._id = { $in: await getHodDepartmentSubjectIds(req.user) };
  }
  const [subjects, total] = await Promise.all([
    Subject.find(filter)
      .populate('course', 'name code')
      .populate('faculty', 'name email role')
      .skip(skip)
      .limit(limit),
    Subject.countDocuments(filter),
  ]);

  pagedResponse(res, subjects, total, { page, limit });
});

// Get single subject by ID (tenant-scoped)
export const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await scopedOne(Subject, req, req.params.id, [
    { path: 'course', select: 'name code' },
    { path: 'faculty', select: 'name email role' }
  ]);

  // HOD: cross-department subjects read as not-found (no oracle leak).
  if (req.user.role === 'hod' && !(await canHodAccessSubject(req.user, subject))) {
    throw new ApiError(404, 'Subject not found');
  }

  res.json({ success: true, data: subject });
});

// Update subject (tenant-scoped, allowlisted)
export const updateSubject = asyncHandler(async (req, res) => {
  // HOD: the existing subject must sit in their own department.
  let hodSubject = null;
  if (req.user.role === 'hod') {
    hodSubject = await Subject.findOne({ _id: req.params.id, institution: req.user.institution });
    if (!hodSubject || !(await canHodAccessSubject(req.user, hodSubject))) {
      throw new ApiError(404, 'Subject not found');
    }
  }

  if (req.body.course) {
    if (!mongoose.isValidObjectId(req.body.course)) throw new ApiError(400, 'Invalid course ID');
    const courseDoc = await Course.findOne({ _id: req.body.course, institution: req.user.institution });
    if (!courseDoc) throw new ApiError(404, 'Course not found in institution');
    if (req.user.role === 'hod' && String(courseDoc.department) !== String(req.user.department)) {
      throw new ApiError(403, 'You can only manage subjects in your own department');
    }
  }

  if (req.body.faculty) {
    if (!mongoose.isValidObjectId(req.body.faculty)) throw new ApiError(400, 'Invalid faculty ID');
    const facultyUser = await User.findOne({
      _id: req.body.faculty,
      institution: req.user.institution,
      role: { $in: ['hod', 'faculty', 'college_admin', 'super_admin'] }
    });
    if (!facultyUser) throw new ApiError(404, 'Faculty user not found or unauthorized');
  }

  const updates = pick(req.body, [
    'course',
    'code',
    'name',
    'semester',
    'credits',
    'faculty',
    'syllabusFileUrl',
    'isActive',
  ]);
  if (updates.syllabusFileUrl !== undefined) {
    const url = cleanUrl(updates.syllabusFileUrl, 'syllabusFileUrl');
    if (url === undefined) delete updates.syllabusFileUrl;
    else updates.syllabusFileUrl = url;
  }
  const subject = await Subject.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    updates,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }

  res.json({ success: true, data: subject });
});

// Delete subject (tenant-scoped)
export const deleteSubject = asyncHandler(async (req, res) => {
  if (req.user.role === 'hod') {
    const existing = await Subject.findOne({
      _id: req.params.id,
      institution: req.user.institution,
    });
    if (!existing || !(await canHodAccessSubject(req.user, existing))) {
      throw new ApiError(404, 'Subject not found');
    }
  }
  const subject = await Subject.findOneAndDelete({
    _id: req.params.id,
    institution: req.user.institution,
  });

  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }

  res.json({ success: true, message: 'Subject deleted' });
});
