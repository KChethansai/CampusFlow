import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(Object.assign(new Error(`Route not found: ${req.originalUrl}`), { statusCode: 404 }));
}

export function errorHandler(err, req, res, _next) {
  let { statusCode = 500, message } = err;

  if (err.name === 'CastError') { statusCode = 400; message = `Invalid ${err.path}`; }
  if (err.code === 11000) {
    statusCode = 409;
    message = `Duplicate field value entered: ${Object.keys(err.keyValue ?? {}).join(', ')}`;
  }
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = Object.values(err.errors).map(e => e.message).join('; ');
  }

  logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}