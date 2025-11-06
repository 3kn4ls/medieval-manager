import { Component, OnInit, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BocadilloService } from '../../services/bocadillo.service';
import { Bocadillo } from '../../models/bocadillo.model';

@Component({
  selector: 'app-bocadillo-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bocadillo-list.component.html',
  styleUrl: './bocadillo-list.component.css',
})
export class BocadilloListComponent implements OnInit {
  private bocadilloService = inject(BocadilloService);

  refresh = input<number>(0);

  bocadillos: Bocadillo[] = [];
  isLoading = false;
  errorMessage = '';
  canDelete = false;

  ngOnInit() {
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
        alert('Error al eliminar el bocadillo');
        console.error(error);
      },
    });
  }

  getTamañoLabel(tamaño: string): string {
    return tamaño === 'normal' ? 'Normal' : 'Grande';
  }

  getTipoPanLabel(tipoPan: string): string {
    const labels: { [key: string]: string } = {
      normal: 'Normal',
      integral: 'Integral',
      semillas: 'Semillas',
    };
    return labels[tipoPan] || tipoPan;
  }
}
