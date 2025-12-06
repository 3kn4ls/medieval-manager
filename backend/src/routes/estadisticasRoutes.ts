import { Router } from 'express';
import {
  getUltimoBocadilloUsuario,
  getBocadillosMasPedidosGlobal,
  getBocadillosMasPedidosUsuario,
  getEstadisticasGenerales,
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

export default router;
