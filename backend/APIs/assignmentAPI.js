import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
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

// GET routes — all roles
assignmentApp.get('/', getAllAssignments);
assignmentApp.get('/:id', getAssignmentById);

// Write routes — restricted
assignmentApp.post('/', verifyToken('faculty'), createAssignment);
assignmentApp.patch('/:id', verifyToken('faculty'), updateAssignment);
assignmentApp.patch('/:id/status', verifyToken('faculty'), updateAssignmentStatus);
assignmentApp.delete('/:id', verifyToken('super_admin', 'college_admin', 'faculty'), deleteAssignment);

