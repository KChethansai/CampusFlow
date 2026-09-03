import { Schema, model } from 'mongoose'

const activityLogSchema = new Schema(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: { type: String, required: true },
    entityType: String,
    entityId: String,
    institution: { type: Schema.Types.ObjectId, ref: 'Institution' },
    meta: Schema.Types.Mixed,
    ip: String,
    userAgent: String
  },
  { timestamps: true, versionKey: false, strict: 'throw' }
)

export const ActivityLogModel = model('ActivityLog', activityLogSchema);
