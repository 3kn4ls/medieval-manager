import { Router } from 'express';
import {
  createBocadillo,
  getBocadillosSemanaActual,
  deleteBocadillo,
} from '../controllers/bocadilloController';
import { checkOrderWindow } from '../middleware/orderWindow';

const router = Router();

// Obtener bocadillos de la semana actual (siempre disponible)
router.get('/', getBocadillosSemanaActual);

// Crear bocadillo (solo dentro de la ventana de pedidos)
router.post('/', checkOrderWindow, createBocadillo);

// Eliminar bocadillo (solo dentro de la ventana de pedidos)
router.delete('/:id', checkOrderWindow, deleteBocadillo);

export default router;
