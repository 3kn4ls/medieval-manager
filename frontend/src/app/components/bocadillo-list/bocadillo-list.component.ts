import { Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BocadilloService } from '../../services/bocadillo.service';
import { AuthService } from '../../services/auth.service';
import { Bocadillo } from '../../models/bocadillo.model';

@Component({
  selector: 'app-bocadillo-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bocadillo-list.component.html',
  styleUrl: './bocadillo-list.component.css',
})
export class BocadilloListComponent implements OnInit {
  private bocadilloService = inject(BocadilloService);
  private authService = inject(AuthService);

  refresh = input<number>(0);
  editRequested = output<Bocadillo>();

  bocadillos: Bocadillo[] = [];
  isLoading = false;
  errorMessage = '';
  canDelete = false;
  currentUserName = '';
  isAdmin = false;

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserName = currentUser?.nombre || '';
    this.isAdmin = this.authService.isAdmin();
    this.loadBocadillos();
    this.checkOrderWindow();
  }

  ngOnChanges() {
    if (this.refresh() > 0) {
      this.loadBocadillos();
    }
  }

  loadBocadillos() {
    this.isLoading = true;
    this.errorMessage = '';

    this.bocadilloService.getBocadillosSemanaActual().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.bocadillos = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los bocadillos';
        console.error(error);
        this.isLoading = false;
      },
    });
  }

  checkOrderWindow() {
    this.bocadilloService.getOrderWindowStatus().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.canDelete = response.data.isOpen;
        }
      },
    });
  }

  canEditOrDelete(bocadillo: Bocadillo): boolean {
    if (!this.canDelete) {
      return false;
    }
    const isOwner = bocadillo.nombre === this.currentUserName;
    return this.isAdmin || isOwner;
  }

  editBocadillo(bocadillo: Bocadillo) {
    this.editRequested.emit(bocadillo);
  }

  deleteBocadillo(id: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este bocadillo?')) {
      return;
    }

    this.bocadilloService.deleteBocadillo(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.bocadillos = this.bocadillos.filter((b) => b._id !== id);
        }
      },
      error: (error) => {
        const errorMsg = error.error?.error || 'Error al eliminar el bocadillo';
        alert(errorMsg);
        console.error(error);
      },
    });
  }

  getTamanoLabel(tamano: string): string {
    return tamano === 'normal' ? 'Normal' : 'Grande';
  }

  getTipoPanLabel(tipoPan: string): string {
    const labels: { [key: string]: string } = {
      normal: 'Normal',
      integral: 'Integral',
      semillas: 'Semillas',
    };
    return labels[tipoPan] || tipoPan;
  }

  updatePrecio(bocadillo: Bocadillo, event: Event) {
    const input = event.target as HTMLInputElement;
    const precio = parseFloat(input.value);

    if (isNaN(precio) || precio < 0) {
      alert('Por favor, introduce un precio válido');
      input.value = bocadillo.precio?.toString() || '';
      return;
    }

    this.bocadilloService.updatePrecio(bocadillo._id!, precio).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          bocadillo.precio = response.data.precio;
        }
      },
      error: (error) => {
        const errorMsg = error.error?.error || 'Error al actualizar el precio';
        alert(errorMsg);
        input.value = bocadillo.precio?.toString() || '';
        console.error(error);
      },
    });
  }

  togglePagado(bocadillo: Bocadillo, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const pagado = checkbox.checked;

    this.bocadilloService.markAsPagado(bocadillo._id!, pagado).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          bocadillo.pagado = response.data.pagado;
        }
      },
      error: (error) => {
        const errorMsg = error.error?.error || 'Error al actualizar el estado de pago';
        alert(errorMsg);
        checkbox.checked = !pagado;
        console.error(error);
      },
    });
  }

  formatCurrency(value?: number): string {
    if (value === undefined) return '-';
    return value.toFixed(2) + '€';
  }
}
