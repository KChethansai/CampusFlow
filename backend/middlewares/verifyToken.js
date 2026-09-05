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

      const user = await UserModel.findById(decoded.sub).select('-password')
      if (!user) {
        const err = new Error('User not found')
        err.status = 401
        return next(err)
      }

      // Never trust the JWT role claim: re-check role, active flag and
      // password-change recency against the database on every request.
      if (!user.isActive) {
        const err = new Error('Account deactivated. Contact system admin.')
        err.status = 403
        return next(err)
      }

      if (typeof user.changedPasswordAfter === 'function' && user.changedPasswordAfter(decoded.iat)) {
        const err = new Error('Session expired after password change, please log in again')
        err.status = 401
        return next(err)
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        const err = new Error(
          `User role '${user.role}' is unauthorized to perform this action`
        )
        err.status = 403
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