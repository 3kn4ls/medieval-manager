import { Component, OnInit, inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticasService, EstadisticasGlobales, EstadisticasUsuario, EstadisticasGenerales } from '../../services/estadisticas.service';
import { Bocadillo } from '../../models/bocadillo.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css',
})
export class EstadisticasComponent implements OnInit, AfterViewInit {
  private estadisticasService = inject(EstadisticasService);

  @ViewChild('ingredientesGlobalChart') ingredientesGlobalCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('bocatasGlobalChart') bocatasGlobalCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('ingredientesUsuarioChart') ingredientesUsuarioCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('bocatasUsuarioChart') bocatasUsuarioCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('tamanoUsuarioChart') tamanoUsuarioCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('panUsuarioChart') panUsuarioCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('tendenciaChart') tendenciaCanvas?: ElementRef<HTMLCanvasElement>;

  ultimoBocadillo: Bocadillo | null = null;
  estadisticasGlobales: EstadisticasGlobales | null = null;
  estadisticasUsuario: EstadisticasUsuario | null = null;
  estadisticasGenerales: EstadisticasGenerales | null = null;

  isLoading = false;
  errorMessage = '';

  private charts: Chart[] = [];

  ngOnInit() {
    this.loadAllEstadisticas();
  }

  ngAfterViewInit() {
    // Las gráficas se crearán después de cargar los datos
  }

  loadAllEstadisticas() {
    this.isLoading = true;
    this.errorMessage = '';

    // Cargar último bocadillo
    this.estadisticasService.getUltimoBocadilloUsuario().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ultimoBocadillo = response.data;
        }
      },
      error: (error) => {
        console.error('Error cargando último bocadillo:', error);
      },
    });

    // Cargar estadísticas globales
    this.estadisticasService.getBocadillosMasPedidosGlobal().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.estadisticasGlobales = response.data;
          setTimeout(() => this.createGlobalCharts(), 100);
        }
      },
      error: (error) => {
        console.error('Error cargando estadísticas globales:', error);
        this.errorMessage = 'Error cargando estadísticas globales';
      },
    });

    // Cargar estadísticas del usuario
    this.estadisticasService.getBocadillosMasPedidosUsuario().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.estadisticasUsuario = response.data;
          setTimeout(() => this.createUserCharts(), 100);
        }
      },
      error: (error) => {
        console.error('Error cargando estadísticas del usuario:', error);
        this.errorMessage = 'Error cargando estadísticas del usuario';
      },
    });

    // Cargar estadísticas generales
    this.estadisticasService.getEstadisticasGenerales().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.estadisticasGenerales = response.data;
          setTimeout(() => this.createTendenciaChart(), 100);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando estadísticas generales:', error);
        this.errorMessage = 'Error cargando estadísticas generales';
        this.isLoading = false;
      },
    });
  }

  createGlobalCharts() {
    if (!this.estadisticasGlobales) return;

    // Gráfica de ingredientes globales
    if (this.ingredientesGlobalCanvas && this.estadisticasGlobales.topIngredientes.length > 0) {
      const ctx = this.ingredientesGlobalCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const config: ChartConfiguration = {
          type: 'bar',
          data: {
            labels: this.estadisticasGlobales.topIngredientes.map(i => i.ingrediente),
            datasets: [{
              label: 'Veces pedido',
              data: this.estadisticasGlobales.topIngredientes.map(i => i.count),
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          },
        };
        this.charts.push(new Chart(ctx, config));
      }
    }

    // Gráfica de bocatas predefinidas globales
    if (this.bocatasGlobalCanvas && this.estadisticasGlobales.topBocatasPredefinidas.length > 0) {
      const ctx = this.bocatasGlobalCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const config: ChartConfiguration = {
          type: 'pie',
          data: {
            labels: this.estadisticasGlobales.topBocatasPredefinidas.map(b => b.bocata),
            datasets: [{
              data: this.estadisticasGlobales.topBocatasPredefinidas.map(b => b.count),
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(199, 199, 199, 0.6)',
                'rgba(83, 102, 255, 0.6)',
                'rgba(255, 99, 255, 0.6)',
                'rgba(99, 255, 132, 0.6)',
              ],
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
              },
            },
          },
        };
        this.charts.push(new Chart(ctx, config));
      }
    }
  }

  createUserCharts() {
    if (!this.estadisticasUsuario) return;

    // Gráfica de ingredientes del usuario
    if (this.ingredientesUsuarioCanvas && this.estadisticasUsuario.topIngredientes.length > 0) {
      const ctx = this.ingredientesUsuarioCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const config: ChartConfiguration = {
          type: 'bar',
          data: {
            labels: this.estadisticasUsuario.topIngredientes.map(i => i.ingrediente),
            datasets: [{
              label: 'Veces pedido',
              data: this.estadisticasUsuario.topIngredientes.map(i => i.count),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
              x: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          },
        };
        this.charts.push(new Chart(ctx, config));
      }
    }

    // Gráfica de bocatas predefinidas del usuario
    if (this.bocatasUsuarioCanvas && this.estadisticasUsuario.topBocatasPredefinidas.length > 0) {
      const ctx = this.bocatasUsuarioCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const config: ChartConfiguration = {
          type: 'doughnut',
          data: {
            labels: this.estadisticasUsuario.topBocatasPredefinidas.map(b => b.bocata),
            datasets: [{
              data: this.estadisticasUsuario.topBocatasPredefinidas.map(b => b.count),
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
              ],
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
              },
            },
          },
        };
        this.charts.push(new Chart(ctx, config));
      }
    }

    // Gráfica de distribución por tamaño del usuario
    if (this.tamanoUsuarioCanvas && this.estadisticasUsuario.distribucionTamano.length > 0) {
      const ctx = this.tamanoUsuarioCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const config: ChartConfiguration = {
          type: 'pie',
          data: {
            labels: this.estadisticasUsuario.distribucionTamano.map(t =>
              t.tamano === 'normal' ? 'Normal' : 'Grande'
            ),
            datasets: [{
              data: this.estadisticasUsuario.distribucionTamano.map(t => t.count),
              backgroundColor: [
                'rgba(255, 206, 86, 0.6)',
                'rgba(54, 162, 235, 0.6)',
              ],
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
              },
            },
          },
        };
        this.charts.push(new Chart(ctx, config));
      }
    }

    // Gráfica de distribución por tipo de pan del usuario
    if (this.panUsuarioCanvas && this.estadisticasUsuario.distribucionPan.length > 0) {
      const ctx = this.panUsuarioCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const panLabels = this.estadisticasUsuario.distribucionPan.map(p => {
          switch (p.tipoPan) {
            case 'normal': return 'Normal';
            case 'integral': return 'Integral';
            case 'semillas': return 'Semillas';
            default: return p.tipoPan;
          }
        });
        const config: ChartConfiguration = {
          type: 'pie',
          data: {
            labels: panLabels,
            datasets: [{
              data: this.estadisticasUsuario.distribucionPan.map(p => p.count),
              backgroundColor: [
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(75, 192, 192, 0.6)',
              ],
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
              },
            },
          },
        };
        this.charts.push(new Chart(ctx, config));
      }
    }
  }

  createTendenciaChart() {
    if (!this.estadisticasGenerales || !this.tendenciaCanvas) return;

    if (this.estadisticasGenerales.tendenciaSemanal.length > 0) {
      const ctx = this.tendenciaCanvas.nativeElement.getContext('2d');
      if (ctx) {
        const labels = this.estadisticasGenerales.tendenciaSemanal.map(
          t => `S${t.semana} ${t.ano}`
        );
        const config: ChartConfiguration = {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Bocadillos pedidos',
              data: this.estadisticasGenerales.tendenciaSemanal.map(t => t.count),
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4,
              fill: true,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          },
        };
        this.charts.push(new Chart(ctx, config));
      }
    }
  }

  formatBocadillo(bocadillo: Bocadillo): string {
    const parts: string[] = [];

    if (bocadillo.bocataPredefinido) {
      parts.push(`${bocadillo.bocataPredefinido}`);
    }

    parts.push(bocadillo.tamano === 'normal' ? 'Normal' : 'Grande');

    if (bocadillo.tipoPan !== 'normal') {
      const panLabel = bocadillo.tipoPan === 'integral' ? 'Integral' : 'Semillas';
      parts.push(panLabel);
    }

    if (bocadillo.ingredientes && bocadillo.ingredientes.length > 0) {
      const ingredientes = bocadillo.ingredientes.join(', ');
      if (bocadillo.bocataPredefinido) {
        parts.push(`+ ${ingredientes}`);
      } else {
        parts.push(ingredientes);
      }
    }

    return parts.join(' | ');
  }

  formatCurrency(value: number): string {
    return value.toFixed(2) + '€';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) {
      return 'Sin fecha';
    }
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  ngOnDestroy() {
    // Destruir todas las gráficas para evitar memory leaks
    this.charts.forEach(chart => chart.destroy());
  }
}
