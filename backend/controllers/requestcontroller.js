import { RequestModel as Request } from '../models/RequestModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

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
    attachments,
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

// Get single request by ID
export const getRequestById = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id)
    .populate('student')
    .populate('assignedTo');

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  res.json({ success: true, data: request });
});

// Faculty/admin update request status
export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status, remarks, assignedTo, resolution } = req.body;

  const request = await Request.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, 'Request not found');
  }

  if (status) {
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
