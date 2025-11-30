import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private swRegistration: ServiceWorkerRegistration | null = null;

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    return await Notification.requestPermission();
  }

  async subscribe(): Promise<void> {
    try {
      const permission = await this.requestPermission();

      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return;
      }

      // Registrar Service Worker si no está registrado
      if (!this.swRegistration) {
        this.swRegistration = await navigator.serviceWorker.register('/service-worker.js');
        await navigator.serviceWorker.ready;
      }

      // Obtener la clave pública del servidor
      const response = await this.http
        .get<{ success: boolean; publicKey: string }>(`${this.apiUrl}/push/vapid-public-key`)
        .toPromise();

      if (!response?.publicKey) {
        throw new Error('Failed to get VAPID public key');
      }

      // Suscribirse a las notificaciones push
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(response.publicKey),
      });

      // Enviar la suscripción al servidor
      await this.http
        .post(`${this.apiUrl}/push/subscribe`, {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
          },
        })
        .toPromise();

      console.log('Successfully subscribed to push notifications');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  async unsubscribe(): Promise<void> {
    try {
      if (!this.swRegistration) {
        const registration = await navigator.serviceWorker.getRegistration();
        this.swRegistration = registration || null;
      }

      if (!this.swRegistration) {
        return;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();

      if (subscription) {
        await this.http
          .post(`${this.apiUrl}/push/unsubscribe`, {
            endpoint: subscription.endpoint,
          })
          .toPromise();

        await subscription.unsubscribe();
        console.log('Successfully unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return false;
      }

      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
