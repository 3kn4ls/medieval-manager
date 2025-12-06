import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Bocadillo, ApiResponse } from '../models/bocadillo.model';

export interface IngredienteStats {
  ingrediente: string;
  count: number;
}

export interface BocataStats {
  bocata: string;
  count: number;
}

export interface TamanoStats {
  tamano: string;
  count: number;
}

export interface PanStats {
  tipoPan: string;
  count: number;
}

export interface EstadisticasGlobales {
  topIngredientes: IngredienteStats[];
  topBocatasPredefinidas: BocataStats[];
  distribucionTamano: TamanoStats[];
  distribucionPan: PanStats[];
}

export interface EstadisticasUsuario {
  totalBocadillos: number;
  topIngredientes: IngredienteStats[];
  topBocatasPredefinidas: BocataStats[];
  distribucionTamano: TamanoStats[];
  distribucionPan: PanStats[];
}

export interface TendenciaSemanal {
  semana: number;
  ano: number;
  count: number;
}

export interface EstadisticasGenerales {
  totalBocadillos: number;
  totalBocadillosUsuario: number;
  bocadillosSemana: number;
  bocadillosSemanaUsuario: number;
  gastoTotalUsuario: number;
  tendenciaSemanal: TendenciaSemanal[];
}

@Injectable({
  providedIn: 'root',
})
export class EstadisticasService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getUltimoBocadilloUsuario(): Observable<ApiResponse<Bocadillo>> {
    return this.http.get<ApiResponse<Bocadillo>>(
      `${this.apiUrl}/estadisticas/ultimo-bocadillo`
    );
  }

  getBocadillosMasPedidosGlobal(): Observable<ApiResponse<EstadisticasGlobales>> {
    return this.http.get<ApiResponse<EstadisticasGlobales>>(
      `${this.apiUrl}/estadisticas/mas-pedidos-global`
    );
  }

  getBocadillosMasPedidosUsuario(): Observable<ApiResponse<EstadisticasUsuario>> {
    return this.http.get<ApiResponse<EstadisticasUsuario>>(
      `${this.apiUrl}/estadisticas/mas-pedidos-usuario`
    );
  }

  getEstadisticasGenerales(): Observable<ApiResponse<EstadisticasGenerales>> {
    return this.http.get<ApiResponse<EstadisticasGenerales>>(
      `${this.apiUrl}/estadisticas/generales`
    );
  }
}
