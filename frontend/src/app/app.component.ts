import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);

  showNav = false;
  currentUser: string = '';

  ngOnInit() {
    this.userService.user$.subscribe((user) => {
      this.showNav = user !== null;
      this.currentUser = user?.nombre || '';
    });
  }

  async logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      await this.userService.clearUser();
      this.router.navigate(['/register']);
    }
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
