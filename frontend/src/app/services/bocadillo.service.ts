import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Bocadillo,
  BocataPredefinido,
  OrderWindowStatus,
  ApiResponse,
} from '../models/bocadillo.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BocadilloService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Bocadillos
  getBocadillosSemanaActual(): Observable<ApiResponse<Bocadillo[]>> {
    return this.http.get<ApiResponse<Bocadillo[]>>(`${this.apiUrl}/bocadillos`);
  }

  createBocadillo(bocadillo: Bocadillo): Observable<ApiResponse<Bocadillo>> {
    return this.http.post<ApiResponse<Bocadillo>>(`${this.apiUrl}/bocadillos`, bocadillo);
  }

  updateBocadillo(id: string, bocadillo: Bocadillo): Observable<ApiResponse<Bocadillo>> {
    return this.http.put<ApiResponse<Bocadillo>>(
      `${this.apiUrl}/bocadillos/${id}`,
      bocadillo
    );
  }

  deleteBocadillo(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/bocadillos/${id}`);
  }

  // Menú
  getIngredientes(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/menu/ingredientes`);
  }

  getBocatasPredefinidos(): Observable<ApiResponse<BocataPredefinido[]>> {
    return this.http.get<ApiResponse<BocataPredefinido[]>>(
      `${this.apiUrl}/menu/bocatas-predefinidos`
    );
  }

  getOrderWindowStatus(): Observable<ApiResponse<OrderWindowStatus>> {
    return this.http.get<ApiResponse<OrderWindowStatus>>(`${this.apiUrl}/menu/order-window`);
  }
}
