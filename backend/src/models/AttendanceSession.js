import mongoose from 'mongoose';

const attendanceSessionSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  date: { type: Date, required: true },
  period: { type: Number, required: true, min: 1 },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  records: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'od'],
      required: true
    },
    remark: String
  }]
}, { timestamps: true });

export default mongoose.model('AttendanceSession', attendanceSessionSchema);