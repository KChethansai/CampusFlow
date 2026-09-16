import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import {
  getAllInstitutions,
  getInstitutionById,
  createInstitution,
  updateInstitution,
  deleteInstitution,
} from '../controllers/institutioncontroller.js';

export const institutionApp = Router();

institutionApp.use(verifyToken());
institutionApp.use(auditLog);

institutionApp.get('/', getAllInstitutions);
institutionApp.get('/:id', getInstitutionById);

institutionApp.post('/', verifyToken('super_admin'), createInstitution);
institutionApp.patch('/:id', verifyToken('super_admin'), updateInstitution);
institutionApp.delete('/:id', verifyToken('super_admin'), deleteInstitution);
