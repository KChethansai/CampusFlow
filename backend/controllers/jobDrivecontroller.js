import mongoose from 'mongoose';
import { JobDriveModel as JobDrive } from '../models/JobDriveModel.js';
import { CompanyModel as Company } from '../models/CompanyModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick, scopedOne, tenantFilter } from '../utils/scope.js';

const validateDriveReferences = async (institutionId, { company, eligibility }) => {
  if (company) {
    if (!mongoose.isValidObjectId(company)) throw new ApiError(400, 'Invalid company ID');
    const compDoc = await Company.findOne({ _id: company, institution: institutionId });
    if (!compDoc) throw new ApiError(404, 'Company not found in institution');
  }

  if (eligibility?.allowedDepartments && Array.isArray(eligibility.allowedDepartments)) {
    for (const deptId of eligibility.allowedDepartments) {
      if (!mongoose.isValidObjectId(deptId)) throw new ApiError(400, 'Invalid allowed department ID');
    }
    const depts = await Department.find({
      _id: { $in: eligibility.allowedDepartments },
      institution: institutionId
    }).select('_id');
    if (depts.length !== eligibility.allowedDepartments.length) {
      throw new ApiError(400, 'One or more allowed departments do not belong to this institution');
    }
  }
};

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
  await validateDriveReferences(req.user.institution, { company, eligibility });

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
  await validateDriveReferences(req.user.institution, {
    company: req.body.company,
    eligibility: req.body.eligibility
  });

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
