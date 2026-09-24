// server: entrypoint — connect to MongoDB, attach Socket.IO, start HTTP.
import http from 'http'
import app from './app.js'
import connectDB from './config/db.js'
import { env } from './config/env.js'
import { initSocket } from './config/socket.js'
import { startDigestJob } from './services/digest.service.js'

const start = async () => {
  await connectDB()
  const httpServer = http.createServer(app)
  initSocket(httpServer) // realtime: notifications/announcements/attendance/requests
  startDigestJob() // weekly email digest (no-op without SMTP)
  httpServer.listen(env.port, () => {
    console.log(
      `Server running in ${env.nodeEnv} mode on port ${env.port}`
    )
  })
}

start().catch((err) => {
  console.error(`Fatal startup error: ${err.message}`)
  process.exit(1)
})
