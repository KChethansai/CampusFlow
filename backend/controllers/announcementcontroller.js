import { AnnouncementModel as Announcement } from '../models/AnnouncementModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick } from '../utils/scope.js';
import { publishRealtimeToInstitution } from '../services/notification.service.js';

export const getAnnouncementAudienceFilter = async (user) => {
  const isInstitutionAdmin = ['super_admin', 'college_admin'].includes(user.role);
  if (isInstitutionAdmin) {
    return { institution: user.institution };
  }

  const departmentScope = user.department
    ? { $or: [{ department: { $exists: false } }, { department: null }, { department: user.department }] }
    : { $or: [{ department: { $exists: false } }, { department: null }] };

  let visibleSubjectIds = [];
  if (user.role === 'student') {
    const activeCourseIds = await Enrollment.find({
      student: user._id,
      institution: user.institution,
      status: 'active'
    }).distinct('course');

    if (activeCourseIds.length) {
      visibleSubjectIds = await Subject.find({
        institution: user.institution,
        course: { $in: activeCourseIds }
      }).distinct('_id');
    }
  } else if (user.role === 'faculty') {
    visibleSubjectIds = await Subject.find({
      institution: user.institution,
      faculty: user._id
    }).distinct('_id');
  }

  const subjectOrConditions = [
    { subject: { $exists: false } },
    { subject: null }
  ];
  if (visibleSubjectIds.length) {
    subjectOrConditions.push({ subject: { $in: visibleSubjectIds } });
  }
  if (user._id) {
    subjectOrConditions.push({ createdBy: user._id });
  }

  return {
    institution: user.institution,
    $and: [
      departmentScope,
      { $or: subjectOrConditions }
    ]
  };
};

// Create announcement
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { department, subject, title, body, pinned } = req.body;
  const isInstitutionAdmin = ['super_admin', 'college_admin'].includes(req.user.role);

  const assignedDepartment = isInstitutionAdmin
    ? department
    : (req.user.department || department);

  if (!isInstitutionAdmin && subject) {
    const teaches = await Subject.findOne({
      _id: subject,
      institution: req.user.institution,
      faculty: req.user._id
    });
    if (!teaches) throw new ApiError(403, 'You can only post announcements for subjects you teach');
  }

  const announcement = await Announcement.create({
    institution: req.user.institution,
    department: assignedDepartment,
    subject,
    title,
    body,
    pinned: isInstitutionAdmin ? Boolean(pinned) : false,
    createdBy: req.user._id,
  });

  publishRealtimeToInstitution(req.user.institution, 'announcement:posted', { announcement }); // live feed
  res.status(201).json({ success: true, data: announcement });
});

// List all announcements scoped to institution and audience (paginated)
export const getAllAnnouncements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = await getAnnouncementAudienceFilter(req.user);
  const [announcements, total] = await Promise.all([
    Announcement.find(filter).populate('createdBy').skip(skip).limit(limit),
    Announcement.countDocuments(filter),
  ]);

  pagedResponse(res, announcements, total, { page, limit });
});

// Get single announcement by ID (tenant + audience scoped)
export const getAnnouncementById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...(await getAnnouncementAudienceFilter(req.user)) };
  const announcement = await Announcement.findOne(filter).populate('createdBy');

  if (!announcement) {
    throw new ApiError(404, 'Announcement not found');
  }

  res.json({ success: true, data: announcement });
});

// Update announcement (tenant-scoped, allowlisted, author/admin only)
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const isInstitutionAdmin = ['super_admin', 'college_admin'].includes(req.user.role);
  const filter = { _id: req.params.id, institution: req.user.institution };
  if (!isInstitutionAdmin) {
    filter.createdBy = req.user._id;
  }
  const announcement = await Announcement.findOneAndUpdate(
    filter,
    pick(req.body, ['department', 'subject', 'title', 'body', 'pinned']),
    {
      new: true,
      runValidators: true,
    }
  );

  if (!announcement) {
    throw new ApiError(404, 'Announcement not found');
  }

  res.json({ success: true, data: announcement });
});

// Delete announcement (tenant-scoped, author/admin only)
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const isInstitutionAdmin = ['super_admin', 'college_admin'].includes(req.user.role);
  const filter = { _id: req.params.id, institution: req.user.institution };
  if (!isInstitutionAdmin) {
    filter.createdBy = req.user._id;
  }
  const announcement = await Announcement.findOneAndDelete(filter);

  if (!announcement) {
    throw new ApiError(404, 'Announcement not found');
  }

  res.json({ success: true, message: 'Announcement deleted' });
});
