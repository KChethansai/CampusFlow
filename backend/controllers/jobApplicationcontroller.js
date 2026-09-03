import { JobApplicationModel as JobApplication } from '../models/JobApplicationModel.js';
import { JobDriveModel as JobDrive } from '../models/JobDriveModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// List job applications scoped to role and institution
export const getAllJobApplications = asyncHandler(async (req, res) => {
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

  const jobApplications = await JobApplication.find(query)
    .populate('drive')
    .populate('student')
    .sort('-createdAt');
  res.json({ success: true, data: jobApplications });
});

// Get single job application
export const getJobApplicationById = asyncHandler(async (req, res) => {
  const jobApplication = await JobApplication.findById(req.params.id)
    .populate('drive')
    .populate('student');
  if (!jobApplication) throw new ApiError(404, 'Job application not found');
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
    resumeUrl,
    history: [
      { stage: 'applied', at: new Date(), remarks: 'Application submitted' }
    ]
  });
  res.status(201).json({ success: true, data: jobApplication });
});

// Update job application (placement officer updates stage)
export const updateJobApplication = asyncHandler(async (req, res) => {
  const jobApplication = await JobApplication.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!jobApplication) throw new ApiError(404, 'Job application not found');
  res.json({ success: true, data: jobApplication });
});
