import { RequestModel as Request } from '../models/RequestModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { cleanUrlArray } from '../utils/sanitize.js';

// Student submits a new request
export const createRequest = asyncHandler(async (req, res) => {
  const { department, type, title, description, attachments } = req.body;

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

// List requests — students see only their own; others see all within institution
export const getAllRequests = asyncHandler(async (req, res) => {
  const filter = { institution: req.user.institution };

  if (req.user.role === 'student') {
    filter.student = req.user._id;
  }

  const requests = await Request.find(filter)
    .populate('student')
    .populate('assignedTo');

  res.json({ success: true, data: requests });
});

// Get single request by ID (tenant-scoped; students see only their own)
export const getRequestById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, institution: req.user.institution };
  if (req.user.role === 'student') filter.student = req.user._id;
  const request = await Request.findOne(filter)
    .populate('student')
    .populate('assignedTo');

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
  const { status, remarks, assignedTo, resolution } = req.body;

  const request = await Request.findOne({ _id: req.params.id, institution: req.user.institution });

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (status && status !== request.status) {
    const allowed = REQUEST_TRANSITIONS[request.status] || [];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `Invalid status transition from ${request.status} to ${status}`);
    }
    request.status = status;
  }
  if (assignedTo) {
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

  res.json({ success: true, data: request });
});
