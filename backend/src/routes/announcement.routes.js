import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcement.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET routes — all roles
router.get('/', getAllAnnouncements);
router.get('/:id', getAnnouncementById);

// Write routes — restricted
router.post('/', restrictTo('faculty', 'college_admin'), createAnnouncement);
router.patch('/:id', restrictTo('faculty', 'college_admin'), updateAnnouncement);
router.delete('/:id', restrictTo('faculty', 'college_admin'), deleteAnnouncement);

export default router;
