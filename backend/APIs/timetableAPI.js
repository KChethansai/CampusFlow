import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getAllTimetableEntries,
  getTimetableEntryById,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
} from '../controllers/timetablecontroller.js';

export const timetableApp = Router();

// All routes require authentication
timetableApp.use(verifyToken());
timetableApp.use(auditLog);

// GET routes — all roles (role-scoped in controller)
timetableApp.get('/', getAllTimetableEntries);
timetableApp.get('/:id', getTimetableEntryById);

// Write routes — restricted (HOD scoped to own department in controller)
timetableApp.post('/', verifyToken('super_admin', 'college_admin', 'hod'), createTimetableEntry);
timetableApp.patch('/:id', verifyToken('super_admin', 'college_admin', 'hod'), updateTimetableEntry);
timetableApp.delete('/:id', verifyToken('super_admin', 'college_admin', 'hod'), deleteTimetableEntry);
