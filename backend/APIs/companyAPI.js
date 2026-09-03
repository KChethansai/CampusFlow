import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../controllers/companycontroller.js';

export const companyApp = Router();

// All routes require authentication
companyApp.use(verifyToken());

// GET routes — all roles
companyApp.get('/', getAllCompanies);
companyApp.get('/:id', getCompanyById);

// Write routes — restricted
companyApp.post('/', verifyToken('super_admin', 'college_admin', 'placement_officer'), createCompany);
companyApp.patch('/:id', verifyToken('super_admin', 'college_admin', 'placement_officer'), updateCompany);
companyApp.delete('/:id', verifyToken('super_admin', 'college_admin', 'placement_officer'), deleteCompany);

