import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

export interface OcrApiResponse {
  success: boolean;
  data?: OcrResponseData;
  error?: string;
  message?: string;
}

export interface OcrApplyItem {
  bocadilloId: string;
  precio: number;
}

export interface OcrApplyResponseData {
  semana: number;
  ano: number;
  actualizados: OcrBocadilloActualizado[];
  errores: { bocadilloId: string; error: string }[];
}

export interface OcrApplyResponse {
  success: boolean;
  data?: OcrApplyResponseData;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class OcrPriceService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  analyzePrices(imagen: Blob): Observable<OcrApiResponse> {
    const formData = new FormData();
    formData.append('imagen', imagen, 'precios.jpg');
    return this.http.post<OcrApiResponse>(`${this.apiUrl}/admin/ocr-precios`, formData);
  }

  applyPrices(asignaciones: OcrApplyItem[]): Observable<OcrApplyResponse> {
    return this.http.post<OcrApplyResponse>(`${this.apiUrl}/admin/ocr-precios/apply`, { asignaciones });
  }

  testOcr(imagen: Blob): Observable<OcrTestResponse> {
    const formData = new FormData();
    formData.append('imagen', imagen, 'test.jpg');
    return this.http.post<OcrTestResponse>(`${this.apiUrl}/admin/ocr-test`, formData);
  }
}

export interface OcrPrecioEncontrado {
  texto: string;
  precio: number;
}

export interface OcrTestData {
  rawResponse: string;
  textoExtraido: string;
  preciosEncontrados: OcrPrecioEncontrado[];
  modeloUsado: string;
  tiempoMs: number;
  tokensPrompt?: number;
  tokensCompletion?: number;
  tokensTotal?: number;
  finishReason?: string;
  nombreArchivo: string;
  tamanoBytes: number;
}

export interface OcrTestResponse {
  success: boolean;
  data?: OcrTestData;
  error?: string;
}
