import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subjectcontroller.js';

export const subjectApp = Router();

// All routes require authentication
subjectApp.use(verifyToken());
subjectApp.use(auditLog);

// GET routes — all roles
subjectApp.get('/', getAllSubjects);
subjectApp.get('/:id', getSubjectById);

// Write routes — restricted
subjectApp.post('/', verifyToken('super_admin', 'college_admin'), createSubject);
subjectApp.patch('/:id', verifyToken('super_admin', 'college_admin'), updateSubject);
subjectApp.delete('/:id', verifyToken('super_admin', 'college_admin'), deleteSubject);

