import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
} from '../controllers/event.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET routes — all roles
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Write routes — restricted
router.post('/', restrictTo('college_admin', 'faculty'), createEvent);
router.patch('/:id', restrictTo('college_admin', 'faculty'), updateEvent);
router.delete('/:id', restrictTo('college_admin', 'faculty'), deleteEvent);

// Student event registration
router.post('/:id/register', restrictTo('student'), registerForEvent);

export default router;
