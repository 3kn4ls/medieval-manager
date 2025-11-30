import { Router } from 'express';
import { getSystemConfig, updateOrdersStatus } from '../controllers/systemConfigController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Obtener configuración del sistema (cualquier usuario autenticado puede verla)
router.get('/', authenticateToken, getSystemConfig);

// Actualizar estado de pedidos (solo admin)
router.patch('/orders', authenticateToken, requireAdmin, updateOrdersStatus);

export default router;
