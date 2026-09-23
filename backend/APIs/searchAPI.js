import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyToken } from '../middlewares/verifyToken.js';
import { auditLog } from '../middlewares/auditLog.js';
import { globalSearch } from '../controllers/searchcontroller.js';

export const searchApp = Router();

// All routes require authentication; tight limit — typeahead fires often.
searchApp.use(verifyToken());
searchApp.use(auditLog);
searchApp.use(rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false }));

searchApp.get('/', globalSearch);
