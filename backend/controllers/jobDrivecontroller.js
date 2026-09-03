import { JobDriveModel as JobDrive } from '../models/JobDriveModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// List all job drives scoped to institution
export const getAllJobDrives = asyncHandler(async (req, res) => {
  const jobDrives = await JobDrive.find({ institution: req.user.institution })
    .populate('company');
  res.json({ success: true, data: jobDrives });
});

// Get single job drive
export const getJobDriveById = asyncHandler(async (req, res) => {
  const jobDrive = await JobDrive.findById(req.params.id).populate('company');
  if (!jobDrive) throw new ApiError(404, 'Job drive not found');
  res.json({ success: true, data: jobDrive });
});

// Create job drive
export const createJobDrive = asyncHandler(async (req, res) => {
  const { company, role, jobType, packageLPA, location, eligibility, applicationDeadline, status } = req.body;
  const jobDrive = await JobDrive.create({
    company,
    role,
    jobType,
    packageLPA,
    location,
    eligibility,
    applicationDeadline,
    status,
    institution: req.user.institution,
  });
  res.status(201).json({ success: true, data: jobDrive });
});

// Update job drive
export const updateJobDrive = asyncHandler(async (req, res) => {
  const jobDrive = await JobDrive.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!jobDrive) throw new ApiError(404, 'Job drive not found');
  res.json({ success: true, data: jobDrive });
});

// Delete job drive
export const deleteJobDrive = asyncHandler(async (req, res) => {
  const jobDrive = await JobDrive.findByIdAndDelete(req.params.id);
  if (!jobDrive) throw new ApiError(404, 'Job drive not found');
  res.json({ success: true, message: 'Job drive deleted' });
});
