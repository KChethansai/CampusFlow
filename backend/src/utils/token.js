import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: user._id, role: user.role, institution: user.institution, department: user.department },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );

export const signRefreshToken = (user) =>
  jwt.sign(
    { sub: user._id, type: 'refresh', jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${process.env.JWT_REFRESH_EXPIRES_DAYS || 7}d` }
  );

export const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const randomToken = () => crypto.randomBytes(32).toString('hex');