import { Schema, model } from 'mongoose';

const attendanceSessionSchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
  date: { type: Date, required: true },
  period: { type: Number, required: true, min: 1 },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  records: [{
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'od'],
      required: true
    },
    remark: String
  }]
}, { timestamps: true, versionKey: false, strict: 'throw' });

export const AttendanceSessionModel = model('AttendanceSession', attendanceSessionSchema);