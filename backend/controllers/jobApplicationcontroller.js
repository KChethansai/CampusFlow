import mongoose from 'mongoose';
import { JobApplicationModel as JobApplication } from '../models/JobApplicationModel.js';
import { JobDriveModel as JobDrive } from '../models/JobDriveModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick } from '../utils/scope.js';
import { cleanUrl } from '../utils/sanitize.js';

// List job applications scoped to role and institution (paginated).
// Applications carry no institution field, so staff visibility is derived
// from the drives in their tenant.
export const getAllJobApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  let query = {};

  if (req.user.role === 'student') {
    query = { student: req.user._id };
  } else {
    // Staff see applications for drives within their institution
    const drives = await JobDrive.find({
      institution: req.user.institution
    }).select('_id');
    query = { drive: { $in: drives.map((d) => d._id) } };
  }

  const [jobApplications, total] = await Promise.all([
    JobApplication.find(query)
      .populate('drive', 'role company ctc applicationDeadline status institution')
      .populate('student', 'name email rollNumber department profile.cgpa profile.batchYear')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    JobApplication.countDocuments(query),
  ]);
  pagedResponse(res, jobApplications, total, { page, limit });
});

// Get single job application (tenant-scoped through the drive)
export const getJobApplicationById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid job application ID');
  }

  const jobApplication = await JobApplication.findById(req.params.id)
    .populate('drive', 'role company ctc applicationDeadline status institution')
    .populate('student', 'name email rollNumber department profile.cgpa profile.batchYear');
  if (!jobApplication || String(jobApplication.drive?.institution) !== String(req.user.institution)) {
    throw new ApiError(404, 'Job application not found');
  }
  if (req.user.role === 'student' && String(jobApplication.student?._id || jobApplication.student) !== String(req.user._id)) {
    throw new ApiError(404, 'Job application not found');
  }
  res.json({ success: true, data: jobApplication });
});

// Create job application (student applies) — unified validation
export const createJobApplication = asyncHandler(async (req, res) => {
  const { drive, resumeUrl } = req.body;
  if (!drive || !mongoose.isValidObjectId(drive)) {
    throw new ApiError(400, 'Invalid drive ID');
  }

  const driveDoc = await JobDrive.findOne({ _id: drive, institution: req.user.institution });
  if (!driveDoc) {
    throw new ApiError(404, 'Job drive not found');
  }

  if (driveDoc.status !== 'active') {
    throw new ApiError(400, 'Job drive is not open for applications');
  }

  if (driveDoc.applicationDeadline && new Date(driveDoc.applicationDeadline).getTime() < Date.now()) {
    throw new ApiError(400, 'Application deadline has passed');
  }

  const existing = await JobApplication.findOne({
    drive: driveDoc._id,
    student: req.user._id
  });
  if (existing) {
    throw new ApiError(409, 'You have already applied to this drive');
  }

  const { checkEligibility } = await import('../services/eligibility.service.js');
  const eligibility = checkEligibility(req.user, driveDoc);
  if (!eligibility.eligible) {
    throw new ApiError(403, `You are not eligible for this drive: ${eligibility.reasons.join(', ')}`);
  }

  const jobApplication = await JobApplication.create({
    drive: driveDoc._id,
    student: req.user._id,
    stage: 'applied',
    resumeUrl: cleanUrl(resumeUrl, 'resumeUrl'),
    eligibilitySnapshot: eligibility,
    history: [
      { stage: 'applied', at: new Date(), remarks: 'Application submitted' }
    ]
  });

  const { UserModel: User } = await import('../models/UserModel.js');
  const { createBulkNotifications } = await import('../services/notification.service.js');
  const team = await User.find({
    institution: driveDoc.institution,
    role: { $in: ['placement_officer', 'college_admin', 'super_admin'] }
  }).select('_id');

  if (team.length > 0) {
    await createBulkNotifications(
      team.map((member) => ({
        recipient: member._id,
        category: 'placement',
        title: 'New job application',
        message: `${req.user.name} applied for ${driveDoc.role}`,
        type: 'info',
        link: '/placement'
      }))
    );
  }

  res.status(201).json({ success: true, data: jobApplication, eligibility });
});

// Update job application (placement officer updates stage — tenant-scoped
// through the drive, allowlisted to stage/outcome fields only)
export const updateJobApplication = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid job application ID');
  }

  const existing = await JobApplication.findById(req.params.id).populate('drive');
  if (!existing || String(existing.drive?.institution) !== String(req.user.institution)) {
    throw new ApiError(404, 'Job application not found');
  }
  const jobApplication = await JobApplication.findByIdAndUpdate(
    req.params.id,
    pick(req.body, ['stage', 'outcome', 'offerPackageLPA', 'history']),
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: jobApplication });
});
