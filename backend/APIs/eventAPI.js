import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  exportEventIcs,
} from '../controllers/eventcontroller.js';

export const eventApp = Router();

// All routes require authentication
eventApp.use(verifyToken());
eventApp.use(auditLog);

// GET routes — all roles (ics before :id so "ics" never parses as an id)
eventApp.get('/', getAllEvents);
eventApp.get('/:id/ics', exportEventIcs);
eventApp.get('/:id', getEventById);

// Write routes — restricted
eventApp.post('/', verifyToken('super_admin', 'college_admin', 'faculty'), createEvent);
eventApp.patch('/:id', verifyToken('super_admin', 'college_admin', 'faculty'), updateEvent);
eventApp.delete('/:id', verifyToken('super_admin', 'college_admin', 'faculty'), deleteEvent);

// Student event registration
eventApp.post('/:id/register', verifyToken('student'), registerForEvent);

