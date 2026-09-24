import { NotificationModel as Notification } from '../models/NotificationModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { getNotificationPreferences, NOTIFICATION_CATEGORIES } from '../models/UserModel.js';
import { pageParams, pagedResponse } from '../utils/scope.js';

const channels = ['inApp', 'push', 'email'];

export const getMyNotificationPreferences = asyncHandler(async (req, res) => {
  res.json({ success: true, data: getNotificationPreferences(req.user.notificationPreferences) });
});

export const updateMyNotificationPreferences = asyncHandler(async (req, res) => {
  const { preferences } = req.body || {};
  if (Object.keys(req.body || {}).length !== 1 || !preferences || typeof preferences !== 'object' || Array.isArray(preferences) || !Object.keys(preferences).length) {
    throw new ApiError(400, 'preferences must contain notification category settings');
  }
  for (const [category, values] of Object.entries(preferences)) {
    if (!NOTIFICATION_CATEGORIES.includes(category) || !values || typeof values !== 'object' || Array.isArray(values) || !Object.keys(values).length || Object.keys(values).some((channel) => !channels.includes(channel) || typeof values[channel] !== 'boolean')) {
      throw new ApiError(400, 'Invalid notification preference');
    }
  }
  const updated = getNotificationPreferences(req.user.notificationPreferences);
  for (const [category, values] of Object.entries(preferences)) Object.assign(updated[category], values);
  req.user.notificationPreferences = updated;
  await req.user.save();
  res.json({ success: true, data: updated });
});

// Get current user's notifications (paginated; preference-filtered)
export const getMyNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort('-createdAt');
  const prefs = getNotificationPreferences(req.user.notificationPreferences);
  const visible = notifications.filter((notification) => prefs[notification.category || 'system'].inApp);
  pagedResponse(res, visible.slice(skip, skip + limit), visible.length, { page, limit });
});

// Mark notification as read — recipient-scoped so IDs can't be enumerated
// across users (IDOR guard).
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true },
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, data: notification });
});
