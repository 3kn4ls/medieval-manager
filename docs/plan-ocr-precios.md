# Plan: Módulo OCR de Precios para Administradores

## Objetivo

Permitir que un administrador tome una foto de una lista de precios escrita a mano (bolígrafo sobre papel) y que un LLM con visión analice la imagen, relacione cada entrada con los bocadillos de la semana en curso, e impute los precios.

---

## Fase 1 — MVP: Foto → LLM → Imputación de precios

### 1. Backend: Nuevo endpoint `POST /api/admin/ocr-precios`

**Archivo:** `backend/src/routes/adminRoutes.ts` (nuevo)
**Controlador:** `backend/src/controllers/adminController.ts` (nuevo)
**Servicio:** `backend/src/services/ocrPriceService.ts` (nuevo)

**Flujo:**
1. Recibe `multipart/form-data` con el campo `imagen` (JPEG/PNG, max 10MB).
2. Extrae la imagen y la convierte a base64.
3. Obtiene todos los bocadillos de la semana en curso (`getTargetWeek`).
4. Construye un prompt para el LLM que incluye:
   - La imagen en base64 (formato OpenAI vision: `data:image/jpeg;base64,...`)
   - El listado de bocadillos de la semana: nombre de usuario, ingredientes, tamaño, tipo de pan, y precioEstimado.
   - Instrucciones para devolver un JSON estructurado con el mapping.
5. Llama al AI Gateway (`/v1/chat/completions`) con un modelo de visión (nueva variable de entorno `AI_VISION_MODEL`, ej: `gemma3:12b` o `llava`).
6. La llamada **no es streaming** — esperamos la respuesta completa.
7. Parsea la respuesta JSON del LLM.
8. Para cada asignación de precio recibida, actualiza el campo `precio` del bocadillo correspondiente mediante `updatePrecio`.
9. Responde con el resultado: qué bocadillos se actualizaron, con qué precios, y cuáles no se pudieron mapear.

**Middleware:** `authenticateToken` + `requireAdmin`.

**Payload de respuesta esperado:**
```json
{
  "success": true,
  "data": {
    "semana": 22,
    "ano": 2026,
    "actualizados": [
      { "bocadilloId": "...", "nombre": "JUAN", "precioAnterior": null, "precioNuevo": 5.60, "confianza": "alta" }
    ],
    "noMapeados": [
      { "bocadilloId": "...", "nombre": "MARIA", "motivo": "No se encontró correspondencia en la imagen" }
    ],
    "preciosNoAsignados": [
      { "entrada": "Bocadillo X - 4.50€", "motivo": "No coincide con ningún pedido" }
    ],
    "textoRespuesta": "..." 
  }
}
```

### 2. AI Gateway: Soporte para imágenes

**Archivo:** `ai-gateway/server.js`

El gateway ya reenvía requests tal cual — solo hay que verificar que:
- El `content-length` máximo permitido sea suficiente para imágenes base64 (aumentar límite de body parser de Express si es necesario: `express.json({ limit: '15mb' })`).
- No haya ningún filtro que bloquee payloads con imágenes.
- Añadir `express.json({ limit: '15mb' })` y `express.urlencoded({ limit: '15mb' })` si no están ya.

**No se necesitan cambios mayores** — el gateway es transparente.

### 3. Backend: Variables de entorno

Añadir a `.env`:
```
AI_VISION_MODEL=gemma3:12b
```

- `AI_VISION_MODEL`: modelo con capacidades de visión. Debe estar disponible en Ollama (`ollama pull gemma3:12b` o `llava`, `llama3.2-vision`, etc.).
- Si no se configura, se puede caer en un fallback al mismo `AI_MODEL` (si soporta visión).

### 4. Frontend: Nueva página `/admin/ocr-precios`

**Archivos nuevos:**
- `frontend/src/app/pages/ocr-prices/ocr-prices.component.ts`
- `frontend/src/app/pages/ocr-prices/ocr-prices.component.html`
- `frontend/src/app/pages/ocr-prices/ocr-prices.component.css`

**Ruta:** Añadir a `app.routes.ts`:
```typescript
{
  path: 'admin/ocr-precios',
  loadComponent: () => import('./pages/ocr-prices/ocr-prices.component').then(m => m.OcrPricesComponent),
  canActivate: [authGuard, adminGuard],
}
```

**Funcionalidad de la página:**

1. **Paso 1 — Contexto:** Muestra una tabla con los bocadillos de la semana en curso que aún no tienen `precio` asignado (o todos, con los que ya tienen precio marcados). Columnas: nombre, bocadillo (formateado), precioEstimado, precio actual (si tiene).

2. **Paso 2 — Captura de imagen:**
   - Botón "Abrir cámara" que usa `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })` para abrir la cámara trasera.
   - Vista previa en vivo (elemento `<video>`).
   - Botón "Capturar" que toma un frame del vídeo a un `<canvas>` y lo convierte a blob JPEG (calidad 0.85).
   - Alternativa: `<input type="file" accept="image/*" capture="environment">` para dispositivos móviles (más fiable que getUserMedia en algunos navegadores).
   - Vista previa de la imagen capturada con opción de re-tomar.

3. **Paso 3 — Enviar a analizar:**
   - Botón "Analizar precios" que llama al nuevo endpoint `POST /api/admin/ocr-precios`.
   - Spinner durante el análisis (puede tardar varios segundos con un modelo de visión).
   - Manejo de errores: timeout, modelo no disponible, etc.

4. **Paso 4 — Resultados:**
   - Tabla de resultados mostrando:
     - Bocadillos actualizados (verde): nombre, precio nuevo, precio anterior.
     - Bocadillos no mapeados (amarillo): nombre, motivo.
     - Precios de la imagen sin asignar (rojo): texto detectado, motivo.
   - Posibilidad de ajustar manualmente cualquier precio antes de confirmar (en Fase 1, el precio se aplica directamente; en el futuro se puede añadir un paso de revisión).
   - Botón "Confirmar y aplicar" (en Fase 1, se aplica automáticamente; este botón es para claridad visual).

5. **Navegación:** Añadir botón en la página de admin (`/admin`) que enlace a `/admin/ocr-precios`.

### 5. Frontend: Servicio

**Archivo:** `frontend/src/app/services/ocr-price.service.ts` (nuevo)

```typescript
interface OcrPriceResponse {
  success: boolean;
  data?: {
    semana: number;
    ano: number;
    actualizados: OcrUpdate[];
    noMapeados: OcrFail[];
    preciosNoAsignados: OcrUnmapped[];
    textoRespuesta: string;
  };
  error?: string;
}

analyzePrices(imagen: Blob): Observable<OcrPriceResponse>
```

### 6. Backend: Servicio OCR

**Archivo:** `backend/src/services/ocrPriceService.ts`

```typescript
interface BocadilloContext {
  id: string;
  nombre: string;
  tamano: string;
  tipoPan: string;
  ingredientes: string[];
  precioEstimado: number;
  bocataPredefinido?: string;
}

interface OcrResult {
  bocadilloId: string;
  precio: number;
  confianza: 'alta' | 'media' | 'baja';
}

async function analyzePriceImage(
  imagenBase64: string,
  bocadillos: BocadilloContext[],
): Promise<{
  asignaciones: OcrResult[];
  noMapeados: string[];
  preciosNoAsignados: string[];
  rawResponse: string;
}>
```

**Prompt inicial (Fase 1, genérico):**

```
Eres un asistente que analiza imágenes de listas de precios escritas a mano.

Te voy a dar:
1. Una imagen de una lista de precios de bocadillos escrita a mano.
2. Una lista de los bocadillos pedidos esta semana con sus ingredientes y precios estimados.

Tu tarea:
- Lee los precios de la imagen.
- Relaciona cada entrada de la imagen con el bocadillo correspondiente de la lista.
- Para cada bocadillo, indica el precio encontrado y tu confianza (alta/media/baja).
- Si hay entradas en la imagen que no corresponden a ningún bocadillo, indícalo.
- Si hay bocadillos que no encuentras en la imagen, indícalo.

Responde ÚNICAMENTE con un JSON válido con esta estructura:
{
  "asignaciones": [
    { "bocadilloId": "...", "precio": 5.60, "confianza": "alta" }
  ],
  "noMapeados": ["bocadilloId1", "bocadilloId2"],
  "preciosNoAsignados": ["entrada de la imagen que no coincide: ..."]
}
```

---

## Fase 2 — Mejoras de precisión

Una vez validado el MVP, se pueden implementar mejoras:

### 2.1 Skill o System Prompt especializado

Crear un prompt específico que describa el formato esperado de la lista de papel:

- "Los bocadillos aparecen en orden alfabético por nombre de persona."
- "Cada línea tiene: nombre de la persona - ingredientes - precio."
- "El precio aparece al final de cada línea con el símbolo €."
- "Algunas entradas pueden ser 'sin precio' o 'pendiente'."

Esto se puede definir como:
- Una **skill** en el sistema de herramientas del chatbot (poco apropiado aquí porque no es chat).
- Una **plantilla de prompt** configurable en la página de admin (un textarea donde el admin pueda escribir/editar el preámbulo antes de enviar).
- O simplemente un **system prompt fijo** refinado iterativamente.

### 2.2 Previsualización y edición antes de aplicar

En lugar de aplicar los precios automáticamente:
- Mostrar los resultados en una tabla editable.
- El admin revisa, corrige precios manualmente si es necesario.
- Botón "Aplicar todos" que envía los precios revisados al backend.

### 2.3 Feedback loop

- Guardar la imagen y el resultado del análisis para auditoría.
- Permitir al admin marcar asignaciones como correctas/incorrectas.
- Usar ese feedback para refinar el prompt en el futuro (no en este MVP, pero la estructura de datos lo permite).

### 2.4 Histórico de análisis

- Modelo `OcrAnalysis` en MongoDB: `{ fecha, adminId, semana, ano, imagenUrl?, resultados, confirmadoPor }`.
- Página de historial para revisar análisis anteriores.

---

## Archivos a crear/modificar

### Backend (6 archivos)

| Archivo | Acción |
|---------|--------|
| `backend/src/routes/adminRoutes.ts` | **Nuevo** — Rutas admin: `POST /ocr-precios` |
| `backend/src/controllers/adminController.ts` | **Nuevo** — Controlador con `postOcrPrecios` |
| `backend/src/services/ocrPriceService.ts` | **Nuevo** — Llamada a LLM con imagen, parseo de respuesta |
| `backend/src/index.ts` | **Modificar** — Montar adminRoutes en `/api/admin` |
| `backend/.env` | **Modificar** — Añadir `AI_VISION_MODEL` |
| `backend/src/types/ocr.ts` | **Nuevo** — Tipos TypeScript para OCR |

### AI Gateway (1 archivo)

| Archivo | Acción |
|---------|--------|
| `ai-gateway/server.js` | **Modificar** — Aumentar límite de body parser para imágenes |

### Frontend (6 archivos)

| Archivo | Acción |
|---------|--------|
| `frontend/src/app/pages/ocr-prices/ocr-prices.component.ts` | **Nuevo** |
| `frontend/src/app/pages/ocr-prices/ocr-prices.component.html` | **Nuevo** |
| `frontend/src/app/pages/ocr-prices/ocr-prices.component.css` | **Nuevo** |
| `frontend/src/app/services/ocr-price.service.ts` | **Nuevo** |
| `frontend/src/app/app.routes.ts` | **Modificar** — Añadir ruta |
| `frontend/src/app/pages/admin/admin.component.html` | **Modificar** — Añadir botón de navegación |

---

## Consideraciones técnicas

### Modelo de visión en Ollama

Ollama soporta modelos multimodales. Opciones recomendadas:
- `gemma3:12b` — Google, soporta visión, 12B params.
- `llama3.2-vision:11b` — Meta, 11B params.
- `llava:13b` — Clásico, más pesado pero fiable con OCR.
- `minicpm-v:8b` — Ligero, buen OCR en chino e inglés.

Para este caso de uso (OCR de texto manuscrito en español), `gemma3:12b` sería una buena primera opción por balance rendimiento/calidad.

El modelo se configura con la variable de entorno `AI_VISION_MODEL`.

### Formato de imagen para OpenAI Vision

El payload al endpoint `/v1/chat/completions` debe incluir la imagen como:
```json
{
  "model": "gemma3:12b",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "el prompt..." },
        { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,/9j/4AAQ..." } }
      ]
    }
  ]
}
```

### Seguridad

- El endpoint está protegido por `authenticateToken` + `requireAdmin`.
- La imagen se procesa en memoria (no se guarda en disco en la Fase 1).
- Tamaño máximo de imagen: 10MB (suficiente para una foto de móvil).
- Validación de tipo MIME: solo `image/jpeg` y `image/png`.

---

## Orden de implementación

1. **AI Gateway** — Ajustar límites de body parser.
2. **Backend** — Tipos, servicio OCR, controlador, rutas, montaje en index.
3. **Frontend** — Servicio, componente de cámara, página de resultados, ruta, enlace desde admin.
4. **Pruebas** — Probar con una foto real de una lista de precios.
5. **Iteración** — Ajustar el prompt según resultados.
