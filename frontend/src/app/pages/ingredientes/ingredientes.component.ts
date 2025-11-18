import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IngredienteService, Ingrediente } from '../../services/ingrediente.service';

@Component({
  selector: 'app-ingredientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ingredientes.component.html',
  styleUrl: './ingredientes.component.css',
})
export class IngredientesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ingredienteService = inject(IngredienteService);

  form!: FormGroup;
  ingredientes: Ingrediente[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  editingIngredienteId: string | null = null;

  ngOnInit() {
    this.initForm();
    this.loadIngredientes();
  }

  initForm() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      disponible: [true],
      orden: [0, [Validators.required, Validators.min(0)]],
    });
  }

  loadIngredientes() {
    this.isLoading = true;
    this.ingredienteService.getAllIngredientes().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ingredientes = response.data as Ingrediente[];
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error cargando ingredientes';
        console.error('Error cargando ingredientes:', error);
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

    if (this.editingIngredienteId) {
      // Modo edición
      this.ingredienteService.updateIngrediente(this.editingIngredienteId, this.form.value).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Ingrediente actualizado correctamente';
            this.cancelEdit();
            this.loadIngredientes();
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.error || 'Error al actualizar el ingrediente';
          this.isSubmitting = false;
        },
      });
    } else {
      // Modo creación
      this.ingredienteService.createIngrediente(this.form.value).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Ingrediente creado correctamente';
            this.form.reset({ disponible: true, orden: 0 });
            this.loadIngredientes();
          }
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.error || 'Error al crear el ingrediente';
          this.isSubmitting = false;
        },
      });
    }
  }

  editIngrediente(ingrediente: Ingrediente) {
    this.editingIngredienteId = ingrediente._id;
    this.form.patchValue({
      nombre: ingrediente.nombre,
      disponible: ingrediente.disponible,
      orden: ingrediente.orden,
    });

    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEdit() {
    this.editingIngredienteId = null;
    this.form.reset({ disponible: true, orden: 0 });
  }

  deleteIngrediente(id: string, nombre: string) {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${nombre}"?`)) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.ingredienteService.deleteIngrediente(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = `Ingrediente "${nombre}" eliminado correctamente`;
          this.loadIngredientes();
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al eliminar el ingrediente';
      },
    });
  }

  initializeDefaults() {
    if (!confirm('¿Inicializar ingredientes por defecto? Esto no afectará los ingredientes existentes.')) {
      return;
    }

    this.ingredienteService.initializeDefaultIngredientes().subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message || 'Ingredientes inicializados correctamente';
          this.loadIngredientes();
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al inicializar ingredientes';
      },
    });
  }
}
