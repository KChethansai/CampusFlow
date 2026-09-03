import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Create department
export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, hod, description } = req.body;

  const department = await Department.create({
    name,
    code,
    hod,
    description,
    institution: req.user.institution,
  });

  res.status(201).json({ success: true, data: department });
});

// List all departments scoped to institution
export const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ institution: req.user.institution })
    .populate('hod');

  res.json({ success: true, data: departments });
});

// Get single department by ID
export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate('hod');

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  res.json({ success: true, data: department });
});

// Update department
export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  res.json({ success: true, data: department });
});

// Delete department
export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndDelete(req.params.id);

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  res.json({ success: true, message: 'Department deleted' });
});
