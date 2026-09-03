import mongoose from 'mongoose';

const jobDriveSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  role: { type: String, required: true, trim: true },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'internship', 'contract'],
    default: 'full-time'
  },
  packageLPA: Number,
  location: String,
  eligibility: {
    minCGPA: Number,
    graduationYear: Number,
    maxBacklogs: Number,
    allowedDepartments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }]
  },
  applicationDeadline: Date,
  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.model('JobDrive', jobDriveSchema);