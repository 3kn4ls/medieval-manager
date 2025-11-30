import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  sendManualNotification,
} from '../controllers/pushController';

const router = Router();

// Obtener clave pública VAPID (público)
router.get('/vapid-public-key', getVapidPublicKey);

// Suscribirse a notificaciones (requiere autenticación)
router.post('/subscribe', authenticateToken, subscribe);

// Cancelar suscripción (requiere autenticación)
router.post('/unsubscribe', authenticateToken, unsubscribe);

// Enviar notificación manual (solo admin)
router.post('/send', authenticateToken, requireAdmin, sendManualNotification);

export default router;
