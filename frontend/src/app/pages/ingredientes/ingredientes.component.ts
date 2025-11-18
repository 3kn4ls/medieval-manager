import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IngredienteService } from '../../services/ingrediente.service';
import { AuthService } from '../../services/auth.service';
import { Ingrediente, CreateIngredienteDto, UpdateIngredienteDto } from '../../models/ingrediente.model';

@Component({
  selector: 'app-ingredientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ingredientes.component.html',
  styleUrls: ['./ingredientes.component.css']
})
export class IngredientesComponent implements OnInit {
  ingredientes: Ingrediente[] = [];
  categorias: string[] = [];
  ingredienteForm: FormGroup;
  editingIngrediente: Ingrediente | null = null;
  isLoading = false;
  error = '';
  successMessage = '';
  showForm = false;

  constructor(
    private ingredienteService: IngredienteService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.ingredienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      categoria: ['General', [Validators.maxLength(50)]],
      disponible: [true],
      orden: [0, [Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    // Verificar que el usuario es admin
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/orders']);
      return;
    }

    this.loadIngredientes();
    this.loadCategorias();
  }

  loadIngredientes(): void {
    this.isLoading = true;
    this.error = '';

    this.ingredienteService.getIngredientes().subscribe({
      next: (ingredientes) => {
        this.ingredientes = ingredientes;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar ingredientes:', error);
        this.error = 'Error al cargar los ingredientes';
        this.isLoading = false;
      }
    });
  }

  loadCategorias(): void {
    this.ingredienteService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  onSubmit(): void {
    if (this.ingredienteForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.successMessage = '';

    const formData = this.ingredienteForm.value;

    if (this.editingIngrediente) {
      // Actualizar ingrediente existente
      const updateDto: UpdateIngredienteDto = formData;
      this.ingredienteService.updateIngrediente(this.editingIngrediente._id!, updateDto).subscribe({
        next: (updated) => {
          this.successMessage = 'Ingrediente actualizado correctamente';
          this.loadIngredientes();
          this.loadCategorias();
          this.resetForm();
          this.isLoading = false;
          this.showForm = false;

          // Limpiar mensaje después de 3 segundos
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error al actualizar ingrediente:', error);
          this.error = error.error?.message || 'Error al actualizar el ingrediente';
          this.isLoading = false;
        }
      });
    } else {
      // Crear nuevo ingrediente
      const createDto: CreateIngredienteDto = formData;
      this.ingredienteService.createIngrediente(createDto).subscribe({
        next: (newIngrediente) => {
          this.successMessage = 'Ingrediente creado correctamente';
          this.loadIngredientes();
          this.loadCategorias();
          this.resetForm();
          this.isLoading = false;
          this.showForm = false;

          // Limpiar mensaje después de 3 segundos
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error al crear ingrediente:', error);
          this.error = error.error?.message || 'Error al crear el ingrediente';
          this.isLoading = false;
        }
      });
    }
  }

  editIngrediente(ingrediente: Ingrediente): void {
    this.editingIngrediente = ingrediente;
    this.showForm = true;
    this.ingredienteForm.patchValue({
      nombre: ingrediente.nombre,
      categoria: ingrediente.categoria || 'General',
      disponible: ingrediente.disponible,
      orden: ingrediente.orden,
    });
    this.error = '';
    this.successMessage = '';
  }

  deleteIngrediente(ingrediente: Ingrediente): void {
    if (!confirm(`¿Estás seguro de que deseas eliminar el ingrediente "${ingrediente.nombre}"?`)) {
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.successMessage = '';

    this.ingredienteService.deleteIngrediente(ingrediente._id!).subscribe({
      next: (response) => {
        this.successMessage = 'Ingrediente eliminado correctamente';
        this.loadIngredientes();
        this.loadCategorias();
        this.isLoading = false;

        // Limpiar mensaje después de 3 segundos
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error al eliminar ingrediente:', error);
        this.error = error.error?.message || 'Error al eliminar el ingrediente';
        this.isLoading = false;
      }
    });
  }

  resetForm(): void {
    this.editingIngrediente = null;
    this.ingredienteForm.reset({
      nombre: '',
      categoria: 'General',
      disponible: true,
      orden: 0,
    });
    this.error = '';
  }

  cancelEdit(): void {
    this.resetForm();
    this.showForm = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  goToUsers(): void {
    this.router.navigate(['/users']);
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goToPayments(): void {
    this.router.navigate(['/payments']);
  }
}
