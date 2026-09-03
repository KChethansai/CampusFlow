import mongoose from 'mongoose'

const aiReportSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: { type: String, required: true },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dataSnapshotHash: String,
    input: mongoose.Schema.Types.Mixed,
    output: mongoose.Schema.Types.Mixed,
    provider: String,
    expiresAt: Date
  },
  { timestamps: true }
)

export default mongoose.model('AIReport', aiReportSchema)
