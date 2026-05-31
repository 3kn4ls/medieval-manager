import {
  BocadilloContext,
  OcrResultado,
  OcrAsignacion,
} from '../types/ocr';

const AI_API_URL = (process.env.AI_API_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_VISION_MODEL = process.env.AI_VISION_MODEL || process.env.AI_MODEL || 'gemma3:12b';

function buildPrompt(bocadillos: BocadilloContext[]): string {
  const lista = bocadillos.map((b) => {
    const extras: string[] = [];
    if (b.bocataPredefinido) extras.push(`predefinido: ${b.bocataPredefinido}`);
    return [
      `ID: ${b.id}`,
      `Persona: ${b.nombre}`,
      `Tamaño: ${b.tamano === 'grande' ? 'Grande' : 'Normal'}`,
      `Pan: ${b.tipoPan}`,
      `Ingredientes: ${b.ingredientes.join(', ')}`,
      `Precio estimado: ${b.precioEstimado.toFixed(2)}€`,
      ...extras,
    ].join(' | ');
  }).join('\n');

  return `Eres un asistente que analiza imágenes de listas de precios escritas a mano.

Te voy a dar:
1. Una imagen de una lista de precios de bocadillos escrita a mano (bolígrafo sobre papel).
2. Una lista de los bocadillos pedidos esta semana con sus ingredientes y precios estimados.

Tu tarea:
- Lee los precios que aparecen en la imagen.
- Relaciona cada entrada de la imagen con el bocadillo correspondiente de la lista.
- Para cada bocadillo que encuentres en la imagen, indica el precio exacto y tu confianza (alta/media/baja).
- Si hay entradas en la imagen que no corresponden a ningún bocadillo de la lista, indícalo.
- Si hay bocadillos de la lista que no encuentras en la imagen, indícalo.
- Los precios deben ser números con hasta 2 decimales (ej: 5.60).
- Ignora cualquier texto que no sea un precio o un nombre de bocadillo/persona.

LISTA DE BOCADILLOS DE ESTA SEMANA:
${lista}

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:
{
  "asignaciones": [
    { "bocadilloId": "el ID exacto de la lista", "precio": 5.60, "confianza": "alta" }
  ],
  "noMapeados": ["bocadilloId1", "bocadilloId2"],
  "preciosNoAsignados": ["descripción de la entrada no emparejada"]
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
1. Lee TODO el texto que puedas ver en la imagen (nombres, números, precios, símbolos).
2. Identifica todos los precios que aparezcan (números con €, "eur", o formato monetario).
3. Para cada precio, indica el texto o nombre que tiene al lado.

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:
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
    max_tokens: 2048,
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

  console.log(`[OCR-TEST] Enviando petición... (${prompt.length} chars prompt)`);

  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (AI_API_KEY) headers['x-api-key'] = AI_API_KEY;

  let response;
  try {
    response = await fetch(`${AI_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
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
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  const rawResponse: string = data.choices?.[0]?.message?.content || '';
  const tiempoMs = Date.now() - t0;

  console.log(`[OCR-TEST] Tiempo: ${tiempoMs}ms`);
  console.log(`[OCR-TEST] Tokens: prompt=${data.usage?.prompt_tokens ?? '?'} completion=${data.usage?.completion_tokens ?? '?'} total=${data.usage?.total_tokens ?? '?'}`);
  console.log(`[OCR-TEST] Respuesta cruda (${rawResponse.length} chars):`);
  console.log(rawResponse.slice(0, 1000) + (rawResponse.length > 1000 ? '...' : ''));

  // Intentar parsear JSON de la respuesta
  let textoExtraido = rawResponse;
  let preciosEncontrados: Array<{ texto: string; precio: number }> = [];

  const jsonStr = extractJson(rawResponse);
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
  };
}

function extractJson(raw: string): string | null {
  let text = raw.trim();
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : null;
}

export async function analyzePriceImage(
  imagenBase64: string,
  mimeType: string,
  bocadillos: BocadilloContext[],
): Promise<{
  resultado: OcrResultado;
  rawResponse: string;
}> {
  const systemPrompt = buildPrompt(bocadillos);

  const payload = {
    model: AI_VISION_MODEL,
    stream: false,
    temperature: 0.1,
    max_tokens: 2048,
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
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`AI gateway error ${response.status}: ${errBody.slice(0, 300)}`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const rawResponse: string = data.choices?.[0]?.message?.content || '';

  const resultado = parseOcrResponse(rawResponse, bocadillos);

  return { resultado, rawResponse };
}

function parseOcrResponse(raw: string, bocadillos: BocadilloContext[]): OcrResultado {
  const validIds = new Set(bocadillos.map((b) => b.id));

  // Intentar extraer JSON del texto (puede venir envuelto en ```json ... ```)
  let jsonStr = raw.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  let parsed: OcrResultado;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // Intentar encontrar un objeto JSON en el texto
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return {
          asignaciones: [],
          noMapeados: bocadillos.map((b) => b.id),
          preciosNoAsignados: ['No se pudo parsear la respuesta del modelo'],
        };
      }
    } else {
      return {
        asignaciones: [],
        noMapeados: bocadillos.map((b) => b.id),
        preciosNoAsignados: ['No se pudo parsear la respuesta del modelo'],
      };
    }
  }

  // Validar y limpiar asignaciones
  const asignaciones: OcrAsignacion[] = (parsed.asignaciones || [])
    .filter((a: OcrAsignacion) => validIds.has(a.bocadilloId) && typeof a.precio === 'number' && a.precio > 0)
    .map((a: OcrAsignacion) => ({
      bocadilloId: a.bocadilloId,
      precio: Math.round(a.precio * 100) / 100,
      confianza: ['alta', 'media', 'baja'].includes(a.confianza) ? a.confianza : 'media',
    }));

  // Validar noMapeados
  const noMapeados: string[] = (parsed.noMapeados || [])
    .filter((id: string) => validIds.has(id));

  // Marcar los bocadillos que no aparecen ni en asignaciones ni en noMapeados
  const mencionados = new Set([
    ...asignaciones.map((a) => a.bocadilloId),
    ...noMapeados,
  ]);
  for (const b of bocadillos) {
    if (!mencionados.has(b.id)) {
      noMapeados.push(b.id);
    }
  }

  return {
    asignaciones,
    noMapeados,
    preciosNoAsignados: parsed.preciosNoAsignados || [],
  };
}
