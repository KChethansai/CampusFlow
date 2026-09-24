import { UserModel as User } from '../models/UserModel.js';
import { RefreshTokenModel as RefreshToken } from '../models/RefreshTokenModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, sha256, randomToken } from '../utils/token.js';
import { sendPasswordResetEmail, isSmtpConfigured } from '../services/email.service.js';
import { createNotification } from '../services/notification.service.js';
import { logActivity } from '../services/activityLog.service.js';
import { env, getCookieOptions, getClearCookieOptions } from '../config/env.js';
import { provisionInstitutionForAccount } from '../services/accountProvisioning.service.js';
import { sanitizeUser } from '../utils/userDto.js';

const getCookieToken = (req) => {
  if (req.cookies?.refreshToken) return req.cookies.refreshToken;
  const rawCookie = req.headers?.cookie;
  if (!rawCookie) return null;
  const match = rawCookie.match(/(?:^|;\s*)refreshToken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

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
    expiresAt: new Date(Date.now() + env.refreshExpiresDays * 24 * 3600 * 1000),
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  user.lastLoginAt = new Date();
  await user.save();

  await logActivity({
    req,
    action: 'auth.login',
    entityType: 'User',
    entityId: user._id,
    actor: user._id,
    institution: user.institution
  });

  res.cookie('refreshToken', refreshToken, getCookieOptions());
  res.json({ success: true, user: sanitizeUser(user, 'self'), accessToken, refreshToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.body?.refreshToken || getCookieToken(req);
  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token is required');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  if (payload.type !== 'refresh') {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const stored = await RefreshToken.findOne({
    user: payload.sub,
    tokenHash: sha256(refreshToken),
    revokedAt: { $exists: false }
  });

  if (!stored || (stored.expiresAt && stored.expiresAt.getTime() <= Date.now())) {
    // Check if this token was recently rotated within a short grace period (15s)
    const recentlyRotated = await RefreshToken.findOne({
      user: payload.sub,
      tokenHash: sha256(refreshToken),
      revokedAt: { $gt: new Date(Date.now() - 15000) }
    });

    if (recentlyRotated) {
      throw new ApiError(401, 'Session recently refreshed. Please retry with the latest token.');
    }

    await RefreshToken.updateMany({ user: payload.sub }, { revokedAt: new Date() });
    throw new ApiError(401, 'Token reuse detected. All sessions revoked. Please log in again.');
  }

  stored.revokedAt = new Date();
  const user = await User.findById(payload.sub).select('+passwordChangedAt');
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
  // A password change (self, reset, or admin-forced) invalidate the refresh
  // family: the presented token predates it, so reject instead of rotating.
  if (typeof user.changedPasswordAfter === 'function' && user.changedPasswordAfter(payload.iat)) {
    await RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() });
    throw new ApiError(401, 'Session expired after password change, please log in again');
  }
  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  stored.replacedBy = sha256(newRefreshToken);
  await stored.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: sha256(newRefreshToken),
    expiresAt: new Date(Date.now() + env.refreshExpiresDays * 24 * 3600 * 1000)
  });

  res.cookie('refreshToken', newRefreshToken, getCookieOptions());
  res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, institution, department, profile } = req.body;

  const { institution: targetInstitution, email: normalizedEmail, department: departmentId, course: courseId } = await provisionInstitutionForAccount({
    caller: req.user,
    role,
    email,
    requestedInstitution: institution,
    department,
    course: profile?.course
  });

  const finalProfile = profile ? { ...profile } : undefined;
  if (courseId && finalProfile) finalProfile.course = courseId;

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role,
    institution: targetInstitution._id,
    department: departmentId,
    profile: finalProfile,
    isEmailVerified: true
  });

  await logActivity({
    req,
    action: 'auth.register',
    entityType: 'User',
    entityId: user._id,
    actor: user._id,
    institution: user.institution
  });

  res.status(201).json({ success: true, user: sanitizeUser(user, 'self') });
});

export const logout = asyncHandler(async (req, res) => {
  // Logout is intentionally refresh-tolerant: it must still revoke the session
  // when the short-lived access token already expired (the common deployment
  // case). Possession of the refresh token authorizes revoking that session.
  const refreshToken = req.body?.refreshToken || getCookieToken(req);
  let userId = req.user?._id;
  if (!userId && refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      if (payload?.type === 'refresh') userId = payload.sub;
    } catch {
      // Expired/invalid refresh — still clear the cookie below (idempotent).
    }
  }
  if (userId && refreshToken) {
    const stored = await RefreshToken.findOne({
      user: userId,
      tokenHash: sha256(refreshToken),
      revokedAt: { $exists: false }
    });
    if (stored) {
      stored.revokedAt = new Date();
      await stored.save();
    }
  }

  res.clearCookie('refreshToken', getClearCookieOptions());

  if (userId) {
    await logActivity({
      req,
      action: 'auth.logout',
      entityType: 'User',
      entityId: userId
    });
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

  const fallbackToInApp = async () =>
    createNotification({
      recipient: user._id,
      category: 'account',
      title: 'Password Reset Request',
      message: `Your password reset token: ${resetToken} (valid for 10 minutes)`,
      type: 'info'
    });

  if (isSmtpConfigured()) {
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token: resetToken
      });
    } catch {
      await fallbackToInApp();
    }
  } else {
    await fallbackToInApp();
  }

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

  await logActivity({
    req,
    action: 'auth.reset_password',
    entityType: 'User',
    entityId: user._id,
    actor: user._id,
    institution: user.institution
  });

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

  await logActivity({
    req,
    action: 'auth.change_password',
    entityType: 'User',
    entityId: req.user._id
  });

  await RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() });

  res.json({ success: true, message: 'Password changed. Please log in again.' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user, 'self') });
});
