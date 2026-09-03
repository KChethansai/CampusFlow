// server: entrypoint — connect to MongoDB, then start the HTTP server.
import app from './app.js'
import connectDB from './config/db.js'
import { env } from './config/env.js'

const start = async () => {
  await connectDB()
  app.listen(env.port, () => {
    console.log(
      `Server running in ${env.nodeEnv} mode on port ${env.port}`
    )
  })
}

start()
