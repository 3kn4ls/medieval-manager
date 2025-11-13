import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  form!: FormGroup;
  users: User[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  readonly UserRole = UserRole;

  ngOnInit() {
    this.initForm();
    this.loadUsers();
  }

  initForm() {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre: ['', Validators.required],
      role: [UserRole.USER, Validators.required],
    });
  }

  loadUsers() {
    this.isLoading = true;
    this.authService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.users = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error cargando usuarios';
        console.error('Error cargando usuarios:', error);
        this.isLoading = false;
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.createUser(this.form.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Usuario creado correctamente';
          this.form.reset({ role: UserRole.USER });
          this.loadUsers();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al crear el usuario';
        this.isSubmitting = false;
      },
    });
  }

  deleteUser(userId: string, username: string) {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${username}"?`)) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.authService.deleteUser(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = `Usuario "${username}" eliminado correctamente`;
          this.loadUsers();
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al eliminar el usuario';
      },
    });
  }

  getRoleLabel(role: UserRole): string {
    return role === UserRole.ADMIN ? '🧙‍♂️ Admin' : '👤 Usuario';
  }
}
