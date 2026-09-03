// app: express app wiring — security, CORS, body parsing, static uploads,
// health check, API routers, and centralized error handling.
import express from 'express'
import cors from 'cors'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'

import routes from './APIs/index.js'
import { env } from './config/env.js'
import { securityMiddleware, rejectUnsafePayload } from './config/security.js'
import { notFound, errorHandler } from './middlewares/errorHandler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.set('trust proxy', 1)
app.use(securityMiddleware)
app.use(
  cors({
    origin: env.clientUrls,
    credentials: true
  })
)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(mongoSanitize())
app.use(rejectUnsafePayload)

// stricter limit for credential endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later' }
})

app.use('/uploads', express.static(path.join(__dirname, env.upload.dir)))
app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }))
app.use('/api/v1/auth/login', authLimiter)
app.use('/api/v1', routes)

app.use(notFound)
app.use(errorHandler)

export default app
