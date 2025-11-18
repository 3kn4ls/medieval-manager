import { Router } from 'express';
import {
  getAllIngredientes,
  getIngredientesDisponibles,
  createIngrediente,
  updateIngrediente,
  deleteIngrediente,
  initializeDefaultIngredientes,
} from '../controllers/ingredienteController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Rutas públicas (autenticadas)
router.get('/disponibles', authenticateToken, getIngredientesDisponibles);

// Rutas admin
router.get('/', authenticateToken, requireAdmin, getAllIngredientes);
router.post('/', authenticateToken, requireAdmin, createIngrediente);
router.post('/initialize', authenticateToken, requireAdmin, initializeDefaultIngredientes);
router.put('/:id', authenticateToken, requireAdmin, updateIngrediente);
router.delete('/:id', authenticateToken, requireAdmin, deleteIngrediente);

export default router;
