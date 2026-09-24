import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/roomcontroller.js';

export const roomApp = Router();

// All routes require authentication
roomApp.use(verifyToken());
roomApp.use(auditLog);

// GET routes — all roles
roomApp.get('/', getAllRooms);
roomApp.get('/:id', getRoomById);

// Write routes — restricted (HOD scoped to own department in controller)
roomApp.post('/', verifyToken('super_admin', 'college_admin', 'hod'), createRoom);
roomApp.patch('/:id', verifyToken('super_admin', 'college_admin', 'hod'), updateRoom);
roomApp.delete('/:id', verifyToken('super_admin', 'college_admin', 'hod'), deleteRoom);
