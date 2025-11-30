import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlquimistaService } from '../../services/alquimista.service';
import { BocadilloService } from '../../services/bocadillo.service';
import { AuthService } from '../../services/auth.service';
import { SettingsService, Settings } from '../../services/settings.service';
import { TamanoBocadillo, TipoPan } from '../../models/bocadillo.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private alquimistaService = inject(AlquimistaService);
  private bocadilloService = inject(BocadilloService);
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private router = inject(Router);

  form!: FormGroup;
  settingsForm!: FormGroup;
  ingredientesDisponibles: string[] = [];
  ingredientesFiltrados: string[] = [];
  ingredientesSeleccionados: string[] = [];
  ingredienteInput = '';
  showIngredientesSuggestions = false;
  isSubmitting = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  alquimistaExistente = false;
  settings: Settings | null = null;
  settingsErrorMessage = '';
  settingsSuccessMessage = '';
  isSubmittingSettings = false;

  readonly TamanoBocadillo = TamanoBocadillo;
  readonly TipoPan = TipoPan;

  ngOnInit() {
    this.initForm();
    this.initSettingsForm();
    this.loadData();
    this.loadAlquimistaActual();
    this.loadSettings();
  }

  initForm() {
    this.form = this.fb.group({
      tamano: [TamanoBocadillo.NORMAL, Validators.required],
      tipoPan: [TipoPan.NORMAL, Validators.required],
    });

    // Validar restricción de pan integral/semillas con tamaño grande
    this.form.get('tamano')?.valueChanges.subscribe(() => this.validatePanRestriction());
    this.form.get('tipoPan')?.valueChanges.subscribe(() => this.validatePanRestriction());
  }

  loadData() {
    this.bocadilloService.getIngredientes().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ingredientesDisponibles = response.data;
        }
      },
      error: (error) => console.error('Error cargando ingredientes:', error),
    });
  }

  loadAlquimistaActual() {
    this.isLoading = true;
    this.alquimistaService.getAlquimistaActual().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.alquimistaExistente = true;
          this.form.patchValue({
            tamano: response.data.tamano,
            tipoPan: response.data.tipoPan,
          });
          this.ingredientesSeleccionados = [...response.data.ingredientes];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando alquimista:', error);
        this.isLoading = false;
      },
    });
  }

  validatePanRestriction() {
    const tamano = this.form.get('tamano')?.value;
    const tipoPan = this.form.get('tipoPan')?.value;

    if (
      tamano === TamanoBocadillo.GRANDE &&
      (tipoPan === TipoPan.INTEGRAL || tipoPan === TipoPan.SEMILLAS)
    ) {
      this.form.get('tipoPan')?.setValue(TipoPan.NORMAL);
    }
  }

  onIngredienteInputChange(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    this.ingredienteInput = input;

    if (input.length > 0) {
      this.ingredientesFiltrados = this.ingredientesDisponibles.filter(
        (ing) =>
          ing.toLowerCase().includes(input.toLowerCase()) &&
          !this.ingredientesSeleccionados.includes(ing)
      );
      this.showIngredientesSuggestions = this.ingredientesFiltrados.length > 0;
    } else {
      this.showIngredientesSuggestions = false;
    }
  }

  agregarIngrediente(ingrediente: string) {
    if (!this.ingredientesSeleccionados.includes(ingrediente)) {
      this.ingredientesSeleccionados.push(ingrediente);
    }
    this.ingredienteInput = '';
    this.showIngredientesSuggestions = false;
  }

  quitarIngrediente(ingrediente: string) {
    this.ingredientesSeleccionados = this.ingredientesSeleccionados.filter(
      (ing) => ing !== ingrediente
    );
  }

  onSubmit() {
    if (this.form.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos';
      return;
    }

    if (this.ingredientesSeleccionados.length === 0) {
      this.errorMessage = 'Debes seleccionar al menos un ingrediente';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      ...this.form.value,
      ingredientes: this.ingredientesSeleccionados,
    };

    this.alquimistaService.upsertAlquimista(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = this.alquimistaExistente
            ? 'Bocadillo Alquimista actualizado correctamente'
            : 'Bocadillo Alquimista creado correctamente';
          this.alquimistaExistente = true;
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al guardar el bocadillo Alquimista';
        this.isSubmitting = false;
      },
    });
  }

  deleteAlquimista() {
    if (!confirm('¿Estás seguro de que quieres eliminar el bocadillo Alquimista de esta semana?')) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.alquimistaService.deleteAlquimista().subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Bocadillo Alquimista eliminado correctamente';
          this.alquimistaExistente = false;
          this.resetForm();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al eliminar el bocadillo Alquimista';
        this.isSubmitting = false;
      },
    });
  }

  resetForm() {
    this.form.reset({
      tamano: TamanoBocadillo.NORMAL,
      tipoPan: TipoPan.NORMAL,
    });
    this.ingredientesSeleccionados = [];
    this.ingredienteInput = '';
    this.errorMessage = '';
  }

  isPanDisabled(tipoPan: TipoPan): boolean {
    const tamano = this.form.get('tamano')?.value;
    return (
      tamano === TamanoBocadillo.GRANDE &&
      (tipoPan === TipoPan.INTEGRAL || tipoPan === TipoPan.SEMILLAS)
    );
  }

  // Métodos de navegación
  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goToIngredientes(): void {
    this.router.navigate(['/ingredientes']);
  }

  goToUsers(): void {
    this.router.navigate(['/users']);
  }

  goToPayments(): void {
    this.router.navigate(['/payments']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Gestión de Settings
  initSettingsForm() {
    this.settingsForm = this.fb.group({
      ordersClosed: [false],
      closedMessage: ['Las solicitudes de bocadillos están cerradas temporalmente'],
      closedUntilDate: [''],
    });
  }

  loadSettings() {
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.settings = response.data;
          this.settingsForm.patchValue({
            ordersClosed: response.data.ordersClosed,
            closedMessage: response.data.closedMessage,
            closedUntilDate: response.data.closedUntilDate
              ? new Date(response.data.closedUntilDate).toISOString().slice(0, 16)
              : '',
          });
        }
      },
      error: (error) => {
        console.error('Error loading settings:', error);
      },
    });
  }

  onSubmitSettings() {
    if (this.settingsForm.invalid) {
      this.settingsErrorMessage = 'Por favor, completa todos los campos correctamente';
      return;
    }

    this.isSubmittingSettings = true;
    this.settingsErrorMessage = '';
    this.settingsSuccessMessage = '';

    const formValue = this.settingsForm.value;
    const data: any = {
      ordersClosed: formValue.ordersClosed,
      closedMessage: formValue.closedMessage,
    };

    if (formValue.closedUntilDate) {
      data.closedUntilDate = new Date(formValue.closedUntilDate).toISOString();
    }

    this.settingsService.updateSettings(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.settingsSuccessMessage = 'Configuración actualizada correctamente';
          this.settings = response.data!;
        }
        this.isSubmittingSettings = false;
      },
      error: (error) => {
        this.settingsErrorMessage = error.error?.error || 'Error al actualizar la configuración';
        this.isSubmittingSettings = false;
      },
    });
  }
}
