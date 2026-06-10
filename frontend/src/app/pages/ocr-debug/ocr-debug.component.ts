import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OcrPriceService, OcrTestData } from '../../services/ocr-price.service';
import { normalizeImage } from '../../utils/image-normalizer';

type DebugStep = 'capture' | 'analyzing' | 'results';

@Component({
  selector: 'app-ocr-debug',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ocr-debug.component.html',
  styleUrl: './ocr-debug.component.css',
})
export class OcrDebugComponent implements OnDestroy {
  private ocrService = inject(OcrPriceService);
  private router = inject(Router);

  step: DebugStep = 'capture';
  errorMessage = '';

  // Cámara
  stream: MediaStream | null = null;
  imagenCapturada: Blob | null = null;
  imagenPreviewUrl: string | null = null;
  camaraActiva = false;

  // Resultados
  result: OcrTestData | null = null;

  ngOnDestroy() {
    this.detenerCamara();
    if (this.imagenPreviewUrl) URL.revokeObjectURL(this.imagenPreviewUrl);
  }

  async abrirCamara() {
    this.errorMessage = '';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      this.camaraActiva = true;
      setTimeout(() => {
        const video = document.getElementById('debug-camera-video') as HTMLVideoElement;
        if (video && this.stream) video.srcObject = this.stream;
      }, 100);
    } catch (err: any) {
      this.errorMessage = 'No se pudo acceder a la cámara. Verifica los permisos.';
      console.error('Error de cámara:', err);
    }
  }

  capturarFoto() {
    const video = document.getElementById('debug-camera-video') as HTMLVideoElement;
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

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.errorMessage = '';
    input.value = '';

    try {
      this.imagenCapturada = await normalizeImage(file);
      if (this.imagenPreviewUrl) URL.revokeObjectURL(this.imagenPreviewUrl);
      this.imagenPreviewUrl = URL.createObjectURL(this.imagenCapturada);
    } catch (err) {
      this.imagenCapturada = null;
      this.errorMessage = 'No se pudo leer la imagen. Prueba con una foto en formato JPEG o PNG.';
      console.error('Error normalizando imagen:', err);
    }
  }

  retomar() {
    this.imagenCapturada = null;
    if (this.imagenPreviewUrl) URL.revokeObjectURL(this.imagenPreviewUrl);
    this.imagenPreviewUrl = null;
    this.errorMessage = '';
  }

  analizar() {
    if (!this.imagenCapturada) return;
    this.step = 'analyzing';
    this.errorMessage = '';

    this.ocrService.testOcr(this.imagenCapturada).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.result = response.data;
          this.step = 'results';
        } else {
          this.errorMessage = response.error || 'Error desconocido';
          this.step = 'capture';
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Error al comunicarse con el servidor';
        if (error.status === 504) {
          this.errorMessage = 'Timeout: el modelo tardó más de 60s.';
        }
        console.error('Error OCR debug:', error);
        this.step = 'capture';
      },
    });
  }

  nuevoTest() {
    this.step = 'capture';
    this.result = null;
    this.retomar();
  }

  goBack() {
    this.router.navigate(['/admin']);
  }

  formatMs(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  formatBytes(b: number): string {
    if (b < 1024) return `${b} B`;
    return `${(b / 1024).toFixed(1)} KB`;
  }
}
