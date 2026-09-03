import crypto from 'crypto';
import { UserModel as User } from '../models/UserModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Admin-provisioned user creation
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, role, department, profile } = req.body;

  // Generate a temporary password
  const tempPassword = crypto.randomBytes(8).toString('hex');

  const user = await User.create({
    name,
    email,
    password: tempPassword,
    role,
    institution: req.user.institution,
    department,
    profile,
    isEmailVerified: true,
  });

  res.status(201).json({
    success: true,
    data: { ...user.toObject(), tempPassword },
  });
});

// List all users scoped to the institution
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ institution: req.user.institution })
    .populate('department');

  res.json({ success: true, data: users });
});

// Get single user by ID (must belong to same institution)
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (String(user.institution) !== String(req.user.institution)) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({ success: true, data: user });
});

// Update user
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ success: true, data: user });
});

// Soft-delete user (set isActive: false)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ success: true, message: 'User deactivated' });
});
