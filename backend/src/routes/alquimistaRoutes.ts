import { Router } from 'express';
import {
  getAlquimistaActual,
  upsertAlquimista,
  deleteAlquimista,
} from '../controllers/alquimistaController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Obtener el Alquimista de la semana (requiere autenticación)
router.get('/', authenticateToken, getAlquimistaActual);

// Crear o actualizar Alquimista (solo admin)
router.post('/', authenticateToken, requireAdmin, upsertAlquimista);

// Eliminar Alquimista (solo admin)
router.delete('/', authenticateToken, requireAdmin, deleteAlquimista);

export default router;
