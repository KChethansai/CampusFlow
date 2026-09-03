import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
} from '../controllers/eventcontroller.js';

export const eventApp = Router();

// All routes require authentication
eventApp.use(verifyToken());

// GET routes — all roles
eventApp.get('/', getAllEvents);
eventApp.get('/:id', getEventById);

// Write routes — restricted
eventApp.post('/', verifyToken('college_admin', 'faculty'), createEvent);
eventApp.patch('/:id', verifyToken('college_admin', 'faculty'), updateEvent);
eventApp.delete('/:id', verifyToken('college_admin', 'faculty'), deleteEvent);

// Student event registration
eventApp.post('/:id/register', verifyToken('student'), registerForEvent);

