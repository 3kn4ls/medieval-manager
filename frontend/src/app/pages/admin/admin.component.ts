import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AlquimistaService } from '../../services/alquimista.service';
import { BocadilloService } from '../../services/bocadillo.service';
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

  form!: FormGroup;
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

  readonly TamanoBocadillo = TamanoBocadillo;
  readonly TipoPan = TipoPan;

  ngOnInit() {
    this.initForm();
    this.loadData();
    this.loadAlquimistaActual();
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
}
