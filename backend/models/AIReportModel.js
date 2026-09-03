import { Schema, model } from 'mongoose'

const aiReportSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: { type: String, required: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    dataSnapshotHash: String,
    input: Schema.Types.Mixed,
    output: Schema.Types.Mixed,
    provider: String,
    expiresAt: Date
  },
  { timestamps: true, versionKey: false, strict: 'throw' }
)

export const AIReportModel = model('AIReport', aiReportSchema);
