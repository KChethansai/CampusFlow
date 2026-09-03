import { Router } from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/usercontroller.js';

export const userApp = Router();

// All routes require verifyToken() + verifyToken('super_admin', 'college_admin')
userApp.use(verifyToken('super_admin', 'college_admin'));

userApp.route('/')
  .get(getAllUsers)
  .post(createUser);

userApp.route('/:id')
  .get(getUserById)
  .patch(updateUser)
  .delete(deleteUser);

