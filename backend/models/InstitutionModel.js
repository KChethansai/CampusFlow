import { Schema, model } from 'mongoose';
import { emailMatchesPattern } from '../utils/emailPattern.js';

const institutionSchema = new Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  emailDomainPattern: {
    type: String,
    required: true,
    trim: true,
    maxlength: 256,
    validate: {
      validator: (pattern) => {
        if (!pattern || pattern.length > 256) return false;
        if (!/[\\^$*+?()[\]{}|]/.test(pattern)) {
          return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/i.test(pattern);
        }
        try {
          new RegExp(pattern, 'i');
          return true;
        } catch {
          return false;
        }
      },
      message: 'Email domain pattern must be a valid domain suffix or regex (max 256 characters)'
    },
  },
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
}, { timestamps: true, versionKey: false, strict: 'throw' });

export const InstitutionModel = model('Institution', institutionSchema);

export const institutionAcceptsEmail = (institution, email) =>
  emailMatchesPattern(email, institution?.emailDomainPattern);
