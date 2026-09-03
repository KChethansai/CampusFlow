import { Schema, model } from 'mongoose';

const refreshTokenSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
  replacedBy: String,
  userAgent: String,
  ip: String
}, { timestamps: true, versionKey: false, strict: 'throw' });

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RefreshTokenModel = model('RefreshToken', refreshTokenSchema);