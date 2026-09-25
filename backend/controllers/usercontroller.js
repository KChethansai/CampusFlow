import crypto from 'crypto';
import { UserModel as User } from '../models/UserModel.js';
import { RefreshTokenModel as RefreshToken } from '../models/RefreshTokenModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { cleanUrl } from '../utils/sanitize.js';
import { provisionInstitutionForAccount } from '../services/accountProvisioning.service.js';
import { sanitizeUser, sanitizeUsers } from '../utils/userDto.js';
import { pageParams, pagedResponse } from '../utils/scope.js';

const accountRoles = ['super_admin', 'college_admin', 'hod', 'faculty', 'student', 'placement_officer'];

// Minimal CSV parser (expects a name,email,role,department,institution header);
// quote-aware, no new dependency.
const splitCsvRow = (line) => {
  const cells = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i += 1; } // escaped quote
        else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { cells.push(cur); cur = ''; }
    else cur += ch;
  }
  cells.push(cur);
  return cells;
};

const parseBulkCsv = (buffer) => {
  const text = buffer.toString('utf8').replace(/^﻿/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];
  const headers = splitCsvRow(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitCsvRow(line);
    const row = {};
    headers.forEach((h, j) => { if (h) row[h] = (cells[j] ?? '').trim(); });
    return row;
  });
};

export const bulkCreateUsers = asyncHandler(async (req, res) => {
  // JSON `{ users: [...] }` OR multipart CSV upload (field `file`).
  let rows = req.body?.users;
  if (req.file?.buffer) rows = parseBulkCsv(req.file.buffer);
  else if (typeof rows === 'string') {
    try { rows = JSON.parse(rows); } catch { rows = undefined; } // multipart text field
  }
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
    throw new ApiError(400, 'users must be a non-empty array of at most 500 accounts');
  }

  const results = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    try {
      if (!row || typeof row !== 'object' || Array.isArray(row)) throw new ApiError(400, 'Invalid account row');
      if (!accountRoles.includes(row.role)) throw new ApiError(400, 'Invalid role');
      const rawCourse = row.course || row.profile?.course;
      const { institution, email, department, course } = await provisionInstitutionForAccount({
        caller: req.user,
        role: row.role,
        email: row.email,
        requestedInstitution: row.institution ?? req.query.institution, // super_admin per-row or query
        department: row.department,
        course: rawCourse
      });

      const userProfile = row.profile ? { ...row.profile } : undefined;
      if (course && userProfile) userProfile.course = course;

      const tempPassword = crypto.randomBytes(12).toString('hex');
      const user = await User.create({
        name: row.name,
        email,
        password: tempPassword,
        role: row.role,
        institution: institution._id,
        department,
        profile: userProfile || (course ? { course } : undefined),
        isEmailVerified: true
      });
      results.push({ index, success: true, data: { ...sanitizeUser(user, 'admin'), tempPassword } });
    } catch (error) {
      results.push({ index, success: false, email: row?.email, message: error.statusCode ? error.message : 'Account could not be created' });
    }
  }

  res.status(207).json({
    success: true,
    data: {
      succeeded: results.filter((result) => result.success).length,
      failed: results.filter((result) => !result.success).length,
      results
    }
  });
});

// List all users scoped to the institution (paginated)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = { institution: req.user.institution };
  const [users, total] = await Promise.all([
    User.find(filter).populate('department', 'name code').skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  pagedResponse(res, sanitizeUsers(users, 'admin'), total, { page, limit });
});

// Get single user by ID — tenant-scoped query, no cross-tenant fetch.
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, institution: req.user.institution });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ success: true, data: sanitizeUser(user, 'admin') });
});

export const completeOnboardingTour = asyncHandler(async (req, res) => {
  if (Object.keys(req.body || {}).length !== 1 || req.body.completed !== true) {
    throw new ApiError(400, 'completed must be true');
  }
  req.user.onboardingTourCompleted = true;
  await req.user.save();
  res.json({ success: true, data: sanitizeUser(req.user, 'self') });
});

// Mandatory onboarding completion — self-scoped, single-purpose, exact-body
// validated like completeOnboardingTour. Sets the explicit server-side flag the
// client gate uses; never accepts profile fields (no generic self-update).
export const completeOnboarding = asyncHandler(async (req, res) => {
  if (Object.keys(req.body || {}).length !== 1 || req.body.completed !== true) {
    throw new ApiError(400, 'completed must be true');
  }
  req.user.onboardingCompleted = true;
  await req.user.save();
  res.json({ success: true, data: sanitizeUser(req.user, 'self') });
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
    if (!['super_admin', 'college_admin', 'hod', 'faculty', 'student', 'placement_officer'].includes(role)) {
      throw new ApiError(400, 'Invalid role');
    }
    user.role = role;
  }

  if (name !== undefined) user.name = name;
  if (department !== undefined) {
    if (department) {
      const deptDoc = await Department.findOne({ _id: department, institution: req.user.institution });
      if (!deptDoc) {
        throw new ApiError(400, 'Department does not exist in this institution');
      }
      user.department = department;
    } else {
      user.department = undefined;
    }
  }
  if (profile !== undefined) {
    if (profile.course) {
      const { CourseModel: Course } = await import('../models/CourseModel.js');
      if (!/^[a-f\d]{24}$/i.test(String(profile.course))) {
        throw new ApiError(400, 'Invalid course ID');
      }
      const courseDoc = await Course.findOne({ _id: profile.course, institution: user.institution });
      if (!courseDoc) {
        throw new ApiError(400, 'Course does not exist in this institution');
      }
    }
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
  // An admin-forced password change must also kill existing sessions,
  // mirroring change-password/reset-password revocation.
  if (password !== undefined && password !== '') {
    if (typeof password !== 'string' || password.length < 8) {
      throw new ApiError(422, 'Password must be at least 8 characters');
    }
    user.password = password;
    await RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() });
  }

  await user.save();

  res.json({ success: true, data: sanitizeUser(user, 'admin') });
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
