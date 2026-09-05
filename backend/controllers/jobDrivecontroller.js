import { JobDriveModel as JobDrive } from '../models/JobDriveModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick, scopedOne, tenantFilter } from '../utils/scope.js';

// List all job drives scoped to institution (paginated)
export const getAllJobDrives = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = tenantFilter(req);
  const [jobDrives, total] = await Promise.all([
    JobDrive.find(filter).populate('company').skip(skip).limit(limit),
    JobDrive.countDocuments(filter),
  ]);
  pagedResponse(res, jobDrives, total, { page, limit });
});

// Get single job drive (tenant-scoped)
export const getJobDriveById = asyncHandler(async (req, res) => {
  const jobDrive = await scopedOne(JobDrive, req, req.params.id, 'company');
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

// Update job drive (tenant-scoped, allowlisted)
export const updateJobDrive = asyncHandler(async (req, res) => {
  const jobDrive = await JobDrive.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    pick(req.body, [
      'company',
      'role',
      'jobType',
      'packageLPA',
      'location',
      'eligibility',
      'applicationDeadline',
      'status',
    ]),
    {
      new: true,
      runValidators: true,
    }
  );
  if (!jobDrive) throw new ApiError(404, 'Job drive not found');
  res.json({ success: true, data: jobDrive });
});

// Delete job drive (tenant-scoped)
export const deleteJobDrive = asyncHandler(async (req, res) => {
  const jobDrive = await JobDrive.findOneAndDelete({
    _id: req.params.id,
    institution: req.user.institution,
  });
  if (!jobDrive) throw new ApiError(404, 'Job drive not found');
  res.json({ success: true, message: 'Job drive deleted' });
});
