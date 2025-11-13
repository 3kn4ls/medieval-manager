import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TamanoBocadillo, TipoPan } from '../models/bocadillo.model';

export interface AlquimistaData {
  tamano: TamanoBocadillo;
  tipoPan: TipoPan;
  ingredientes: string[];
}

export interface AlquimistaResponse {
  success: boolean;
  data?: AlquimistaData & {
    _id: string;
    semana: number;
    ano: number;
    createdAt: Date;
    updatedAt: Date;
  };
  semana?: number;
  ano?: number;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AlquimistaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAlquimistaActual(): Observable<AlquimistaResponse> {
    return this.http.get<AlquimistaResponse>(`${this.apiUrl}/alquimista`);
  }

  upsertAlquimista(data: AlquimistaData): Observable<AlquimistaResponse> {
    return this.http.post<AlquimistaResponse>(`${this.apiUrl}/alquimista`, data);
  }

  deleteAlquimista(): Observable<AlquimistaResponse> {
    return this.http.delete<AlquimistaResponse>(`${this.apiUrl}/alquimista`);
  }
}
