import mongoose from 'mongoose';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { UserModel as User } from '../models/UserModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick, scopedOne, tenantFilter } from '../utils/scope.js';

// Create department
export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, hod, description } = req.body;

  if (hod) {
    if (!mongoose.isValidObjectId(hod)) throw new ApiError(400, 'Invalid HOD ID');
    const hodUser = await User.findOne({
      _id: hod,
      institution: req.user.institution,
      role: { $in: ['faculty', 'college_admin', 'super_admin'] }
    });
    if (!hodUser) throw new ApiError(404, 'HOD user not found or unauthorized');
  }

  const department = await Department.create({
    name,
    code,
    hod,
    description,
    institution: req.user.institution,
  });

  res.status(201).json({ success: true, data: department });
});

// List all departments scoped to institution (paginated)
export const getAllDepartments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = tenantFilter(req);
  const [departments, total] = await Promise.all([
    Department.find(filter).populate('hod', 'name email role').skip(skip).limit(limit),
    Department.countDocuments(filter),
  ]);

  pagedResponse(res, departments, total, { page, limit });
});

// Get single department by ID (tenant-scoped)
export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await scopedOne(Department, req, req.params.id, { path: 'hod', select: 'name email role' });

  res.json({ success: true, data: department });
});

// Update department (tenant-scoped, allowlisted)
export const updateDepartment = asyncHandler(async (req, res) => {
  if (req.body.hod) {
    if (!mongoose.isValidObjectId(req.body.hod)) throw new ApiError(400, 'Invalid HOD ID');
    const hodUser = await User.findOne({
      _id: req.body.hod,
      institution: req.user.institution,
      role: { $in: ['faculty', 'college_admin', 'super_admin'] }
    });
    if (!hodUser) throw new ApiError(404, 'HOD user not found or unauthorized');
  }

  const department = await Department.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    pick(req.body, ['name', 'code', 'hod', 'description', 'isActive']),
    {
      new: true,
      runValidators: true,
    }
  );

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  res.json({ success: true, data: department });
});

// Delete department (tenant-scoped)
export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findOneAndDelete({
    _id: req.params.id,
    institution: req.user.institution,
  });

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  res.json({ success: true, message: 'Department deleted' });
});
