import mongoose from 'mongoose';
import { AnnouncementModel as Announcement } from '../models/AnnouncementModel.js';
import { EnrollmentModel as Enrollment } from '../models/EnrollmentModel.js';
import { SubjectModel as Subject } from '../models/SubjectModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { UserModel as User } from '../models/UserModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick } from '../utils/scope.js';
import { publishRealtimeToInstitution, publishRealtimeToUser } from '../services/notification.service.js';

export const dispatchAnnouncementRealtime = async (announcement, institutionId, eventName = 'announcement:posted') => {
  const isRestricted = Boolean(announcement.department || announcement.subject);
  if (!isRestricted) {
    // Public institution-wide announcement
    publishRealtimeToInstitution(institutionId, eventName, { announcement });
    return;
  }

  // Restricted announcement: deliver only to authorized recipients
  const recipientIds = new Set();

  // 1. Institution admins
  const admins = await User.find({
    institution: institutionId,
    role: { $in: ['super_admin', 'college_admin'] }
  }).distinct('_id');
  admins.forEach((id) => recipientIds.add(String(id)));

  // 2. The author
  if (announcement.createdBy) recipientIds.add(String(announcement.createdBy));

  // 3. If subject-specific:
  if (announcement.subject) {
    const subjectDoc = await Subject.findOne({ _id: announcement.subject, institution: institutionId });
    if (subjectDoc) {
      if (subjectDoc.faculty) recipientIds.add(String(subjectDoc.faculty));
      const enrolledStudentIds = await Enrollment.find({
        institution: institutionId,
        course: subjectDoc.course,
        status: 'active'
      }).distinct('student');

      if (announcement.department) {
        // Must also belong to target department
        const deptStudents = await User.find({
          _id: { $in: enrolledStudentIds },
          department: announcement.department
        }).distinct('_id');
        deptStudents.forEach((id) => recipientIds.add(String(id)));
      } else {
        enrolledStudentIds.forEach((id) => recipientIds.add(String(id)));
      }
    }
  } else if (announcement.department) {
    // 4. Department-only restriction: all active users in that department
    const deptUsers = await User.find({
      institution: institutionId,
      department: announcement.department,
      isActive: true
    }).distinct('_id');
    deptUsers.forEach((id) => recipientIds.add(String(id)));
  }

  // Deliver to authorized recipient sockets
  for (const uid of recipientIds) {
    publishRealtimeToUser(uid, eventName, { announcement });
  }
};

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
  } else if (user.role === 'hod' && user.department) {
    const { CourseModel: Course } = await import('../models/CourseModel.js');
    const courseIds = await Course.find({
      institution: user.institution,
      department: user.department
    }).distinct('_id');
    visibleSubjectIds = await Subject.find({
      institution: user.institution,
      course: { $in: courseIds }
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

  let assignedDepartment;
  if (isInstitutionAdmin) {
    assignedDepartment = department;
  } else {
    if (department && String(department) !== String(req.user.department)) {
      throw new ApiError(403, 'You can only post announcements for your own department');
    }
    assignedDepartment = req.user.department || department;
  }

  if (assignedDepartment) {
    if (!mongoose.isValidObjectId(assignedDepartment)) throw new ApiError(400, 'Invalid department ID');
    const deptDoc = await Department.findOne({ _id: assignedDepartment, institution: req.user.institution });
    if (!deptDoc) throw new ApiError(404, 'Department not found');
  }

  if (subject) {
    if (!mongoose.isValidObjectId(subject)) throw new ApiError(400, 'Invalid subject ID');
    const subjectDoc = await Subject.findOne({ _id: subject, institution: req.user.institution });
    if (!subjectDoc) throw new ApiError(404, 'Subject not found');
    if (!isInstitutionAdmin && String(subjectDoc.faculty) !== String(req.user._id)) {
      // HOD department-aware variant: may post for any subject in their own
      // department (via course), not just subjects they personally teach.
      if (req.user.role !== 'hod') throw new ApiError(403, 'You can only post announcements for subjects you teach');
      const { getSubjectDepartmentId } = await import('../utils/academicScope.js');
      const deptId = await getSubjectDepartmentId(subjectDoc);
      if (!req.user.department || !deptId || String(deptId) !== String(req.user.department)) {
        throw new ApiError(403, 'You can only post announcements for subjects in your own department');
      }
    }
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

  await dispatchAnnouncementRealtime(announcement, req.user.institution);
  res.status(201).json({ success: true, data: announcement });
});

// List all announcements scoped to institution and audience (paginated)
export const getAllAnnouncements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = await getAnnouncementAudienceFilter(req.user);
  const [announcements, total] = await Promise.all([
    Announcement.find(filter).populate('createdBy', 'name email role').skip(skip).limit(limit),
    Announcement.countDocuments(filter),
  ]);

  pagedResponse(res, announcements, total, { page, limit });
});

// Get single announcement by ID (tenant + audience scoped)
export const getAnnouncementById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...(await getAnnouncementAudienceFilter(req.user)) };
  const announcement = await Announcement.findOne(filter).populate('createdBy', 'name email role');

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

  if (req.body.department) {
    if (!mongoose.isValidObjectId(req.body.department)) throw new ApiError(400, 'Invalid department ID');
    if (!isInstitutionAdmin && String(req.body.department) !== String(req.user.department)) {
      throw new ApiError(403, 'You cannot move announcement to another department');
    }
    const deptDoc = await Department.findOne({ _id: req.body.department, institution: req.user.institution });
    if (!deptDoc) throw new ApiError(404, 'Department not found');
  }

  if (req.body.subject) {
    if (!mongoose.isValidObjectId(req.body.subject)) throw new ApiError(400, 'Invalid subject ID');
    const subjectDoc = await Subject.findOne({ _id: req.body.subject, institution: req.user.institution });
    if (!subjectDoc) throw new ApiError(404, 'Subject not found');
    if (!isInstitutionAdmin && String(subjectDoc.faculty) !== String(req.user._id)) {
      if (req.user.role !== 'hod') throw new ApiError(403, 'You can only update announcements for subjects you teach');
      const { getSubjectDepartmentId } = await import('../utils/academicScope.js');
      const deptId = await getSubjectDepartmentId(subjectDoc);
      if (!req.user.department || !deptId || String(deptId) !== String(req.user.department)) {
        throw new ApiError(403, 'You can only update announcements for subjects in your own department');
      }
    }
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

  await dispatchAnnouncementRealtime(announcement, req.user.institution, 'announcement:updated');
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
