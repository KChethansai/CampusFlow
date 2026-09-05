import { AnnouncementModel as Announcement } from '../models/AnnouncementModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { pageParams, pagedResponse, pick, scopedOne, tenantFilter } from '../utils/scope.js';

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

// List all announcements scoped to institution (paginated)
export const getAllAnnouncements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const filter = tenantFilter(req);
  const [announcements, total] = await Promise.all([
    Announcement.find(filter).populate('createdBy').skip(skip).limit(limit),
    Announcement.countDocuments(filter),
  ]);

  pagedResponse(res, announcements, total, { page, limit });
});

// Get single announcement by ID (tenant-scoped)
export const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await scopedOne(Announcement, req, req.params.id, 'createdBy');

  res.json({ success: true, data: announcement });
});

// Update announcement (tenant-scoped, allowlisted)
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    pick(req.body, ['department', 'subject', 'title', 'body', 'pinned']),
    {
      new: true,
      runValidators: true,
    }
  );

  if (!announcement) {
    throw new ApiError(404, 'Announcement not found');
  }

  res.json({ success: true, data: announcement });
});

// Delete announcement (tenant-scoped)
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findOneAndDelete({
    _id: req.params.id,
    institution: req.user.institution,
  });

  if (!announcement) {
    throw new ApiError(404, 'Announcement not found');
  }

  res.json({ success: true, message: 'Announcement deleted' });
});
