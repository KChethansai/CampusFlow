import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/department.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET routes — all roles
router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);

// Write routes — restricted
router.post('/', restrictTo('super_admin', 'college_admin'), createDepartment);
router.patch('/:id', restrictTo('super_admin', 'college_admin'), updateDepartment);
router.delete('/:id', restrictTo('super_admin', 'college_admin'), deleteDepartment);

export default router;
