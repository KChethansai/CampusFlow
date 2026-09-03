// security config: centralizes production-safe Express middleware.
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env, isProduction } from './env.js'

export const securityMiddleware = [
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProduction ? 300 : 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later' }
  })
]

const hasUnsafeKey = (value) => {
  if (!value || typeof value !== 'object') return false
  return Object.keys(value).some((key) => {
    if (key.startsWith('$') || key.includes('.')) return true
    return hasUnsafeKey(value[key])
  })
}

// prevent Mongo injection through $ / . prefixed keys
export const rejectUnsafePayload = (req, res, next) => {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.params) || hasUnsafeKey(req.query)) {
    return res.status(400).json({ message: 'Invalid request payload' })
  }

  next()
}