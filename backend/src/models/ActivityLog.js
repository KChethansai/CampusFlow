import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: { type: String, required: true },
    entityType: String,
    entityId: String,
    institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
    meta: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String
  },
  { timestamps: true }
)

export default mongoose.model('ActivityLog', activityLogSchema)
