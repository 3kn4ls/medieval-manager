import { Router } from 'express';
import {
  createBocadillo,
  getBocadillosSemanaActual,
  updateBocadillo,
  deleteBocadillo,
} from '../controllers/bocadilloController';
import { checkOrderWindow } from '../middleware/orderWindow';

const router = Router();

// Obtener bocadillos de la semana actual (siempre disponible)
router.get('/', getBocadillosSemanaActual);

// Crear bocadillo (solo dentro de la ventana de pedidos)
router.post('/', checkOrderWindow, createBocadillo);

// Actualizar bocadillo (solo dentro de la ventana de pedidos)
router.put('/:id', checkOrderWindow, updateBocadillo);

// Eliminar bocadillo (solo dentro de la ventana de pedidos)
router.delete('/:id', checkOrderWindow, deleteBocadillo);

export default router;
