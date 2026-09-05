import crypto from 'crypto';
import { UserModel as User } from '../models/UserModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { cleanUrl } from '../utils/sanitize.js';

// Admin-provisioned user creation
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, role, department, profile } = req.body;

  if (!['super_admin', 'college_admin', 'faculty', 'student', 'placement_officer'].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }
  if (role === 'super_admin' && req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Only super_admin can create super_admin users');
  }

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

// Update user — allowlisted fields, tenant-scoped, password via save() so the
// bcrypt pre-save hook runs (findByIdAndUpdate would store plaintext).
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, institution: req.user.institution });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { name, department, profile, isActive, role, password, avatarUrl } = req.body;

  if (role !== undefined && role !== user.role) {
    if (req.user.role !== 'super_admin') {
      throw new ApiError(403, 'Only super_admin can change user roles');
    }
    if (String(user._id) === String(req.user._id)) {
      throw new ApiError(403, 'You cannot change your own role');
    }
    if (!['super_admin', 'college_admin', 'faculty', 'student', 'placement_officer'].includes(role)) {
      throw new ApiError(400, 'Invalid role');
    }
    user.role = role;
  }

  if (name !== undefined) user.name = name;
  if (department !== undefined) user.department = department || undefined;
  if (profile !== undefined) {
    user.profile = {
      ...user.profile?.toObject?.(),
      ...profile,
      avatarUrl: cleanUrl(profile.avatarUrl, 'avatarUrl') ?? user.profile?.avatarUrl
    };
  }
  if (isActive !== undefined) {
    if (String(user._id) === String(req.user._id) && isActive === false) {
      throw new ApiError(403, 'You cannot deactivate your own account');
    }
    user.isActive = Boolean(isActive);
  }
  // Passwords go through save() so hashing + passwordChangedAt apply.
  if (password !== undefined && password !== '') {
    if (typeof password !== 'string' || password.length < 8) {
      throw new ApiError(422, 'Password must be at least 8 characters');
    }
    user.password = password;
  }

  await user.save();

  const out = user.toObject();
  delete out.password;
  res.json({ success: true, data: out });
});

// Soft-delete user (set isActive: false)
export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(403, 'You cannot deactivate your own account');
  }
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    { isActive: false },
    { new: true },
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ success: true, message: 'User deactivated' });
});
