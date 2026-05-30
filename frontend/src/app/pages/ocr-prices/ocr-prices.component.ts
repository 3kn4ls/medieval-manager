import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BocadilloService } from '../../services/bocadillo.service';
import { AuthService } from '../../services/auth.service';
import {
  OcrPriceService,
  OcrResponseData,
  OcrApplyResponseData,
} from '../../services/ocr-price.service';
import { Bocadillo } from '../../models/bocadillo.model';

interface ReviewRow {
  bocadilloId: string;
  nombre: string;
  bocadilloLabel: string;
  precioEstimado: number;
  precioAnterior: number | null;
  precioSugerido: number | null;
  precioEditado: number | null;
  confianza: 'alta' | 'media' | 'baja' | null;
  editable: boolean;
}

type Step = 'capture' | 'analyzing' | 'review' | 'applying' | 'applied';

@Component({
  selector: 'app-ocr-prices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ocr-prices.component.html',
  styleUrl: './ocr-prices.component.css',
})
export class OcrPricesComponent implements OnInit, OnDestroy {
  private bocadilloService = inject(BocadilloService);
  private authService = inject(AuthService);
  private ocrService = inject(OcrPriceService);
  private router = inject(Router);

  step: Step = 'capture';
  bocadillos: Bocadillo[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  // Cámara
  stream: MediaStream | null = null;
  imagenCapturada: Blob | null = null;
  imagenPreviewUrl: string | null = null;
  camaraActiva = false;

  // Resultados OCR (sin guardar)
  resultado: OcrResponseData | null = null;

  // Revisión
  reviewRows: ReviewRow[] = [];
  algunoModificado = false;

  // Resultado final tras aplicar
  appliedResult: OcrApplyResponseData | null = null;

  // File input
  selectedFile: File | null = null;

  ngOnInit() {
    this.loadBocadillos();
  }

  ngOnDestroy() {
    this.detenerCamara();
    if (this.imagenPreviewUrl) {
      URL.revokeObjectURL(this.imagenPreviewUrl);
    }
  }

  loadBocadillos() {
    this.isLoading = true;
    this.bocadilloService.getBocadillosSemanaActual().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.bocadillos = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los bocadillos de la semana';
        console.error('Error cargando bocadillos:', error);
        this.isLoading = false;
      },
    });
  }

  // ─── Cámara ────────────────────────────────────────

  async abrirCamara() {
    this.errorMessage = '';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      this.camaraActiva = true;
      setTimeout(() => {
        const video = document.getElementById('camera-video') as HTMLVideoElement;
        if (video && this.stream) {
          video.srcObject = this.stream;
        }
      }, 100);
    } catch (err: any) {
      this.errorMessage = 'No se pudo acceder a la cámara. Verifica los permisos.';
      console.error('Error de cámara:', err);
    }
  }

  capturarFoto() {
    const video = document.getElementById('camera-video') as HTMLVideoElement;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        this.imagenCapturada = blob;
        if (this.imagenPreviewUrl) URL.revokeObjectURL(this.imagenPreviewUrl);
        this.imagenPreviewUrl = URL.createObjectURL(blob);
        this.detenerCamara();
      }
    }, 'image/jpeg', 0.85);
  }

  detenerCamara() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.camaraActiva = false;
  }

  retomar() {
    this.imagenCapturada = null;
    this.selectedFile = null;
    if (this.imagenPreviewUrl) {
      URL.revokeObjectURL(this.imagenPreviewUrl);
      this.imagenPreviewUrl = null;
    }
    this.errorMessage = '';
  }

  // ─── Archivo ──────────────────────────────────────

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.imagenCapturada = this.selectedFile;
      if (this.imagenPreviewUrl) URL.revokeObjectURL(this.imagenPreviewUrl);
      this.imagenPreviewUrl = URL.createObjectURL(this.selectedFile);
      this.errorMessage = '';
    }
  }

  // ─── Analizar ─────────────────────────────────────

  analizarPrecios() {
    if (!this.imagenCapturada) return;

    this.step = 'analyzing';
    this.errorMessage = '';

    this.ocrService.analyzePrices(this.imagenCapturada).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.resultado = response.data;
          this.buildReviewRows();
          this.step = 'review';
        } else {
          this.errorMessage = response.error || 'Error desconocido al analizar la imagen';
          this.step = 'capture';
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al comunicarse con el servidor';
        if (error.status === 504) {
          this.errorMessage = 'El análisis tardó demasiado. Intenta con una imagen más clara y bien iluminada.';
        }
        console.error('Error OCR:', error);
        this.step = 'capture';
      },
    });
  }

  // ─── Revisión ─────────────────────────────────────

  buildReviewRows() {
    if (!this.resultado) return;

    const sugeridosIds = new Set(this.resultado.actualizados.map((a) => a.bocadilloId));
    const noMapeadosIds = new Set(this.resultado.noMapeados.map((n) => n.bocadilloId));

    this.reviewRows = this.bocadillos.map((b) => {
      const id = b._id || '';
      const sugerido = this.resultado!.actualizados.find((a) => a.bocadilloId === id);
      const isNoMapeado = noMapeadosIds.has(id);

      return {
        bocadilloId: id,
        nombre: b.nombre,
        bocadilloLabel: this.formatBocadillo(b),
        precioEstimado: b.precioEstimado || 0,
        precioAnterior: b.precio && b.precio > 0 ? b.precio : null,
        precioSugerido: sugerido ? sugerido.precioNuevo : null,
        precioEditado: sugerido ? sugerido.precioNuevo : null,
        confianza: sugerido ? sugerido.confianza : null,
        editable: true,
      };
    });

    this.algunoModificado = false;
  }

  onPrecioChange(_row: ReviewRow) {
    this.algunoModificado = true;
  }

  tieneCambios(row: ReviewRow): boolean {
    return row.precioSugerido !== null && row.precioEditado !== row.precioSugerido;
  }

  // ─── Aplicar ──────────────────────────────────────

  confirmarYAplicar() {
    const asignaciones = this.reviewRows
      .filter((r) => r.precioEditado !== null && r.precioEditado > 0)
      .map((r) => ({
        bocadilloId: r.bocadilloId,
        precio: r.precioEditado!,
      }));

    if (asignaciones.length === 0) {
      this.errorMessage = 'No hay precios válidos para aplicar. Asigna al menos un precio.';
      return;
    }

    this.step = 'applying';
    this.errorMessage = '';

    this.ocrService.applyPrices(asignaciones).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.appliedResult = response.data;
          this.step = 'applied';
        } else {
          this.errorMessage = response.error || 'Error al aplicar los precios';
          this.step = 'review';
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al comunicarse con el servidor';
        console.error('Error applying prices:', error);
        this.step = 'review';
      },
    });
  }

  // ─── Reiniciar ────────────────────────────────────

  nuevoAnalisis() {
    this.step = 'capture';
    this.resultado = null;
    this.reviewRows = [];
    this.appliedResult = null;
    this.algunoModificado = false;
    this.successMessage = '';
    this.retomar();
  }

  // ─── Helpers ──────────────────────────────────────

  formatBocadillo(b: Bocadillo): string {
    const parts: string[] = [];
    if (b.bocataPredefinido) parts.push(b.bocataPredefinido);
    parts.push(b.tamano === 'grande' ? 'Grande' : 'Normal');
    if (b.tipoPan !== 'normal') {
      parts.push(b.tipoPan.charAt(0).toUpperCase() + b.tipoPan.slice(1));
    }
    parts.push(b.ingredientes.join(', '));
    return parts.join(' | ');
  }

  formatCurrency(v: number): string {
    return v.toFixed(2) + '€';
  }

  confianzaEmoji(c: string | null): string {
    switch (c) {
      case 'alta': return '🟢';
      case 'media': return '🟡';
      case 'baja': return '🔴';
      default: return '⬜';
    }
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  get hasPrices(): boolean {
    return this.bocadillos.some((b) => b.precio !== undefined && b.precio > 0);
  }

  get bocadillosSinPrecio(): Bocadillo[] {
    return this.bocadillos.filter((b) => !b.precio || b.precio === 0);
  }

  get countConPrecioAsignado(): number {
    return this.reviewRows.filter((r) => r.precioEditado !== null && r.precioEditado > 0).length;
  }

  get countSugeridos(): number {
    return this.reviewRows.filter((r) => r.precioSugerido !== null).length;
  }
}
