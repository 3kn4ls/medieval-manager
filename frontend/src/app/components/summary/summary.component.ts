import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BocadilloService } from '../../services/bocadillo.service';
import { Bocadillo } from '../../models/bocadillo.model';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css',
})
export class SummaryComponent implements OnInit {
  private bocadilloService = inject(BocadilloService);

  bocadillos: Bocadillo[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    this.loadBocadillos();
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

  exportToWhatsApp() {
    if (this.bocadillos.length === 0) {
      alert('No hay pedidos para exportar');
      return;
    }

    // Agrupar bocadillos por configuración
    const grouped = this.groupBocadillos();

    // Generar texto
    let text = '📋 *PEDIDO DE BOCADILLOS - SEMANA ACTUAL*\n\n';

    grouped.forEach((bocadillos, key) => {
      const count = bocadillos.length;
      const sample = bocadillos[0];

      text += `${count}x ${this.getTamanoLabel(sample.tamano).toUpperCase()}`;
      text += ` - Pan ${this.getTipoPanLabel(sample.tipoPan)}`;
      text += `\n   Ingredientes: ${sample.ingredientes.join(', ')}`;

      if (sample.bocataPredefinido) {
        text += ` (${sample.bocataPredefinido})`;
      }

      text += '\n\n';
    });

    text += `*TOTAL: ${this.bocadillos.length} bocadillos*`;

    // Copiar al portapapeles
    this.copyToClipboard(text);
    alert('✅ Texto copiado al portapapeles. Ahora puedes pegarlo en WhatsApp.');
  }

  private groupBocadillos(): Map<string, Bocadillo[]> {
    const map = new Map<string, Bocadillo[]>();

    this.bocadillos.forEach((bocadillo) => {
      const key = `${bocadillo.tamano}-${bocadillo.tipoPan}-${bocadillo.ingredientes
        .sort()
        .join(',')}`;

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(bocadillo);
    });

    return map;
  }

  private copyToClipboard(text: string) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Error al copiar:', err);
      }
      document.body.removeChild(textArea);
    }
  }
}
