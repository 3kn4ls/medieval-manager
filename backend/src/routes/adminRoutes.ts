import { Router, Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { postOcrPrecios, postOcrApply, postOcrTest } from '../controllers/adminController';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Envuelve multer para devolver errores legibles (p.ej. imagen > 10MB)
// en lugar de caer en el manejador global con un 500 genérico.
const uploadImagen = (req: Request, res: Response, next: NextFunction) => {
  upload.single('imagen')(req as any, res as any, (err: any) => {
    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          error: 'La imagen es demasiado grande. Máximo 10 MB.',
        });
      }
      return res.status(400).json({
        success: false,
        error: `Error al procesar la imagen: ${err.message}`,
      });
    }
    if (err) return next(err);
    next();
  });
};

// Todas las rutas de admin requieren autenticación + rol admin
router.use(authenticateToken, requireAdmin);

// POST /api/admin/ocr-precios — Analizar imagen de precios (sin guardar)
router.post('/ocr-precios', uploadImagen, postOcrPrecios as any);

// POST /api/admin/ocr-precios/apply — Aplicar precios confirmados
router.post('/ocr-precios/apply', postOcrApply as any);

// POST /api/admin/ocr-test — Debug: analizar imagen sin contexto de bocadillos
router.post('/ocr-test', uploadImagen, postOcrTest as any);

export default router;
