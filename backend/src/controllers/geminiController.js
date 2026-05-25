const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL  = 'claude-haiku-4-5-20251001';

export async function analizarNegocio(req, res) {
  const { nombre, problema, cliente } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no está configurada en el servidor.' });
  }
  if (!nombre?.trim() && !problema?.trim()) {
    return res.status(400).json({ error: 'Proporciona al menos el nombre o el problema del negocio.' });
  }

  const prompt = `Eres un analista de mercado experto en Bolivia y Latinoamérica. Analiza la siguiente idea de negocio en el contexto boliviano y responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin bloques de código, sin explicaciones adicionales, solo el JSON puro.

Idea de negocio:
- Nombre: "${nombre || 'Sin nombre'}"
- Problema que resuelve: "${problema || 'No especificado'}"
- Cliente objetivo: "${cliente || 'No especificado'}"

Devuelve exactamente este JSON:
{
  "resumen_ejecutivo": "3-4 oraciones sobre la idea en el contexto de Bolivia. Menciona oportunidades y desafíos específicos del país.",
  "mercado_potencial": "Descripción del tamaño de mercado en Bolivia, ciudades más relevantes y potencial de crecimiento.",
  "negocios_similares": [
    {
      "nombre": "Nombre del negocio boliviano o regional",
      "descripcion": "Qué hace brevemente",
      "ciudad": "La Paz o Santa Cruz o Cochabamba o Sucre o Oruro, etc.",
      "estado": "activo"
    }
  ],
  "tendencias": [
    {
      "titulo": "Nombre de la tendencia",
      "descripcion": "Descripción de 1-2 oraciones sobre cómo afecta al negocio en Bolivia",
      "impacto": "positivo"
    }
  ],
  "viabilidad": {
    "puntuacion": 0,
    "nivel": "Bajo",
    "descripcion": "2-3 oraciones explicando la viabilidad en el mercado boliviano actual.",
    "factores_favor": ["factor positivo 1", "factor positivo 2", "factor positivo 3", "factor positivo 4"],
    "factores_riesgo": ["riesgo 1", "riesgo 2", "riesgo 3", "riesgo 4"]
  },
  "recomendaciones": [
    "Recomendación concreta y accionable 1",
    "Recomendación 2",
    "Recomendación 3",
    "Recomendación 4",
    "Recomendación 5"
  ]
}

Reglas:
- negocios_similares: incluye 3 a 5 negocios reales o representativos de Bolivia o países vecinos
- tendencias: incluye 3 a 5 tendencias relevantes para Bolivia
- viabilidad.puntuacion: número entero del 1 al 10. Sé crítico y realista usando estos criterios:
  * 1-3 (Bajo): mercado inexistente o saturado en Bolivia, barreras legales altas, sin demanda comprobada, competencia establecida muy fuerte o idea inviable económicamente
  * 4-6 (Medio): mercado existe pero con competencia moderada, viabilidad condicionada a ejecución, riesgos importantes de capital o regulación, demanda incierta
  * 7-8 (Alto): mercado con demanda clara, diferenciación posible, barreras de entrada manejables, tendencias favorables en Bolivia
  * 9-10 (Muy alto): solo si la idea es claramente innovadora, sin competencia directa en Bolivia y con demanda urgente comprobada. NO uses 9 o 10 por defecto.
  IMPORTANTE: NO uses siempre 7. Evalúa objetivamente según los datos reales del negocio. Muchas ideas estudiantiles tienen puntuaciones entre 4 y 6.
- viabilidad.nivel: "Alto" si puntuacion >= 7, "Medio" si 4-6, "Bajo" si <= 3
- viabilidad.factores_favor y factores_riesgo: 4 ítems cada uno, específicos para Bolivia
- impacto en tendencias: exactamente "positivo", "neutral" o "negativo"
- estado en negocios_similares: exactamente "activo", "en crecimiento" o "cerrado"`;

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 2048,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `HTTP ${response.status}`;
      return res.status(502).json({ error: `Error de la API de Claude: ${msg}` });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text || '';

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(502).json({ error: 'Claude no devolvió JSON válido. Intenta de nuevo.' });
    }

    const parsed = JSON.parse(match[0]);
    res.json(parsed);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: 'No se pudo interpretar la respuesta. Intenta de nuevo.' });
    }
    res.status(500).json({ error: err.message });
  }
}
