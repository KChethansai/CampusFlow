// db config: connect to MongoDB Atlas/local instance.
import mongoose from 'mongoose'
import { env, isProduction } from './env.js'

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.dbUrl, {
      serverSelectionTimeoutMS: 15000
    })
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`)
    if (isProduction) process.exit(1)
    throw err
  }
}

export default connectDB
