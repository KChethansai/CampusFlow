import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  updateAssignmentStatus,
} from '../controllers/assignmentcontroller.js';

export const assignmentApp = Router();

// All routes require authentication
assignmentApp.use(verifyToken());
assignmentApp.use(auditLog);

// GET routes — all roles
assignmentApp.get('/', getAllAssignments);
assignmentApp.get('/:id', getAssignmentById);

// Write routes — restricted (HOD scoped to own department in controller)
assignmentApp.post('/', verifyToken('super_admin', 'college_admin', 'faculty', 'hod'), createAssignment);
assignmentApp.patch('/:id', verifyToken('super_admin', 'college_admin', 'faculty', 'hod'), updateAssignment);
assignmentApp.patch('/:id/status', verifyToken('super_admin', 'college_admin', 'faculty', 'hod'), updateAssignmentStatus);
assignmentApp.delete('/:id', verifyToken('super_admin', 'college_admin', 'faculty', 'hod'), deleteAssignment);

