import { JobApplicationModel as JobApplication } from '../models/JobApplicationModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// List all job applications scoped to institution
export const getAllJobApplications = asyncHandler(async (req, res) => {
  const jobApplications = await JobApplication.find()
    .populate('drive')
    .populate('student');
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
  const jobApplication = await JobApplication.create({
    drive,
    student: req.user._id,
    stage: 'applied',
    resumeUrl,
    history: [{ stage: 'applied', timestamp: new Date(), note: 'Application submitted' }],
  });
  res.status(201).json({ success: true, data: jobApplication });
});

// Update job application (placement officer updates stage)
export const updateJobApplication = asyncHandler(async (req, res) => {
  const jobApplication = await JobApplication.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!jobApplication) throw new ApiError(404, 'Job application not found');
  res.json({ success: true, data: jobApplication });
});
