import {
  BocadilloContext,
  OcrResultado,
  OcrAsignacion,
} from '../types/ocr';

const AI_API_URL = (process.env.AI_API_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_VISION_MODEL = process.env.AI_VISION_MODEL || process.env.AI_MODEL || 'gemma3:12b';
// Los modelos de razonamiento ("thinking") gastan tokens de completion en el
// razonamiento ANTES de emitir el contenido. Con un límite bajo (p.ej. 2048)
// se truncan razonando y devuelven content vacío. Generoso por defecto.
const AI_MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || '8192', 10);
// Para modelos de razonamiento: limita (o desactiva) el "pensar" antes de
// responder. Por defecto 'low' para evitar que un modelo "thinking" gaste todo
// el presupuesto razonando y deje `content` vacío (justo el fallo observado:
// finish_reason=stop, content=0 chars, reasoning=25k chars). Valores típicos:
// 'minimal' | 'low' | 'medium' | 'high'. Pon AI_REASONING_EFFORT='' para no
// enviarlo (los modelos que no lo soporten lo ignoran de todas formas).
const AI_REASONING_EFFORT = process.env.AI_REASONING_EFFORT ?? 'low';
const reasoningField = AI_REASONING_EFFORT ? { reasoning_effort: AI_REASONING_EFFORT } : {};

const TIPO_PAN_LABELS: Record<string, string> = {
  normal: 'Normal',
  integral: 'Integral',
  semillas: 'Semillas',
  tupper: 'Tupper',
};

/**
 * Una línea del pedido tal y como se envía a la tienda: los bocadillos con la
 * misma configuración se agrupan en una sola línea ("2x GRANDE - ...").
 */
interface LineaPedido {
  numero: number;
  descripcion: string;
  precioEstimado: number;
  bocadilloIds: string[];
}

/**
 * Agrupa los bocadillos con la MISMA clave y en el MISMO orden que el export
 * a WhatsApp del frontend (summary.component.ts). La lista manuscrita de la
 * foto sigue ese mismo orden, así que el emparejamiento puede ser posicional.
 */
export function buildLineasPedido(bocadillos: BocadilloContext[]): LineaPedido[] {
  const grupos = new Map<string, BocadilloContext[]>();
  for (const b of bocadillos) {
    const key = `${b.tamano}-${b.tipoPan}-${[...b.ingredientes].sort().join(',')}`;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(b);
  }

  return Array.from(grupos.values()).map((grupo, idx) => {
    const sample = grupo[0];
    const panLabel = TIPO_PAN_LABELS[sample.tipoPan] || sample.tipoPan;
    let descripcion = `${grupo.length}x ${sample.tamano === 'grande' ? 'GRANDE' : 'NORMAL'}`;
    descripcion += ` - Pan ${panLabel}`;
    descripcion += ` - Ingredientes: ${sample.ingredientes.join(', ')}`;
    if (sample.bocataPredefinido) descripcion += ` (${sample.bocataPredefinido})`;
    return {
      numero: idx + 1,
      descripcion,
      precioEstimado: sample.precioEstimado,
      bocadilloIds: grupo.map((b) => b.id),
    };
  });
}

function buildPrompt(lineas: LineaPedido[]): string {
  const lista = lineas
    .map((l) => `LÍNEA ${l.numero}: ${l.descripcion} | precio estimado por unidad: ${l.precioEstimado.toFixed(2)}€`)
    .join('\n');

  return `Eres un lector de precios. Tu ÚNICO objetivo es leer, para cada línea numerada de la foto, su PRECIO. NO necesitas leer ni transcribir los ingredientes.

CONTEXTO: Cada semana enviamos a la tienda esta lista numerada de bocadillos. La tienda apunta a mano el precio de cada línea y le hacemos una foto. La foto está CASI SIEMPRE EN EL MISMO ORDEN que esta lista.

LISTA ENVIADA A LA TIENDA (en este orden exacto):
${lista}

INSTRUCCIONES:
0. La foto puede estar rotada o inclinada (hecha con el móvil). Léela en cualquier orientación.
1. Cada línea de la foto empieza con su número rodeado por un círculo (①, ②, ③, ...). Ese número ES la LÍNEA. Empareja la ① con la LÍNEA 1, la ② con la LÍNEA 2, etc. La posición/número manda; NO hace falta que leas los ingredientes.
2. Una línea puede agrupar varias unidades y llevar el precio escrito como "2 x 4,40": en ese caso el precio POR UNIDAD es 4,40.
3. Los precios pueden venir con coma decimal ("5,60"), con € o solo el número. Devuélvelos como número con punto decimal y 2 decimales (ej: 5.60). El precio es POR UNIDAD aunque la línea sea "2x".
4. Si una línea de la foto está tachada o sin precio, no la asignes (ponla en "lineasNoEncontradas").
5. Plausibilidad: si el precio leído es más del doble o menos de la mitad del estimado, baja la confianza.
6. Confianza: "alta" si el precio se lee con claridad; "media" si dudas de algún dígito; "baja" si dudas del emparejamiento.

IMPORTANTE: NO deliberes sobre el significado de las palabras ni intentes transcribir los ingredientes. Si una palabra es ilegible, ignórala. Responde DIRECTAMENTE con el JSON, sin razonar en voz alta.

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:
{
  "lineas": [
    { "linea": 1, "precio": 5.60, "confianza": "alta", "textoLeido": "el precio tal como está escrito, p.ej. '2 x 4,40'" }
  ],
  "lineasNoEncontradas": [3],
  "textoNoAsignado": ["precio suelto de la foto que no corresponde a ninguna línea"]
}`;
}

export interface OcrTestResult {
  rawResponse: string;
  textoExtraido: string;
  preciosEncontrados: Array<{ texto: string; precio: number }>;
  modeloUsado: string;
  tiempoMs: number;
  tokensPrompt?: number;
  tokensCompletion?: number;
  tokensTotal?: number;
  finishReason?: string;
}

/**
 * Test OCR: analiza una imagen sin contexto de bocadillos.
 * Devuelve todo el texto que pueda leer y los precios que detecte.
 */
export async function testOcrImage(
  imagenBase64: string,
  mimeType: string,
): Promise<OcrTestResult> {
  const t0 = Date.now();
  const imagenSizeKB = (imagenBase64.length * 0.75 / 1024).toFixed(1);

  console.log('[OCR-TEST] ========================================');
  console.log(`[OCR-TEST] Inicio — ${new Date().toISOString()}`);
  console.log(`[OCR-TEST] Modelo: ${AI_VISION_MODEL}`);
  console.log(`[OCR-TEST] Gateway: ${AI_API_URL}/v1/chat/completions`);
  console.log(`[OCR-TEST] Imagen: ${mimeType}, ~${imagenSizeKB} KB base64`);

  const prompt = `Analiza esta imagen de una lista de precios escrita a mano en español.

Tu tarea:
1. Lee el texto que puedas ver en la imagen (nombres, números, precios, símbolos). Si una palabra es ilegible, pon tu mejor aproximación y sigue — NO deliberes palabra por palabra.
2. Identifica todos los precios que aparezcan (números con €, "eur", o formato monetario, p.ej. "4,40" o "2 x 4,40").
3. Para cada precio, indica el texto o nombre que tiene al lado.

NO razones en voz alta. Responde DIRECTAMENTE y ÚNICAMENTE con un JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:
{
  "textoExtraido": "todo el texto legible que ves en la imagen, línea por línea",
  "preciosEncontrados": [
    { "texto": "nombre o descripción junto al precio", "precio": 5.60 }
  ]
}`;

  const payload = {
    model: AI_VISION_MODEL,
    stream: false,
    temperature: 0.1,
    max_tokens: AI_MAX_TOKENS,
    ...reasoningField,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imagenBase64}` },
          },
        ],
      },
    ],
  };

  console.log(`[OCR-TEST] Enviando petición... (${prompt.length} chars prompt, max_tokens=${AI_MAX_TOKENS})`);

  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (AI_API_KEY) headers['x-api-key'] = AI_API_KEY;

  let response;
  try {
    response = await fetch(`${AI_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(110000),
    });
  } catch (fetchError: any) {
    console.error(`[OCR-TEST] Error fetch: ${fetchError.message}`);
    throw fetchError;
  }

  console.log(`[OCR-TEST] Respuesta HTTP: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    console.error(`[OCR-TEST] Error body (primeros 500 chars): ${errBody.slice(0, 500)}`);
    throw new Error(`AI gateway error ${response.status}: ${errBody.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string; reasoning?: string; reasoning_content?: string }; finish_reason?: string }>;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  const choice = data.choices?.[0];
  const reasoning = choice?.message?.reasoning || choice?.message?.reasoning_content || '';
  // Si el contenido viene vacío (modelo de razonamiento truncado), caemos al
  // texto de razonamiento: a veces el JSON quedó ahí antes del corte.
  const rawResponse: string = choice?.message?.content || reasoning || '';
  const finishReason = choice?.finish_reason;
  const tiempoMs = Date.now() - t0;

  console.log(`[OCR-TEST] Tiempo: ${tiempoMs}ms`);
  console.log(`[OCR-TEST] finish_reason=${finishReason ?? '?'} | content=${(choice?.message?.content || '').length} chars | reasoning=${reasoning.length} chars`);
  if (finishReason === 'length') {
    console.warn(`[OCR-TEST] ⚠️ Respuesta TRUNCADA por max_tokens (${AI_MAX_TOKENS}). Sube AI_MAX_TOKENS o usa un modelo de visión que no razone tanto.`);
  }
  console.log(`[OCR-TEST] Tokens: prompt=${data.usage?.prompt_tokens ?? '?'} completion=${data.usage?.completion_tokens ?? '?'} total=${data.usage?.total_tokens ?? '?'}`);
  console.log(`[OCR-TEST] Respuesta cruda (${rawResponse.length} chars):`);
  console.log(rawResponse.slice(0, 1000) + (rawResponse.length > 1000 ? '...' : ''));

  // Intentar parsear JSON de la respuesta
  let textoExtraido = rawResponse;
  let preciosEncontrados: Array<{ texto: string; precio: number }> = [];

  const jsonStr = extractJson(rawResponse, ['textoExtraido', 'preciosEncontrados']);
  if (jsonStr) {
    console.log(`[OCR-TEST] JSON extraído (${jsonStr.length} chars):`);
    console.log(jsonStr.slice(0, 1000));
    try {
      const parsed = JSON.parse(jsonStr);
      console.log(`[OCR-TEST] JSON parseado OK. Keys: ${Object.keys(parsed).join(', ')}`);
      if (parsed.textoExtraido) {
        textoExtraido = parsed.textoExtraido;
      }
      if (parsed.preciosEncontrados && Array.isArray(parsed.preciosEncontrados)) {
        console.log(`[OCR-TEST] preciosEncontrados array con ${parsed.preciosEncontrados.length} items`);
        preciosEncontrados = parsed.preciosEncontrados
          .filter((p: any, i: number) => {
            const ok = p && typeof p.precio === 'number' && !isNaN(p.precio);
            if (!ok) console.log(`[OCR-TEST]   [#${i}] DESCARTADO — precio="${p?.precio}" (${typeof p?.precio}) — ${JSON.stringify(p).slice(0, 100)}`);
            return ok;
          })
          .map((p: any) => ({
            texto: p.texto || '',
            precio: Math.round(p.precio * 100) / 100,
          }));
      } else {
        console.log(`[OCR-TEST] preciosEncontrados NO es array. Tipo: ${typeof parsed.preciosEncontrados}. Valor: ${JSON.stringify(parsed.preciosEncontrados)?.slice(0, 200)}`);
      }
    } catch (parseErr: any) {
      console.error(`[OCR-TEST] Error parseando JSON: ${parseErr.message}`);
    }
  } else {
    console.log('[OCR-TEST] No se pudo extraer JSON de la respuesta');
  }

  console.log(`[OCR-TEST] Resultado final: ${preciosEncontrados.length} precios encontrados`);
  for (const p of preciosEncontrados) {
    console.log(`[OCR-TEST]   → "${p.texto}" = ${p.precio.toFixed(2)}€`);
  }
  console.log('[OCR-TEST] ========================================');

  return {
    rawResponse,
    textoExtraido,
    preciosEncontrados,
    modeloUsado: AI_VISION_MODEL,
    tiempoMs,
    tokensPrompt: data.usage?.prompt_tokens,
    tokensCompletion: data.usage?.completion_tokens,
    tokensTotal: data.usage?.total_tokens,
    finishReason,
  };
}

/**
 * Extrae un objeto JSON *parseable* de la respuesta del modelo. Es robusto
 * frente a:
 *  - JSON envuelto en ```code fences```.
 *  - Modelos de razonamiento que emiten miles de caracteres de prosa y, quizá,
 *    un JSON al final. La regex greedy anterior (`/\{[\s\S]*\}/`) cogía del
 *    primer "{" al último "}" de TODO el texto → nunca parseaba.
 *
 * Escanea todos los objetos { ... } con balance de llaves (ignorando las que
 * aparezcan dentro de strings) y, recorriendo de atrás hacia delante (la
 * respuesta final suele ser el último objeto), devuelve el primero que parsee
 * y —si se piden `preferKeys`— que contenga alguna de esas claves. Si ninguno
 * tiene las claves esperadas, devuelve el último que simplemente parsee.
 */
function extractJson(raw: string, preferKeys: string[] = []): string | null {
  if (!raw) return null;
  let text = raw.trim();
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  const candidates: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') {
      if (depth++ === 0) start = i;
    } else if (ch === '}') {
      if (depth > 0 && --depth === 0 && start !== -1) {
        candidates.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }
  if (candidates.length === 0) return null;

  let fallback: string | null = null;
  for (let i = candidates.length - 1; i >= 0; i--) {
    let obj: unknown;
    try {
      obj = JSON.parse(candidates[i]);
    } catch {
      continue;
    }
    if (fallback === null) fallback = candidates[i];
    const hasKey =
      !preferKeys.length ||
      (obj !== null && typeof obj === 'object' && preferKeys.some((k) => k in (obj as object)));
    if (hasKey) return candidates[i];
  }
  return fallback;
}

export async function analyzePriceImage(
  imagenBase64: string,
  mimeType: string,
  bocadillos: BocadilloContext[],
): Promise<{
  resultado: OcrResultado;
  rawResponse: string;
}> {
  const t0 = Date.now();
  const lineas = buildLineasPedido(bocadillos);
  const systemPrompt = buildPrompt(lineas);

  console.log(`[OCR] Análisis: ${bocadillos.length} bocadillos en ${lineas.length} líneas, modelo=${AI_VISION_MODEL}, imagen=${mimeType} ~${(imagenBase64.length * 0.75 / 1024).toFixed(0)}KB`);

  const payload = {
    model: AI_VISION_MODEL,
    stream: false,
    temperature: 0.1,
    max_tokens: AI_MAX_TOKENS,
    ...reasoningField,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: systemPrompt },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imagenBase64}` },
          },
        ],
      },
    ],
  };

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (AI_API_KEY) headers['x-api-key'] = AI_API_KEY;

  const response = await fetch(`${AI_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(90000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`AI gateway error ${response.status}: ${errBody.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string; reasoning?: string; reasoning_content?: string }; finish_reason?: string }>;
  };
  const choice = data.choices?.[0];
  const content = choice?.message?.content || '';
  const reasoning = choice?.message?.reasoning || choice?.message?.reasoning_content || '';
  // Modelos de razonamiento ("thinking") a veces vuelcan TODO en `reasoning` y
  // dejan `content` vacío. Como último recurso intentamos rescatar el JSON del
  // texto de razonamiento.
  const contentEmpty = content.trim().length === 0;
  const rawResponse: string = content || reasoning || '';

  if (choice?.finish_reason === 'length') {
    console.warn(`[OCR] ⚠️ Respuesta TRUNCADA por max_tokens (${AI_MAX_TOKENS}). Sube AI_MAX_TOKENS.`);
  }
  if (contentEmpty && reasoning.length > 0) {
    console.warn('[OCR] ⚠️ content vacío: el modelo solo devolvió "razonamiento". Se intentará rescatar el JSON. Para evitarlo, configura AI_REASONING_EFFORT=minimal o usa un modelo de visión (p.ej. gemma3:12b) en AI_VISION_MODEL.');
  }
  console.log(`[OCR] Respuesta en ${Date.now() - t0}ms — finish_reason=${choice?.finish_reason ?? '?'}, content=${content.length} chars, reasoning=${reasoning.length} chars: ${rawResponse.slice(0, 500)}`);

  const resultado = parseOcrResponse(rawResponse, lineas, bocadillos, { contentEmpty });

  console.log(`[OCR] Resultado: ${resultado.asignaciones.length} asignaciones, ${resultado.noMapeados.length} sin mapear, ${resultado.preciosNoAsignados.length} entradas sueltas`);

  return { resultado, rawResponse };
}

interface LineaRespuesta {
  linea: number;
  precio: number;
  confianza: 'alta' | 'media' | 'baja';
  textoLeido?: string;
}

function parseOcrResponse(
  raw: string,
  lineas: LineaPedido[],
  bocadillos: BocadilloContext[],
  meta: { contentEmpty?: boolean } = {},
): OcrResultado {
  const fallido = (motivo: string): OcrResultado => ({
    asignaciones: [],
    noMapeados: bocadillos.map((b) => b.id),
    preciosNoAsignados: [motivo],
  });

  // Si el modelo no devolvió `content` y solo razonó, el mensaje al admin debe
  // ser accionable (es un problema de modelo/config, no de la foto).
  const sinRespuestaUtil =
    'El modelo no devolvió una respuesta válida (solo "razonamiento" interno, sin JSON). ' +
    'Configura AI_REASONING_EFFORT=minimal o cambia AI_VISION_MODEL a un modelo de visión como gemma3:12b.';

  const jsonStr = extractJson(raw, ['lineas', 'lineasNoEncontradas', 'textoNoAsignado']);
  if (!jsonStr) {
    return fallido(meta.contentEmpty ? sinRespuestaUtil : 'No se pudo extraer JSON de la respuesta del modelo.');
  }
  if (meta.contentEmpty) {
    console.log('[OCR] ℹ️ JSON rescatado del texto de razonamiento (content estaba vacío).');
  }

  let parsed: {
    lineas?: LineaRespuesta[];
    lineasNoEncontradas?: number[];
    textoNoAsignado?: string[];
  };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return fallido(meta.contentEmpty ? sinRespuestaUtil : 'No se pudo parsear el JSON de la respuesta del modelo.');
  }

  const lineasPorNumero = new Map(lineas.map((l) => [l.numero, l]));

  // Expandir cada línea con precio a una asignación por bocadillo del grupo
  const asignaciones: OcrAsignacion[] = [];
  const lineasAsignadas = new Set<number>();

  for (const item of Array.isArray(parsed.lineas) ? parsed.lineas : []) {
    const linea = lineasPorNumero.get(item?.linea);
    if (!linea || lineasAsignadas.has(linea.numero)) continue;
    if (typeof item.precio !== 'number' || isNaN(item.precio) || item.precio <= 0 || item.precio >= 100) continue;

    lineasAsignadas.add(linea.numero);
    const precio = Math.round(item.precio * 100) / 100;
    const confianza = ['alta', 'media', 'baja'].includes(item.confianza) ? item.confianza : 'media';
    for (const bocadilloId of linea.bocadilloIds) {
      asignaciones.push({ bocadilloId, precio, confianza });
    }
  }

  // Todo bocadillo cuya línea no recibió precio queda como no mapeado
  const noMapeados: string[] = lineas
    .filter((l) => !lineasAsignadas.has(l.numero))
    .flatMap((l) => l.bocadilloIds);

  const preciosNoAsignados: string[] = Array.isArray(parsed.textoNoAsignado)
    ? parsed.textoNoAsignado.filter((t): t is string => typeof t === 'string').slice(0, 20)
    : [];

  return { asignaciones, noMapeados, preciosNoAsignados };
}
