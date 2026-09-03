import { UserModel as User } from '../models/UserModel.js';
import { RefreshTokenModel as RefreshToken } from '../models/RefreshTokenModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, sha256, randomToken } from '../utils/token.js';
import { sendCredentialsEmail } from '../services/email.service.js';
import { createNotification } from '../services/notification.service.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, 'Please verify your email before logging in');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account deactivated. Contact system admin.');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await RefreshToken.create({
    user: user._id,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  user.lastLoginAt = new Date();
  await user.save();

  const userObj = user.toObject();
  delete userObj.password;

  res.json({ success: true, user: userObj, accessToken, refreshToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token is required');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const stored = await RefreshToken.findOne({
    user: payload.sub,
    tokenHash: sha256(refreshToken),
    revokedAt: { $exists: false }
  });

  if (!stored) {
    await RefreshToken.updateMany({ user: payload.sub }, { revokedAt: new Date() });
    throw new ApiError(401, 'Token reuse detected. All sessions revoked. Please log in again.');
  }

  stored.revokedAt = new Date();
  const user = await User.findById(payload.sub);
  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  stored.replacedBy = sha256(newRefreshToken);
  await stored.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: sha256(newRefreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000)
  });

  res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, institution, department, profile } = req.body;

  if (!['super_admin', 'college_admin', 'faculty', 'student', 'placement_officer'].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    institution,
    department,
    profile,
    isEmailVerified: true
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await RefreshToken.create({
    user: user._id,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  res.status(201).json({ success: true, user, accessToken, refreshToken });
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const stored = await RefreshToken.findOne({
      user: req.user._id,
      tokenHash: sha256(refreshToken),
      revokedAt: { $exists: false }
    });
    if (stored) {
      stored.revokedAt = new Date();
      await stored.save();
    }
  }

  res.json({ success: true, message: 'Logged out successfully' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ success: true, message: 'If email exists, reset link sent' });
  }

  const resetToken = randomToken();
  user.passwordResetToken = sha256(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await createNotification({
    recipient: user._id,
    title: 'Password Reset Request',
    message: `Your password reset token: ${resetToken} (valid for 10 minutes)`,
    type: 'info'
  });

  res.json({ success: true, message: 'If email exists, reset link sent' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = sha256(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() });

  res.json({ success: true, message: 'Password reset successful. Please log in again.' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  await RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() });

  res.json({ success: true, message: 'Password changed. Please log in again.' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});