import { ApiError } from '../utils/ApiError.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, _res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(401, 'Not authorized, no token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.sub).select('-password');
    if (!req.user) {
      return next(new ApiError(401, 'User not found'));
    }
    next();
  } catch (err) {
    return next(new ApiError(401, 'Not authorized, token failed'));
  }
};