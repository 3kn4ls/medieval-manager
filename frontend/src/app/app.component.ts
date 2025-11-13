import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  showNav = false;
  currentUser: string = '';
  isAdmin = false;

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.showNav = user !== null;
      this.currentUser = user?.nombre || '';
      this.isAdmin = this.authService.isAdmin();
    });
  }

  logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.authService.logout();
    }
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
