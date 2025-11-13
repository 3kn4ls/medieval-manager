import { Router } from 'express';
import {
  getIngredientes,
  getBocatasPredefinidos,
  getOrderWindowStatus,
} from '../controllers/menuController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/ingredientes', authenticateToken, getIngredientes);
router.get('/bocatas-predefinidos', authenticateToken, getBocatasPredefinidos);
router.get('/order-window', authenticateToken, getOrderWindowStatus);

export default router;
