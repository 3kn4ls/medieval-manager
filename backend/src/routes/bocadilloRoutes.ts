import { Router } from 'express';
import {
  createBocadillo,
  getBocadillosSemanaActual,
  updateBocadillo,
  deleteBocadillo,
} from '../controllers/bocadilloController';
import { checkOrderWindow } from '../middleware/orderWindow';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Obtener bocadillos de la semana actual (requiere autenticación)
router.get('/', authenticateToken, getBocadillosSemanaActual);

// Crear bocadillo (requiere autenticación y ventana abierta)
router.post('/', authenticateToken, checkOrderWindow, createBocadillo);

// Actualizar bocadillo (requiere autenticación y ventana abierta)
router.put('/:id', authenticateToken, checkOrderWindow, updateBocadillo);

// Eliminar bocadillo (requiere autenticación y ventana abierta)
router.delete('/:id', authenticateToken, checkOrderWindow, deleteBocadillo);

export default router;
