import { Router } from 'express';
import {
  getIngredientes,
  getBocatasPredefinidos,
  getOrderWindowStatus,
} from '../controllers/menuController';

const router = Router();

router.get('/ingredientes', getIngredientes);
router.get('/bocatas-predefinidos', getBocatasPredefinidos);
router.get('/order-window', getOrderWindowStatus);

export default router;
