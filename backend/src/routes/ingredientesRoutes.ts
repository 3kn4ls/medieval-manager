import { Router } from 'express';
import {
  getIngredientes,
  getIngredienteById,
  createIngrediente,
  updateIngrediente,
  deleteIngrediente,
  getCategorias,
} from '../controllers/ingredientesController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Rutas públicas (requieren autenticación pero no admin)
router.get('/', authenticateToken, getIngredientes);
router.get('/categorias/list', authenticateToken, getCategorias);
router.get('/:id', authenticateToken, getIngredienteById);

// Rutas protegidas (solo admin)
router.post('/', authenticateToken, requireAdmin, createIngrediente);
router.put('/:id', authenticateToken, requireAdmin, updateIngrediente);
router.delete('/:id', authenticateToken, requireAdmin, deleteIngrediente);

export default router;
