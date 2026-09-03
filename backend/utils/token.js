// token utils: sign, verify, hash, and random token helpers.
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { env } from '../config/env.js'

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: user._id, role: user.role, institution: user.institution, department: user.department },
    env.secretKey,
    { expiresIn: env.accessExpires }
  )

export const signRefreshToken = (user) =>
  jwt.sign(
    { sub: user._id, type: 'refresh', jti: crypto.randomUUID() },
    env.refreshSecretKey,
    { expiresIn: `${env.refreshExpiresDays}d` }
  )

export const verifyAccessToken = (token) => jwt.verify(token, env.secretKey)
export const verifyRefreshToken = (token) => jwt.verify(token, env.refreshSecretKey)

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')
export const randomToken = () => crypto.randomBytes(32).toString('hex')
