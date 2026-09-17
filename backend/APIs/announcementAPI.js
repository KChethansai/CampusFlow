import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementcontroller.js';

export const announcementApp = Router();

// All routes require authentication
announcementApp.use(verifyToken());
announcementApp.use(auditLog);

// GET routes — all roles
announcementApp.get('/', getAllAnnouncements);
announcementApp.get('/:id', getAnnouncementById);

// Write routes — restricted
announcementApp.post('/', verifyToken('super_admin', 'college_admin', 'faculty'), createAnnouncement);
announcementApp.patch('/:id', verifyToken('super_admin', 'college_admin', 'faculty'), updateAnnouncement);
announcementApp.delete('/:id', verifyToken('super_admin', 'college_admin', 'faculty'), deleteAnnouncement);

