import { Router } from 'express';
import {
  getUltimoBocadilloUsuario,
  getBocadillosMasPedidosGlobal,
  getBocadillosMasPedidosUsuario,
  getEstadisticasGenerales,
  getAgrupacionPorIngredientesGlobal,
  getAgrupacionPorIngredientesUsuario,
} from '../controllers/estadisticasController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Obtener último bocadillo del usuario autenticado
router.get('/ultimo-bocadillo', authenticateToken, getUltimoBocadilloUsuario);

// Obtener bocadillos más pedidos globalmente
router.get('/mas-pedidos-global', authenticateToken, getBocadillosMasPedidosGlobal);

// Obtener bocadillos más pedidos por el usuario autenticado
router.get('/mas-pedidos-usuario', authenticateToken, getBocadillosMasPedidosUsuario);

// Obtener estadísticas generales
router.get('/generales', authenticateToken, getEstadisticasGenerales);

// Obtener agrupación global por conjunto de ingredientes
router.get('/agrupacion-ingredientes-global', authenticateToken, getAgrupacionPorIngredientesGlobal);

// Obtener agrupación del usuario por conjunto de ingredientes
router.get('/agrupacion-ingredientes-usuario', authenticateToken, getAgrupacionPorIngredientesUsuario);

export default router;
