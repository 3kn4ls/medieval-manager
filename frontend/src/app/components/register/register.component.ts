import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private userService = inject(UserService);
  private router = inject(Router);

  nombre: string = '';
  errorMessage: string = '';
  isSubmitting: boolean = false;

  async onSubmit() {
    if (!this.nombre || this.nombre.trim().length === 0) {
      this.errorMessage = 'Por favor, introduce tu nombre';
      return;
    }

    if (this.nombre.trim().length > 50) {
      this.errorMessage = 'El nombre es demasiado largo (máximo 50 caracteres)';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    try {
      await this.userService.setUser(this.nombre.trim());
      this.router.navigate(['/orders']);
    } catch (error) {
      this.errorMessage = 'Error al registrar el usuario. Inténtalo de nuevo.';
      this.isSubmitting = false;
    }
  }
}
