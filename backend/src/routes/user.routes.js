import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { restrictTo } from '../middleware/rbac.js';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';

const router = Router();

// All routes require protect + restrictTo('super_admin', 'college_admin')
router.use(protect, restrictTo('super_admin', 'college_admin'));

router.route('/')
  .get(getAllUsers)
  .post(createUser);

router.route('/:id')
  .get(getUserById)
  .patch(updateUser)
  .delete(deleteUser);

export default router;
