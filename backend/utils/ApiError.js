// ApiError: operational error with an HTTP status, thrown by controllers.
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message)
    this.statusCode = statusCode
    this.status = statusCode
    this.details = details
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}
