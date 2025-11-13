import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);

  form!: FormGroup;
  users: User[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  editingUserId: string | null = null;
  publicRegistrationEnabled = false;

  readonly UserRole = UserRole;

  ngOnInit() {
    this.initForm();
    this.loadUsers();
    this.loadSettings();
  }

  initForm() {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre: ['', Validators.required],
      role: [UserRole.USER, Validators.required],
    });
  }

  loadSettings() {
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.publicRegistrationEnabled = response.data.publicRegistrationEnabled;
        }
      },
      error: (error) => {
        console.error('Error cargando configuración:', error);
      },
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

    if (this.editingUserId) {
      // Modo edición
      const updateData: any = {
        username: this.form.value.username,
        nombre: this.form.value.nombre,
        role: this.form.value.role,
      };

      // Solo incluir password si se ha cambiado
      if (this.form.value.password) {
        updateData.password = this.form.value.password;
      }

      this.authService.updateUser(this.editingUserId, updateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Usuario actualizado correctamente';
            this.cancelEdit();
            this.loadUsers();
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.error || 'Error al actualizar el usuario';
          this.isSubmitting = false;
        },
      });
    } else {
      // Modo creación
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
  }

  editUser(user: User) {
    this.editingUserId = user.id;
    this.form.patchValue({
      username: user.username,
      nombre: user.nombre,
      role: user.role,
      password: '', // Dejar vacío para no cambiar
    });

    // Hacer que el password sea opcional en modo edición
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();

    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEdit() {
    this.editingUserId = null;
    this.form.reset({ role: UserRole.USER });

    // Restaurar validación de password
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
  }

  togglePublicRegistration() {
    this.settingsService.updateSettings({ publicRegistrationEnabled: this.publicRegistrationEnabled }).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = `Registro público ${this.publicRegistrationEnabled ? 'activado' : 'desactivado'}`;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al actualizar la configuración';
        // Revertir el cambio
        this.publicRegistrationEnabled = !this.publicRegistrationEnabled;
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
