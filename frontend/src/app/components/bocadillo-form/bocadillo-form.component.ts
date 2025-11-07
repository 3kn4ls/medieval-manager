import { Component, OnInit, inject, output, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BocadilloService } from '../../services/bocadillo.service';
import { UserService } from '../../services/user.service';
import {
  TamanoBocadillo,
  TipoPan,
  Bocadillo,
  BocataPredefinido,
} from '../../models/bocadillo.model';

@Component({
  selector: 'app-bocadillo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bocadillo-form.component.html',
  styleUrl: './bocadillo-form.component.css',
})
export class BocadilloFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bocadilloService = inject(BocadilloService);
  private userService = inject(UserService);

  bocadilloCreated = output<Bocadillo>();
  bocadilloUpdated = output<Bocadillo>();
  editingBocadillo = input<Bocadillo | null>(null);

  form!: FormGroup;
  ingredientesDisponibles: string[] = [];
  ingredientesFiltrados: string[] = [];
  bocatasPredefinidos: BocataPredefinido[] = [];
  ingredientesSeleccionados: string[] = [];
  ingredienteInput = '';
  showIngredientesSuggestions = false;
  isSubmitting = false;
  errorMessage = '';
  userName: string = '';

  constructor() {
    effect(() => {
      const bocadillo = this.editingBocadillo();
      if (bocadillo) {
        this.loadBocadilloForEdit(bocadillo);
      } else {
        this.resetForm();
      }
    });
  }

  readonly TamanoBocadillo = TamanoBocadillo;
  readonly TipoPan = TipoPan;

  ngOnInit() {
    this.loadUserName();
    this.initForm();
    this.loadData();
  }

  loadUserName() {
    const user = this.userService.getCurrentUser();
    this.userName = user?.nombre || '';
  }

  initForm() {
    this.form = this.fb.group({
      tamano: [TamanoBocadillo.NORMAL, Validators.required],
      tipoPan: [TipoPan.NORMAL, Validators.required],
      bocataPredefinido: [''],
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

    this.bocadilloService.getBocatasPredefinidos().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.bocatasPredefinidos = response.data;
        }
      },
      error: (error) => console.error('Error cargando bocatas predefinidos:', error),
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

  seleccionarBocataPredefinido(event: Event) {
    const select = event.target as HTMLSelectElement;
    const nombreBocata = select.value;

    if (!nombreBocata) {
      return;
    }

    const bocata = this.bocatasPredefinidos.find((b) => b.nombre === nombreBocata);

    if (bocata) {
      this.form.patchValue({
        tamano: bocata.tamano,
        tipoPan: bocata.tipoPan,
        bocataPredefinido: bocata.nombre,
      });
      this.ingredientesSeleccionados = [...bocata.ingredientes];
    }
  }

  loadBocadilloForEdit(bocadillo: Bocadillo) {
    this.form.patchValue({
      tamano: bocadillo.tamano,
      tipoPan: bocadillo.tipoPan,
      bocataPredefinido: bocadillo.bocataPredefinido || '',
    });
    this.ingredientesSeleccionados = [...bocadillo.ingredientes];
  }

  isEditMode(): boolean {
    return this.editingBocadillo() !== null;
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

    const bocadillo: Bocadillo = {
      ...this.form.value,
      nombre: this.userName,
      ingredientes: this.ingredientesSeleccionados,
    };

    if (this.isEditMode()) {
      const editingBocadillo = this.editingBocadillo();
      if (!editingBocadillo?._id) {
        this.errorMessage = 'Error: ID de bocadillo no encontrado';
        this.isSubmitting = false;
        return;
      }

      this.bocadilloService.updateBocadillo(editingBocadillo._id, bocadillo).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.bocadilloUpdated.emit(response.data);
            this.resetForm();
          }
        },
        error: (error) => {
          this.errorMessage =
            error.error?.error || 'Error al actualizar el bocadillo. Inténtalo de nuevo.';
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    } else {
      this.bocadilloService.createBocadillo(bocadillo).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.bocadilloCreated.emit(response.data);
            this.resetForm();
          }
        },
        error: (error) => {
          this.errorMessage =
            error.error?.message || 'Error al crear el bocadillo. Inténtalo de nuevo.';
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    }
  }

  resetForm() {
    this.form.reset({
      tamano: TamanoBocadillo.NORMAL,
      tipoPan: TipoPan.NORMAL,
      bocataPredefinido: '',
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
