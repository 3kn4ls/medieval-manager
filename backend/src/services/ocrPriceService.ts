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
