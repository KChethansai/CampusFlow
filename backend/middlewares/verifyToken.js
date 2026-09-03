// verifyToken middleware: verifies the access token from the Authorization
// header, attaches the user, and optionally enforces allowed roles.
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { UserModel } from '../models/UserModel.js'

export const verifyToken = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || ''
      const token = header.startsWith('Bearer ') ? header.slice(7) : null

      if (!token) {
        const err = new Error('Not authorized, no token provided')
        err.status = 401
        return next(err)
      }

      const decoded = jwt.verify(token, env.secretKey)

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        const err = new Error(
          `User role '${decoded.role}' is unauthorized to perform this action`
        )
        err.status = 403
        return next(err)
      }

      const user = await UserModel.findById(decoded.sub).select('-password')
      if (!user) {
        const err = new Error('User not found')
        err.status = 401
        return next(err)
      }

      req.user = user
      next()
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        const e = new Error('Access token expired, please refresh')
        e.status = 401
        return next(e)
      }
      const e = new Error('Not authorized, token failed')
      e.status = 401
      return next(e)
    }
  }
}