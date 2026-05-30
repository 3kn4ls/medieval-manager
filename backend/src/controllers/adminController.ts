import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Bocadillo from '../models/Bocadillo';
import { getTargetWeek } from '../utils/dateUtils';
import { analyzePriceImage } from '../services/ocrPriceService';
import {
  BocadilloContext,
  OcrResponseData,
  OcrApplyPayload,
} from '../types/ocr';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

/**
 * POST /api/admin/ocr-precios
 * Analiza la imagen con el LLM y devuelve las asignaciones sugeridas.
 * NO guarda los precios en base de datos — solo sugiere.
 */
export const postOcrPrecios = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No se ha enviado ninguna imagen',
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de imagen no soportado. Usa JPEG o PNG.',
      });
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return res.status(400).json({
        success: false,
        error: 'La imagen es demasiado grande. Máximo 10 MB.',
      });
    }

    const imagenBase64 = file.buffer.toString('base64');

    const { week, year } = getTargetWeek(new Date());
    const bocadillos = await Bocadillo.find({ semana: week, ano: year }).sort({ fechaCreacion: -1 });

    if (bocadillos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay bocadillos en la semana actual para asignar precios',
      });
    }

    const contexto: BocadilloContext[] = bocadillos.map((b) => ({
      id: b._id.toString(),
      nombre: b.nombre,
      tamano: b.tamano,
      tipoPan: b.tipoPan,
      ingredientes: b.ingredientes,
      precioEstimado: b.precioEstimado || 0,
      bocataPredefinido: b.bocataPredefinido,
    }));

    // Llamar al servicio OCR (solo análisis, sin guardar)
    const { resultado, rawResponse } = await analyzePriceImage(imagenBase64, file.mimetype, contexto);

    // Construir respuesta sin aplicar cambios en DB
    const actualizados: OcrResponseData['actualizados'] = [];
    const noMapeados: OcrResponseData['noMapeados'] = [];

    for (const asignacion of resultado.asignaciones) {
      const bocadillo = bocadillos.find((b) => b._id.toString() === asignacion.bocadilloId);
      if (!bocadillo) continue;

      actualizados.push({
        bocadilloId: asignacion.bocadilloId,
        nombre: bocadillo.nombre,
        precioAnterior: bocadillo.precio ?? null,
        precioNuevo: asignacion.precio,
        confianza: asignacion.confianza,
      });
    }

    for (const id of resultado.noMapeados) {
      const bocadillo = bocadillos.find((b) => b._id.toString() === id);
      noMapeados.push({
        bocadilloId: id,
        nombre: bocadillo?.nombre || 'Desconocido',
        motivo: 'No se encontró correspondencia en la imagen',
      });
    }

    const preciosNoAsignados = resultado.preciosNoAsignados.map((entrada) => ({
      entrada,
      motivo: 'No coincide con ningún pedido de la semana',
    }));

    const responseData: OcrResponseData = {
      semana: week,
      ano: year,
      actualizados,
      noMapeados,
      preciosNoAsignados,
      textoRespuesta: rawResponse,
    };

    res.json({ success: true, data: responseData });
  } catch (error: any) {
    console.error('Error en OCR de precios:', error);

    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return res.status(504).json({
        success: false,
        error: 'El modelo de IA tardó demasiado en responder. Intenta con una imagen más clara.',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al analizar la imagen',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * POST /api/admin/ocr-precios/apply
 * Recibe las asignaciones confirmadas por el admin y las guarda en BD.
 */
export const postOcrApply = async (req: Request, res: Response) => {
  try {
    const { asignaciones } = req.body as OcrApplyPayload;

    if (!asignaciones || !Array.isArray(asignaciones) || asignaciones.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El array de asignaciones es requerido',
      });
    }

    const { week, year } = getTargetWeek(new Date());
    const actualizados: OcrResponseData['actualizados'] = [];
    const errores: { bocadilloId: string; error: string }[] = [];

    for (const item of asignaciones) {
      if (!item.bocadilloId || typeof item.precio !== 'number' || item.precio < 0) {
        errores.push({
          bocadilloId: item.bocadilloId || 'desconocido',
          error: 'Datos inválidos (precio requerido y debe ser >= 0)',
        });
        continue;
      }

      const bocadillo = await Bocadillo.findOne({
        _id: item.bocadilloId,
        semana: week,
        ano: year,
      });

      if (!bocadillo) {
        errores.push({
          bocadilloId: item.bocadilloId,
          error: 'Bocadillo no encontrado en la semana actual',
        });
        continue;
      }

      const precioAnterior = bocadillo.precio ?? null;
      bocadillo.precio = Math.round(item.precio * 100) / 100;
      await bocadillo.save();

      actualizados.push({
        bocadilloId: item.bocadilloId,
        nombre: bocadillo.nombre,
        precioAnterior,
        precioNuevo: bocadillo.precio,
        confianza: 'alta',
      });
    }

    res.json({
      success: true,
      data: {
        semana: week,
        ano: year,
        actualizados,
        errores,
      },
    });
  } catch (error: any) {
    console.error('Error aplicando precios OCR:', error);
    res.status(500).json({
      success: false,
      error: 'Error al aplicar los precios',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
