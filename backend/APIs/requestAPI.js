import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
} from '../controllers/requestcontroller.js';

export const requestApp = Router();

// All routes require authentication
requestApp.use(verifyToken());
requestApp.use(auditLog);

// GET routes — all roles (controller filters by role)
requestApp.get('/', getAllRequests);
requestApp.get('/:id', getRequestById);

// POST — students only
requestApp.post('/', verifyToken('student'), createRequest);

// PATCH status — faculty and college_admin
requestApp.patch('/:id/status', verifyToken('faculty', 'college_admin'), updateRequestStatus);

