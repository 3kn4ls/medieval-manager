/**
 * Tipos para el módulo OCR de precios.
 */

export interface BocadilloContext {
  id: string;
  nombre: string;
  tamano: string;
  tipoPan: string;
  ingredientes: string[];
  precioEstimado: number;
  bocataPredefinido?: string;
}

export interface OcrAsignacion {
  bocadilloId: string;
  precio: number;
  confianza: 'alta' | 'media' | 'baja';
}

export interface OcrResultado {
  asignaciones: OcrAsignacion[];
  noMapeados: string[];
  preciosNoAsignados: string[];
}

export interface OcrBocadilloActualizado {
  bocadilloId: string;
  nombre: string;
  precioAnterior: number | null;
  precioNuevo: number;
  confianza: 'alta' | 'media' | 'baja';
}

export interface OcrBocadilloNoMapeado {
  bocadilloId: string;
  nombre: string;
  motivo: string;
}

export interface OcrPrecioNoAsignado {
  entrada: string;
  motivo: string;
}

export interface OcrResponseData {
  semana: number;
  ano: number;
  actualizados: OcrBocadilloActualizado[];
  noMapeados: OcrBocadilloNoMapeado[];
  preciosNoAsignados: OcrPrecioNoAsignado[];
  textoRespuesta: string;
}

export interface OcrApplyItem {
  bocadilloId: string;
  precio: number;
}

export interface OcrApplyPayload {
  asignaciones: OcrApplyItem[];
}
