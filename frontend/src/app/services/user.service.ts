import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  nombre: string;
  registeredAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly DB_NAME = 'medieval-manager-db';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'user';

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.loadUser();
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  private async loadUser(): Promise<void> {
    const user = await this.getUser();
    this.userSubject.next(user);
  }

  async getUser(): Promise<User | null> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get('currentUser');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async setUser(nombre: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    const user: User = {
      nombre: nombre.toUpperCase(),
      registeredAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(user, 'currentUser');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.userSubject.next(user);
        resolve();
      };
    });
  }

  async clearUser(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete('currentUser');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.userSubject.next(null);
        resolve();
      };
    });
  }

  isUserRegistered(): boolean {
    return this.userSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }
}
