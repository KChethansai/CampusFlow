// validate middleware: runs express-validator validations and attaches
// the first error to req when validation fails.
import { validationResult } from 'express-validator'

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)))

    const errors = validationResult(req)
    if (errors.isEmpty()) return next()

    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg
    }))

    const e = new Error('Validation failed')
    e.status = 422
    e.details = extractedErrors
    next(e)
  }
}