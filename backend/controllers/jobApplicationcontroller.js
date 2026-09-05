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
      .populate('drive')
      .populate('student')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    JobApplication.countDocuments(query),
  ]);
  pagedResponse(res, jobApplications, total, { page, limit });
});

// Get single job application (tenant-scoped through the drive)
export const getJobApplicationById = asyncHandler(async (req, res) => {
  const jobApplication = await JobApplication.findById(req.params.id)
    .populate('drive')
    .populate('student');
  if (!jobApplication || String(jobApplication.drive?.institution) !== String(req.user.institution)) {
    throw new ApiError(404, 'Job application not found');
  }
  res.json({ success: true, data: jobApplication });
});

// Create job application (student applies)
export const createJobApplication = asyncHandler(async (req, res) => {
  const { drive, resumeUrl } = req.body;

  const existing = await JobApplication.findOne({
    drive,
    student: req.user._id
  });
  if (existing) {
    throw new ApiError(409, 'You have already applied to this drive');
  }

  const jobApplication = await JobApplication.create({
    drive,
    student: req.user._id,
    stage: 'applied',
    resumeUrl: cleanUrl(resumeUrl, 'resumeUrl'),
    history: [
      { stage: 'applied', at: new Date(), remarks: 'Application submitted' }
    ]
  });
  res.status(201).json({ success: true, data: jobApplication });
});

// Update job application (placement officer updates stage — tenant-scoped
// through the drive, allowlisted to stage/outcome fields only)
export const updateJobApplication = asyncHandler(async (req, res) => {
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
