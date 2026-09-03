import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentcontroller.js';

export const departmentApp = Router();

// All routes require authentication
departmentApp.use(verifyToken());

// GET routes — all roles
departmentApp.get('/', getAllDepartments);
departmentApp.get('/:id', getDepartmentById);

// Write routes — restricted
departmentApp.post('/', verifyToken('super_admin', 'college_admin'), createDepartment);
departmentApp.patch('/:id', verifyToken('super_admin', 'college_admin'), updateDepartment);
departmentApp.delete('/:id', verifyToken('super_admin', 'college_admin'), deleteDepartment);

