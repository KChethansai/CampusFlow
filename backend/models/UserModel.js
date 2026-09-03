import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: {
    type: String,
    enum: ['super_admin', 'college_admin', 'faculty', 'student', 'placement_officer'],
    required: true,
    index: true
  },
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', index: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  profile: {
    avatarUrl: String,
    phone: String,
    rollNumber: { type: String, index: true, sparse: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    semester: Number,
    section: String,
    batchYear: Number,
    cgpa: Number,
    backlogs: { type: Number, default: 0 },
    designation: String,
    qualification: String
  },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date
}, { timestamps: true, versionKey: false, strict: 'throw' });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtIat) {
  if (!this.passwordChangedAt) return false;
  return jwtIat * 1000 < this.passwordChangedAt.getTime();
};

export const UserModel = model('User', userSchema);