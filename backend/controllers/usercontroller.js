import crypto from 'crypto';
import { UserModel as User } from '../models/UserModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { cleanUrl } from '../utils/sanitize.js';
import { provisionInstitutionForAccount } from '../services/accountProvisioning.service.js';

const accountRoles = ['super_admin', 'college_admin', 'faculty', 'student', 'placement_officer'];

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
      const { institution, email, department } = await provisionInstitutionForAccount({
        caller: req.user,
        role: row.role,
        email: row.email,
        requestedInstitution: row.institution ?? req.query.institution, // super_admin per-row or query
        department: row.department
      });

      const tempPassword = crypto.randomBytes(12).toString('hex');
      const user = await User.create({
        name: row.name,
        email,
        password: tempPassword,
        role: row.role,
        institution: institution._id,
        department,
        profile: row.profile,
        isEmailVerified: true
      });
      const created = user.toObject();
      delete created.password;
      results.push({ index, success: true, data: { ...created, tempPassword } });
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

export const completeOnboardingTour = asyncHandler(async (req, res) => {
  if (Object.keys(req.body || {}).length !== 1 || req.body.completed !== true) {
    throw new ApiError(400, 'completed must be true');
  }
  req.user.onboardingTourCompleted = true;
  await req.user.save();
  res.json({ success: true, data: req.user });
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
