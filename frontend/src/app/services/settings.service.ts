import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Settings {
  publicRegistrationEnabled: boolean;
  ordersClosed: boolean;
  closedMessage: string;
  closedUntilDate?: Date;
  updatedAt: Date;
}

export interface SettingsResponse {
  success: boolean;
  data?: Settings;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getSettings(): Observable<SettingsResponse> {
    return this.http.get<SettingsResponse>(`${this.apiUrl}/settings`);
  }

  updateSettings(settings: Partial<Settings>): Observable<SettingsResponse> {
    return this.http.put<SettingsResponse>(`${this.apiUrl}/settings`, settings);
  }
}
