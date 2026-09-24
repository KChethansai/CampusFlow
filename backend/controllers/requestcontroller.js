import mongoose from 'mongoose';
import { RequestModel as Request } from '../models/RequestModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { UserModel as User } from '../models/UserModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { cleanUrlArray } from '../utils/sanitize.js';
import { publishRealtimeToInstitution, publishRealtimeToUser } from '../services/notification.service.js';

// Student submits a new request
export const createRequest = asyncHandler(async (req, res) => {
  const { department, type, title, description, attachments } = req.body;

  if (department) {
    if (!mongoose.isValidObjectId(department)) {
      throw new ApiError(400, 'Invalid department ID');
    }
    const deptDoc = await Department.findOne({ _id: department, institution: req.user.institution });
    if (!deptDoc) {
      throw new ApiError(400, 'Department does not exist in this institution');
    }
  }

  const request = await Request.create({
    institution: req.user.institution,
    student: req.user._id,
    department,
    type,
    title,
    description,
    attachments: cleanUrlArray(attachments),
    status: 'pending',
    timeline: [
      {
        status: 'pending',
        remarks: 'Request submitted',
        updatedBy: req.user._id,
        at: new Date(),
      },
    ],
  });

  res.status(201).json({ success: true, data: request });
});

// List requests — students see only their own; HOD sees only their own
// department; others see all within institution
export const getAllRequests = asyncHandler(async (req, res) => {
  const filter = { institution: req.user.institution };

  if (req.user.role === 'student') {
    filter.student = req.user._id;
  } else if (req.user.role === 'hod') {
    if (!req.user.department) return res.json({ success: true, data: [] });
    filter.department = req.user.department;
  }

  const requests = await Request.find(filter)
    .populate('student', 'name email role department')
    .populate('assignedTo', 'name email role');

  res.json({ success: true, data: requests });
});

// Get single request by ID (tenant-scoped; students see only their own)
export const getRequestById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid request ID');
  }

  const filter = { _id: req.params.id, institution: req.user.institution };
  if (req.user.role === 'student') filter.student = req.user._id;
  if (req.user.role === 'hod') {
    if (!req.user.department) throw new ApiError(404, 'Request not found');
    filter.department = req.user.department;
  }
  const request = await Request.findOne(filter)
    .populate('student', 'name email role department')
    .populate('assignedTo', 'name email role');

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  res.json({ success: true, data: request });
});

const REQUEST_TRANSITIONS = {
  pending: ['in_review', 'approved', 'rejected'],
  in_review: ['approved', 'rejected'],
  approved: [],
  rejected: []
};

// Faculty/admin update request status (tenant-scoped, guarded transitions)
export const updateRequestStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid request ID');
  }

  const { status, remarks, assignedTo, resolution } = req.body;

  const request = await Request.findOne({ _id: req.params.id, institution: req.user.institution });

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  // HOD may review only requests in their own department (no oracle leak).
  if (req.user.role === 'hod') {
    if (!req.user.department || String(request.department) !== String(req.user.department)) {
      throw new ApiError(404, 'Request not found');
    }
  }

  if (status && status !== request.status) {
    const allowed = REQUEST_TRANSITIONS[request.status] || [];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `Invalid status transition from ${request.status} to ${status}`);
    }
    request.status = status;
  }
  if (assignedTo) {
    if (!mongoose.isValidObjectId(assignedTo)) {
      throw new ApiError(400, 'Invalid assignedTo ID');
    }
    const staff = await User.findOne({ _id: assignedTo, institution: req.user.institution });
    if (!staff) {
      throw new ApiError(400, 'Assigned staff does not exist in this institution');
    }
    if (!['hod', 'faculty', 'college_admin', 'super_admin'].includes(staff.role)) {
      throw new ApiError(400, 'Assigned user must be an authorized staff or faculty member');
    }
    request.assignedTo = assignedTo;
  }
  if (resolution) {
    request.resolution = resolution;
  }

  // Push timeline entry
  request.timeline.push({
    status: status || request.status,
    remarks: remarks || '',
    updatedBy: req.user._id,
    at: new Date(),
  });

  await request.save();

  publishRealtimeToUser(request.student, 'request:updated', { request }); // live status for owner
  publishRealtimeToInstitution(req.user.institution, 'request:updated', { requestId: request._id, status: request.status }); // live queue for staff
  res.json({ success: true, data: request });
});
