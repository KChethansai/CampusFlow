import { AnnouncementModel as Announcement } from '../models/AnnouncementModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Create announcement
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { department, subject, title, body, pinned } = req.body;

  const announcement = await Announcement.create({
    institution: req.user.institution,
    department,
    subject,
    title,
    body,
    pinned,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: announcement });
});

// List all announcements scoped to institution
export const getAllAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({ institution: req.user.institution })
    .populate('createdBy');

  res.json({ success: true, data: announcements });
});

// Get single announcement by ID
export const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id)
    .populate('createdBy');

  if (!announcement) {
    throw new ApiError(404, 'Announcement not found');
  }

  res.json({ success: true, data: announcement });
});

// Update announcement
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!announcement) {
    throw new ApiError(404, 'Announcement not found');
  }

  res.json({ success: true, data: announcement });
});

// Delete announcement
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);

  if (!announcement) {
    throw new ApiError(404, 'Announcement not found');
  }

  res.json({ success: true, message: 'Announcement deleted' });
});
