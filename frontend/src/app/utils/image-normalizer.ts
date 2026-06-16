/**
 * Normaliza una imagen antes de subirla al backend de OCR:
 * - La reescala a un máximo de 1600px en su lado mayor.
 * - La re-codifica siempre a JPEG (calidad 0.85).
 *
 * Esto resuelve los problemas más comunes al adjuntar fotos:
 * fotos de móvil de >10MB que superan el límite del servidor, formatos no
 * soportados por el backend (HEIC de iPhone, que Safari sí sabe decodificar),
 * y tiempos de inferencia largos del modelo de visión con imágenes enormes.
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

export async function normalizeImage(file: Blob): Promise<Blob> {
  const source = await decodeImage(file);
  const srcWidth = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcHeight = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  if (!srcWidth || !srcHeight) {
    throw new Error('No se pudo leer la imagen');
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(srcWidth, srcHeight));
  const width = Math.round(srcWidth * scale);
  const height = Math.round(srcHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible en este navegador');

  ctx.drawImage(source, 0, 0, width, height);
  if (source instanceof ImageBitmap) source.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo codificar la imagen'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

async function decodeImage(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      // `from-image` aplica la orientación EXIF (fotos de móvil suelen llevar
      // un flag de rotación). Sin esto, algunos navegadores devuelven el
      // bitmap girado respecto a lo que ve el usuario, lo que empeora el OCR
      // y difiere del fallback con <img> (que sí respeta EXIF por defecto).
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Algunos navegadores no decodifican ciertos formatos vía createImageBitmap;
      // probamos con un elemento <img> antes de rendirnos.
    }
  }
  return loadViaImgElement(file);
}

function loadViaImgElement(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Formato de imagen no soportado por el navegador'));
    };
    img.src = url;
  });
}
