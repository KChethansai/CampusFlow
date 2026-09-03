// env config: validates deployment-time backend configuration.
import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
config({ path: path.join(__dirname, '../.env') })

// legacy aliases (MONGO_URI / JWT_*) still accepted for existing setups
const dbUrl = process.env.DB_URL || process.env.MONGO_URI
const secretKey = process.env.SECRET_KEY || process.env.JWT_ACCESS_SECRET
const refreshSecretKey = process.env.SECRET_KEY_REFRESH || process.env.JWT_REFRESH_SECRET

const requiredVars = [
  ['DB_URL', dbUrl],
  ['SECRET_KEY', secretKey],
  ['SECRET_KEY_REFRESH', refreshSecretKey]
]

const missingVars = requiredVars
  .filter(([, value]) => !value)
  .map(([name]) => name)

if (missingVars.length > 0) {
  throw new Error(
    `Missing required env vars: ${missingVars.join(', ')} (legacy MONGO_URI / JWT_* aliases also accepted)`
  )
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  dbUrl,
  secretKey,
  refreshSecretKey,
  accessExpires: process.env.ACCESS_TOKEN_EXPIRES || process.env.JWT_ACCESS_EXPIRES || '15m',
  refreshExpiresDays:
    Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) ||
    Number(process.env.JWT_REFRESH_EXPIRES_DAYS) ||
    7,
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  cookieSameSite:
    process.env.COOKIE_SAME_SITE ||
    (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads/',
    maxMB: Math.max(Number(process.env.MAX_FILE_MB) || 10, 1)
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@campusflow.app'
  },
  ai: {
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    nemotronModel: process.env.NEMOTRON_MODEL || ''
  }
}

export const isProduction = env.nodeEnv === 'production'

export const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: env.cookieSameSite,
  secure: isProduction || env.cookieSameSite === 'none',
  maxAge: 20 * 365 * 24 * 60 * 60 * 1000 // 20 years
})
