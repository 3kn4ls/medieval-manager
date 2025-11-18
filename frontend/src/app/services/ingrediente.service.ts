import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Ingrediente {
  _id: string;
  nombre: string;
  disponible: boolean;
  orden: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IngredienteResponse {
  success: boolean;
  data?: Ingrediente | Ingrediente[] | string[];
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class IngredienteService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Obtener todos los ingredientes (admin)
  getAllIngredientes(): Observable<IngredienteResponse> {
    return this.http.get<IngredienteResponse>(`${this.apiUrl}/ingredientes`);
  }

  // Obtener ingredientes disponibles (para formulario)
  getIngredientesDisponibles(): Observable<IngredienteResponse> {
    return this.http.get<IngredienteResponse>(`${this.apiUrl}/ingredientes/disponibles`);
  }

  // Admin: Crear ingrediente
  createIngrediente(data: Partial<Ingrediente>): Observable<IngredienteResponse> {
    return this.http.post<IngredienteResponse>(`${this.apiUrl}/ingredientes`, data);
  }

  // Admin: Actualizar ingrediente
  updateIngrediente(id: string, data: Partial<Ingrediente>): Observable<IngredienteResponse> {
    return this.http.put<IngredienteResponse>(`${this.apiUrl}/ingredientes/${id}`, data);
  }

  // Admin: Eliminar ingrediente
  deleteIngrediente(id: string): Observable<IngredienteResponse> {
    return this.http.delete<IngredienteResponse>(`${this.apiUrl}/ingredientes/${id}`);
  }

  // Admin: Inicializar ingredientes por defecto
  initializeDefaultIngredientes(): Observable<IngredienteResponse> {
    return this.http.post<IngredienteResponse>(`${this.apiUrl}/ingredientes/initialize`, {});
  }
}
