import { createEvent as createIcs } from 'ics';
import { EventModel as Event } from '../models/EventModel.js';
import { DepartmentModel as Department } from '../models/DepartmentModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick, scopedOne, tenantFilter } from '../utils/scope.js';

export const eventAudienceFilter = (user) => {
  const base = { institution: user.institution };
  if (['super_admin', 'college_admin'].includes(user.role)) {
    return base;
  }
  const visibilityConditions = [
    { visibility: { $in: ['public', 'internal'] } },
    { visibility: { $exists: false } },
    { visibility: null }
  ];
  if (user.department) {
    visibilityConditions.push({ visibility: 'department', department: user.department });
  }
  return { ...base, $or: visibilityConditions };
};

// GET /:id/ics — tenant-scoped calendar download (must sit before nothing;
// route order handled in eventAPI).
export const exportEventIcs = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...eventAudienceFilter(req.user) };
  const event = await Event.findOne(filter);
  if (!event) throw new ApiError(404, 'Event not found');
  const start = event.startAt ? new Date(event.startAt) : new Date();
  const end = event.endAt ? new Date(event.endAt) : new Date(start.getTime() + 3600000);
  const toArr = (d) => [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
  const { error, value } = createIcs({
    title: event.title,
    description: event.description || '',
    start: toArr(start),
    end: toArr(end),
    status: 'CONFIRMED'
  });
  if (error) throw new ApiError(500, 'Could not build calendar file');
  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', `attachment; filename="event-${event._id}.ics"`);
  res.send(value);
});

const sanitizeEventResponse = (event, user) => {
  if (!event) return event;
  const obj = typeof event.toObject === 'function' ? event.toObject() : { ...event };
  const isAdmin = ['super_admin', 'college_admin'].includes(user.role);
  obj.registrationCount = obj.registeredStudents?.length || 0;
  obj.isRegistered = Boolean(obj.registeredStudents?.some((id) => String(id) === String(user._id)));
  if (!isAdmin) {
    delete obj.registeredStudents;
  }
  return obj;
};

// Create event
export const createEvent = asyncHandler(async (req, res) => {
  const { department, title, description, type, startAt, endAt, visibility } = req.body;
  const isSuperOrCollegeAdmin = ['super_admin', 'college_admin'].includes(req.user.role);

  let assignedDepartment;
  if (isSuperOrCollegeAdmin) {
    assignedDepartment = department;
  } else {
    if (!req.user.department) {
      throw new ApiError(403, 'Faculty must belong to a department to manage events');
    }
    if (department && String(department) !== String(req.user.department)) {
      throw new ApiError(403, 'Faculty can only create events for their own department');
    }
    assignedDepartment = req.user.department;
  }

  if (assignedDepartment) {
    const deptDoc = await Department.findOne({ _id: assignedDepartment, institution: req.user.institution });
    if (!deptDoc) {
      throw new ApiError(400, 'Department does not exist in this institution');
    }
  }

  const event = await Event.create({
    institution: req.user.institution,
    department: assignedDepartment,
    title,
    description,
    type,
    startAt,
    endAt,
    visibility: visibility || 'public',
  });

  res.status(201).json({ success: true, data: sanitizeEventResponse(event, req.user) });
});

// List all events scoped to institution and audience (paginated)
export const getAllEvents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = eventAudienceFilter(req.user);
  const [events, total] = await Promise.all([
    Event.find(filter).skip(skip).limit(limit),
    Event.countDocuments(filter),
  ]);

  const sanitized = events.map((e) => sanitizeEventResponse(e, req.user));
  pagedResponse(res, sanitized, total, { page, limit });
});

// Get single event by ID (tenant + audience scoped)
export const getEventById = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...eventAudienceFilter(req.user) };
  const event = await Event.findOne(filter);
  if (!event) throw new ApiError(404, 'Event not found');

  res.json({ success: true, data: sanitizeEventResponse(event, req.user) });
});

// Update event (tenant-scoped, allowlisted)
export const updateEvent = asyncHandler(async (req, res) => {
  const isSuperOrCollegeAdmin = ['super_admin', 'college_admin'].includes(req.user.role);

  if (!isSuperOrCollegeAdmin) {
    if (!req.user.department) {
      throw new ApiError(403, 'Faculty must belong to a department to manage events');
    }
    if (req.body.department && String(req.body.department) !== String(req.user.department)) {
      throw new ApiError(403, 'Faculty cannot move event to another department');
    }
  }

  const filter = { _id: req.params.id, institution: req.user.institution };
  if (!isSuperOrCollegeAdmin) {
    filter.department = req.user.department;
  }

  if (req.body.department && isSuperOrCollegeAdmin) {
    const deptDoc = await Department.findOne({ _id: req.body.department, institution: req.user.institution });
    if (!deptDoc) {
      throw new ApiError(400, 'Department does not exist in this institution');
    }
  }

  const event = await Event.findOneAndUpdate(
    filter,
    pick(req.body, ['department', 'title', 'description', 'type', 'startAt', 'endAt', 'visibility']),
    {
      new: true,
      runValidators: true,
    }
  );

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  res.json({ success: true, data: sanitizeEventResponse(event, req.user) });
});

// Delete event (tenant-scoped)
export const deleteEvent = asyncHandler(async (req, res) => {
  const isSuperOrCollegeAdmin = ['super_admin', 'college_admin'].includes(req.user.role);

  if (!isSuperOrCollegeAdmin && !req.user.department) {
    throw new ApiError(403, 'Faculty must belong to a department to manage events');
  }

  const filter = { _id: req.params.id, institution: req.user.institution };
  if (!isSuperOrCollegeAdmin) {
    filter.department = req.user.department;
  }
  const event = await Event.findOneAndDelete(filter);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  res.json({ success: true, message: 'Event deleted' });
});

// Register a student for an event (tenant + audience scoped)
export const registerForEvent = asyncHandler(async (req, res) => {
  const filter = { _id: req.params.id, ...eventAudienceFilter(req.user) };
  const event = await Event.findOne(filter);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Avoid duplicate registration
  if (event.registeredStudents.some((id) => String(id) === String(req.user._id))) {
    throw new ApiError(400, 'Already registered for this event');
  }

  event.registeredStudents.push(req.user._id);
  await event.save();

  res.json({ success: true, data: sanitizeEventResponse(event, req.user) });
});
