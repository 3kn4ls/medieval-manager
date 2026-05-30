import { Router } from 'express';
import multer from 'multer';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { postOcrPrecios, postOcrApply } from '../controllers/adminController';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Todas las rutas de admin requieren autenticación + rol admin
router.use(authenticateToken, requireAdmin);

// POST /api/admin/ocr-precios — Analizar imagen de precios (sin guardar)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/ocr-precios', upload.single('imagen') as any, postOcrPrecios as any);

// POST /api/admin/ocr-precios/apply — Aplicar precios confirmados
router.post('/ocr-precios/apply', postOcrApply as any);

export default router;
