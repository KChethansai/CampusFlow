// auditLog middleware: records every authenticated state-changing request
// (POST/PATCH/PUT/DELETE) to the ActivityLog collection after it completes.
import { logActivity } from '../services/activityLog.service.js'

const WRITE_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE']

const SENSITIVE_KEYS = [
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'refreshToken',
  'accessToken',
  'token',
  'passwordResetToken',
  'emailVerificationToken'
]

const sanitize = (value) => {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(sanitize)
  const out = {}
  for (const [key, val] of Object.entries(value)) {
    out[key] = SENSITIVE_KEYS.includes(key) ? '[redacted]' : sanitize(val)
  }
  return out
}

export const auditLog = (req, res, next) => {
  if (!WRITE_METHODS.includes(req.method)) return next()

  res.on('finish', () => {
    if (res.statusCode >= 400 || !req.user?._id) return

    const segments = req.originalUrl.split('?')[0].split('/').filter(Boolean)
    const entityType = segments[2] ? segments[2].replace(/-/g, '_') : undefined

    logActivity({
      req,
      action: `${req.method} ${req.originalUrl.split('?')[0]}`,
      entityType,
      entityId: req.params?.id,
      meta: {
        status: res.statusCode,
        body: sanitize(req.body)
      }
    })
  })

  next()
}
