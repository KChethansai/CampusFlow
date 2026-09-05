import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick, scopedOne, tenantFilter } from '../utils/scope.js';
import { cleanUrl } from '../utils/sanitize.js';

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
    syllabusFileUrl: cleanUrl(syllabusFileUrl, 'syllabusFileUrl'),
    institution: req.user.institution,
  });

  res.status(201).json({ success: true, data: subject });
});

// List all subjects scoped to institution (paginated)
export const getAllSubjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = tenantFilter(req);
  const [subjects, total] = await Promise.all([
    Subject.find(filter).populate('course').populate('faculty').skip(skip).limit(limit),
    Subject.countDocuments(filter),
  ]);

  pagedResponse(res, subjects, total, { page, limit });
});

// Get single subject by ID (tenant-scoped)
export const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await scopedOne(Subject, req, req.params.id, ['course', 'faculty']);

  res.json({ success: true, data: subject });
});

// Update subject (tenant-scoped, allowlisted)
export const updateSubject = asyncHandler(async (req, res) => {
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
  const subject = await Subject.findOneAndDelete({
    _id: req.params.id,
    institution: req.user.institution,
  });

  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }

  res.json({ success: true, message: 'Subject deleted' });
});
