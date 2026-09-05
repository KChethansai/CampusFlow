import { EventModel as Event } from '../models/EventModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick, scopedOne, tenantFilter } from '../utils/scope.js';

// Create event
export const createEvent = asyncHandler(async (req, res) => {
  const { department, title, description, type, startAt, endAt, visibility } = req.body;

  const event = await Event.create({
    institution: req.user.institution,
    department,
    title,
    description,
    type,
    startAt,
    endAt,
    visibility,
  });

  res.status(201).json({ success: true, data: event });
});

// List all events scoped to institution (paginated)
export const getAllEvents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = tenantFilter(req);
  const [events, total] = await Promise.all([
    Event.find(filter).skip(skip).limit(limit),
    Event.countDocuments(filter),
  ]);

  pagedResponse(res, events, total, { page, limit });
});

// Get single event by ID (tenant-scoped)
export const getEventById = asyncHandler(async (req, res) => {
  const event = await scopedOne(Event, req, req.params.id);

  res.json({ success: true, data: event });
});

// Update event (tenant-scoped, allowlisted)
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    pick(req.body, ['department', 'title', 'description', 'type', 'startAt', 'endAt', 'visibility']),
    {
      new: true,
      runValidators: true,
    }
  );

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  res.json({ success: true, data: event });
});

// Delete event (tenant-scoped)
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOneAndDelete({
    _id: req.params.id,
    institution: req.user.institution,
  });

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  res.json({ success: true, message: 'Event deleted' });
});

// Register a student for an event (tenant-scoped)
export const registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, institution: req.user.institution });

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // Avoid duplicate registration
  if (event.registeredStudents.includes(req.user._id)) {
    throw new ApiError(400, 'Already registered for this event');
  }

  event.registeredStudents.push(req.user._id);
  await event.save();

  res.json({ success: true, data: event });
});
