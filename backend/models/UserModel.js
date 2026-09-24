import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

export const NOTIFICATION_CATEGORIES = ['assignment', 'event', 'announcement', 'request', 'placement', 'account', 'system'];
const channelPreferenceSchema = new Schema({
  inApp: { type: Boolean, default: true },
  push: { type: Boolean, default: true },
  email: { type: Boolean, default: true }
}, { _id: false, strict: 'throw' });
const notificationPreferencesSchema = new Schema(
  Object.fromEntries(NOTIFICATION_CATEGORIES.map((category) => [category, { type: channelPreferenceSchema, default: () => ({}) }])),
  { _id: false, strict: 'throw' }
);

export const DEFAULT_NOTIFICATION_PREFERENCES = Object.fromEntries(
  NOTIFICATION_CATEGORIES.map((category) => [category, { inApp: true, push: true, email: true }])
);

export const getNotificationPreferences = (value) => Object.fromEntries(
  NOTIFICATION_CATEGORIES.map((category) => [category, {
    ...DEFAULT_NOTIFICATION_PREFERENCES[category],
    ...(value?.[category]?.toObject?.() ?? value?.[category] ?? {})
  }])
);

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
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  passwordChangedAt: { type: Date, select: false },
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
  onboardingTourCompleted: { type: Boolean, default: false },
  notificationPreferences: { type: notificationPreferencesSchema, default: () => ({}) }
}, {
  timestamps: true,
  versionKey: false,
  strict: 'throw',
  toJSON: {
    transform: (_doc, ret) => {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.passwordChangedAt;
      delete ret.notificationPreferences;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: (_doc, ret) => {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.passwordChangedAt;
      delete ret.notificationPreferences;
      delete ret.__v;
      return ret;
    }
  }
});

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
