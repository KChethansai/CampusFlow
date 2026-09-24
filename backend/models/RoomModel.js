import { Schema, model } from 'mongoose';

const roomSchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  capacity: { type: Number, required: true, min: 1 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true, versionKey: false, strict: 'throw' });

roomSchema.index({ institution: 1, code: 1 }, { unique: true });
export const RoomModel = model('Room', roomSchema);
