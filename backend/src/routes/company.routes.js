import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../controllers/company.controller.js';

const router = Router();

// All routes require authentication
router.use(protect);

// GET routes — all roles
router.get('/', getAllCompanies);
router.get('/:id', getCompanyById);

// Write routes — restricted
router.post('/', restrictTo('super_admin', 'college_admin', 'placement_officer'), createCompany);
router.patch('/:id', restrictTo('super_admin', 'college_admin', 'placement_officer'), updateCompany);
router.delete('/:id', restrictTo('super_admin', 'college_admin', 'placement_officer'), deleteCompany);

export default router;
