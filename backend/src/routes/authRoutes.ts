import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

// Admin routes
router.get('/users', authenticateToken, requireAdmin, getAllUsers);
router.post('/users', authenticateToken, requireAdmin, createUser);
router.put('/users/:id', authenticateToken, requireAdmin, updateUser);
router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);

export default router;
