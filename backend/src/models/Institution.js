import mongoose from 'mongoose';

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  address: {
    city: String,
    state: String,
    country: String
  },
  contactEmail: { type: String, lowercase: true },
  logoUrl: String,
  settings: {
    attendanceThreshold: { type: Number, default: 75, min: 0, max: 100 },
    gradingScale: {
      type: String,
      enum: ['10-point', 'percentage'],
      default: '10-point'
    },
    academicYearStart: { type: String, default: '2025-08-01' }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Institution', institutionSchema);