// error middleware: final Express error handler + notFound catch-all.
import { env, isProduction } from '../config/env.js'
import { logger } from '../utils/logger.js'

export const notFound = (req, _res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`)
  err.status = 404
  next(err)
}

export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || err.status || 500
  let { message } = err

  if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid ${err.path}`
  } else if (err.name === 'ValidationError') {
    statusCode = 422
    message = message || Object.values(err.errors).map((e) => e.message).join('; ')
  } else if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409
    message = `Duplicate field value entered: ${Object.keys(err.keyPattern ?? {}).join(', ')}`
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = message || 'Invalid token, please log in again'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = message || 'Token expired, please log in again'
  } else if (err.name === 'MulterError') {
    // file-upload failures: oversized payloads and upload protocol errors
    statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large — reduce the file size and try again'
      : message || 'File upload failed'
  }

  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`)

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.details && { details: err.details }),
    ...(env.nodeEnv === 'development' && { stack: err.stack })
  })
}
