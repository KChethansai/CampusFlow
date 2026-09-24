import mongoose from 'mongoose';
import { RoomModel as Room } from '../models/RoomModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick, scopedOne, tenantFilter } from '../utils/scope.js';

// Create room (HOD: own department only)
export const createRoom = asyncHandler(async (req, res) => {
  const { department, name, code, capacity } = req.body;

  if (!department || !mongoose.isValidObjectId(department)) {
    throw new ApiError(400, 'Invalid department ID');
  }
  const deptDoc = await Department.findOne({ _id: department, institution: req.user.institution });
  if (!deptDoc) {
    throw new ApiError(404, 'Department not found in institution');
  }
  if (req.user.role === 'hod' && String(department) !== String(req.user.department)) {
    throw new ApiError(403, 'You can only manage rooms in your own department');
  }
  if (!name || !code) {
    throw new ApiError(400, 'Room name and code are required');
  }
  if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1)) {
    throw new ApiError(400, 'Capacity must be a positive integer');
  }

  const room = await Room.create({
    department,
    name,
    code,
    capacity,
    institution: req.user.institution,
  });

  res.status(201).json({ success: true, data: room });
});

// List rooms scoped to institution (HOD: own department; no-department HOD sees nothing)
export const getAllRooms = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = tenantFilter(req);
  if (req.user.role === 'hod') {
    if (!req.user.department) {
      return pagedResponse(res, [], 0, { page, limit });
    }
    filter.department = req.user.department;
  }
  const [rooms, total] = await Promise.all([
    Room.find(filter).populate('department', 'name code').skip(skip).limit(limit),
    Room.countDocuments(filter),
  ]);

  pagedResponse(res, rooms, total, { page, limit });
});

// Get single room by ID (tenant-scoped; HOD cross-department reads as not-found)
export const getRoomById = asyncHandler(async (req, res) => {
  const room = await scopedOne(Room, req, req.params.id, { path: 'department', select: 'name code' });

  if (req.user.role === 'hod' && String(room.department?._id || room.department) !== String(req.user.department)) {
    throw new ApiError(404, 'Room not found');
  }

  res.json({ success: true, data: room });
});

// Update room (tenant-scoped, allowlisted)
export const updateRoom = asyncHandler(async (req, res) => {
  if (req.user.role === 'hod') {
    const existing = await Room.findOne({ _id: req.params.id, institution: req.user.institution });
    if (!existing || String(existing.department) !== String(req.user.department)) {
      throw new ApiError(404, 'Room not found');
    }
  }

  if (req.body.department) {
    if (!mongoose.isValidObjectId(req.body.department)) throw new ApiError(400, 'Invalid department ID');
    const deptDoc = await Department.findOne({ _id: req.body.department, institution: req.user.institution });
    if (!deptDoc) throw new ApiError(404, 'Department not found in institution');
    if (req.user.role === 'hod' && String(req.body.department) !== String(req.user.department)) {
      throw new ApiError(403, 'You can only manage rooms in your own department');
    }
  }

  if (req.body.capacity !== undefined && (!Number.isInteger(req.body.capacity) || req.body.capacity < 1)) {
    throw new ApiError(400, 'Capacity must be a positive integer');
  }

  const updates = pick(req.body, ['department', 'name', 'code', 'capacity', 'isActive']);
  const room = await Room.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    updates,
    { new: true, runValidators: true }
  );

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  res.json({ success: true, data: room });
});

// Delete room (tenant-scoped)
export const deleteRoom = asyncHandler(async (req, res) => {
  if (req.user.role === 'hod') {
    const existing = await Room.findOne({ _id: req.params.id, institution: req.user.institution });
    if (!existing || String(existing.department) !== String(req.user.department)) {
      throw new ApiError(404, 'Room not found');
    }
  }
  const room = await Room.findOneAndDelete({
    _id: req.params.id,
    institution: req.user.institution,
  });

  if (!room) {
    throw new ApiError(404, 'Room not found');
  }

  res.json({ success: true, message: 'Room deleted' });
});
