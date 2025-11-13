import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm!: FormGroup;
  registerForm!: FormGroup;
  isLoginMode = true;
  isSubmitting = false;
  errorMessage = '';
  returnUrl = '/';

  ngOnInit() {
    this.initForms();
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  initForms() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre: ['', [Validators.required]],
    });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
  }

  onLogin() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate([this.returnUrl]);
        } else {
          this.errorMessage = response.error || 'Error al iniciar sesión';
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al iniciar sesión';
        this.isSubmitting = false;
      },
    });
  }

  onRegister() {
    if (this.registerForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate([this.returnUrl]);
        } else {
          this.errorMessage = response.error || 'Error al registrarse';
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al registrarse';
        this.isSubmitting = false;
      },
    });
  }
}
