import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Bocadillo,
  BocataPredefinido,
  OrderWindowStatus,
  ApiResponse,
} from '../models/bocadillo.model';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class BocadilloService {
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private apiUrl = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    const currentUser = this.userService.getCurrentUser();
    return new HttpHeaders({
      'X-User-Name': currentUser?.nombre || '',
    });
  }

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
      bocadillo,
      { headers: this.getHeaders() }
    );
  }

  deleteBocadillo(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/bocadillos/${id}`,
      { headers: this.getHeaders() }
    );
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
