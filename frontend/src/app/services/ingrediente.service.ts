import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Ingrediente, CreateIngredienteDto, UpdateIngredienteDto } from '../models/ingrediente.model';

@Injectable({
  providedIn: 'root'
})
export class IngredienteService {
  private apiUrl = `${environment.apiUrl}/api/ingredientes`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los ingredientes
   */
  getIngredientes(disponible?: boolean, categoria?: string): Observable<Ingrediente[]> {
    let params: any = {};

    if (disponible !== undefined) {
      params.disponible = disponible.toString();
    }

    if (categoria) {
      params.categoria = categoria;
    }

    return this.http.get<Ingrediente[]>(this.apiUrl, { params });
  }

  /**
   * Obtener un ingrediente por ID
   */
  getIngredienteById(id: string): Observable<Ingrediente> {
    return this.http.get<Ingrediente>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear un nuevo ingrediente (solo admin)
   */
  createIngrediente(ingrediente: CreateIngredienteDto): Observable<Ingrediente> {
    return this.http.post<Ingrediente>(this.apiUrl, ingrediente);
  }

  /**
   * Actualizar un ingrediente (solo admin)
   */
  updateIngrediente(id: string, ingrediente: UpdateIngredienteDto): Observable<Ingrediente> {
    return this.http.put<Ingrediente>(`${this.apiUrl}/${id}`, ingrediente);
  }

  /**
   * Eliminar un ingrediente (solo admin)
   */
  deleteIngrediente(id: string): Observable<{ message: string; ingrediente: Ingrediente }> {
    return this.http.delete<{ message: string; ingrediente: Ingrediente }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener categorías disponibles
   */
  getCategorias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categorias/list`);
  }
}
