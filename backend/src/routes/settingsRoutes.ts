import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Obtener configuración (público)
router.get('/', getSettings);

// Actualizar configuración (solo admin)
router.put('/', authenticateToken, requireAdmin, updateSettings);

export default router;
