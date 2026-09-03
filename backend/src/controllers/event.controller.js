import Event from '../models/Event.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

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

// List all events scoped to institution
export const getAllEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ institution: req.user.institution });

  res.json({ success: true, data: events });
});

// Get single event by ID
export const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  res.json({ success: true, data: event });
});

// Update event
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  res.json({ success: true, data: event });
});

// Delete event
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  res.json({ success: true, message: 'Event deleted' });
});

// Register a student for an event
export const registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

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
