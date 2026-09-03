import { ApiError } from '../utils/ApiError.js';

export const restrictTo = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, `User role '${req.user.role}' is unauthorized to perform this action`));
  }
  next();
};

export const sameInstitution = (getModelFromReq) => (req, _res, next) => {
  const doc = getModelFromReq(req);
  if (req.user.role !== 'super_admin' && doc?.institution?.toString() !== req.user.institution?.toString()) {
    return next(new ApiError(403, 'Cross-tenant resource access denied'));
  }
  next();
};