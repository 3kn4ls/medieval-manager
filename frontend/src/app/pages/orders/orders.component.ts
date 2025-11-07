import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BocadilloFormComponent } from '../../components/bocadillo-form/bocadillo-form.component';
import { BocadilloListComponent } from '../../components/bocadillo-list/bocadillo-list.component';
import { BocadilloService } from '../../services/bocadillo.service';
import { Bocadillo, OrderWindowStatus } from '../../models/bocadillo.model';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, BocadilloFormComponent, BocadilloListComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
})
export class OrdersComponent implements OnInit {
  private bocadilloService = inject(BocadilloService);

  orderWindowStatus = signal<OrderWindowStatus | null>(null);
  refreshList = signal<number>(0);
  editingBocadillo = signal<Bocadillo | null>(null);

  ngOnInit() {
    this.checkOrderWindow();
    // Comprobar el estado cada 5 minutos
    setInterval(() => this.checkOrderWindow(), 5 * 60 * 1000);
  }

  checkOrderWindow() {
    this.bocadilloService.getOrderWindowStatus().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.orderWindowStatus.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error checking order window:', error);
      },
    });
  }

  onBocadilloCreated(bocadillo: Bocadillo) {
    this.refreshList.update((value) => value + 1);
  }

  onBocadilloUpdated(bocadillo: Bocadillo) {
    this.editingBocadillo.set(null);
    this.refreshList.update((value) => value + 1);
  }

  onEditRequested(bocadillo: Bocadillo) {
    this.editingBocadillo.set(bocadillo);
    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getDeadlineDate(): string {
    const status = this.orderWindowStatus();
    if (!status?.deadline) return '';
    const date = new Date(status.deadline);
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getNextOpeningDate(): string {
    const status = this.orderWindowStatus();
    if (!status?.nextOpening) return '';
    const date = new Date(status.nextOpening);
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
