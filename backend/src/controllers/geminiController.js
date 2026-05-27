const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL  = 'claude-haiku-4-5-20251001';

async function callClaude(prompt, maxTokens = 3000) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada.');
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }
  const data = await response.json();
  const text = data?.content?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('La IA no devolvió JSON válido.');
  return JSON.parse(match[0]);
}

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

export async function generarEscenarioPitch(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada.' });
  const { respuestas } = req.body;
  if (!respuestas?.length) return res.status(400).json({ error: 'Proporciona las respuestas del diagnóstico.' });

  const resumenIdea = respuestas.map((r, i) => `P${i+1}: ${r.pregunta}\nR: ${r.respuesta}`).join('\n\n');

  const prompt = `Eres un experto en pitch competitions y ecosistemas de emprendimiento en Bolivia y Latinoamérica. Basándote en la siguiente idea de negocio, genera un escenario de pitch ÚNICO, específico y desafiante para que el estudiante practique.

IDEA DE NEGOCIO (diagnóstico):
${resumenIdea}

Responde ÚNICAMENTE con este JSON exacto (sin markdown ni texto extra):
{
  "audiencia": "Descripción específica de quién evalúa el pitch (máx 15 palabras)",
  "formato": "Formato y duración del pitch (ej: 4 minutos + 3 de preguntas)",
  "contexto": "Evento o situación específica donde ocurre el pitch (máx 20 palabras)",
  "perfil_evaluador": "Actitud y expectativas del evaluador (máx 20 palabras)",
  "condicion_especial": "Un giro o desafío adicional que complica el pitch (máx 25 palabras)",
  "dificultad": 7,
  "expectativas": "Qué necesita ver obligatoriamente este evaluador para interesarse (máx 30 palabras)",
  "pregunta_critica": "La pregunta más difícil que este evaluador hará al final del pitch (máx 20 palabras)"
}

REGLAS:
- dificultad: número entero 1-10, basado en la madurez de la idea y complejidad del escenario
- condicion_especial: debe ser realista y específica (no genérica), puede incluir: el evaluador ya invirtió en un competidor, acaba de ver 15 pitches, tiene experiencia fallida con ese sector, tiene solo 2 minutos, etc.
- audiencia y contexto deben ser variados y específicos de Bolivia o Latinoamérica
- NO uses siempre "inversor ángel" — varía: concurso universitario, banco de desarrollo, fondo de impacto, corporativo buscando innovación, ASFI, programa gubernamental, etc.`;

  try {
    const parsed = await callClaude(prompt);
    res.json(parsed);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}

export async function evaluarPitch(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada.' });
  const { escenario, pitch, respuestas } = req.body;
  if (!pitch?.trim()) return res.status(400).json({ error: 'El pitch no puede estar vacío.' });

  const resumenIdea = (respuestas || []).map((r, i) => `P${i+1}: ${r.respuesta}`).join(' | ');

  const prompt = `Eres un jurado experto en pitch competitions de startups en Latinoamérica. Evalúa el siguiente pitch considerando el escenario específico asignado.

ESCENARIO:
- Audiencia: ${escenario.audiencia}
- Formato: ${escenario.formato}
- Contexto: ${escenario.contexto}
- Perfil evaluador: ${escenario.perfil_evaluador}
- Condición especial: ${escenario.condicion_especial}
- Expectativas: ${escenario.expectativas}
- Pregunta crítica: ${escenario.pregunta_critica}

DIAGNÓSTICO DEL EMPRENDEDOR: ${resumenIdea}

PITCH PRESENTADO:
"${pitch}"

Responde ÚNICAMENTE con este JSON exacto (sin markdown ni texto extra):
{
  "puntuacion_total": 72,
  "dimensiones": {
    "claridad_problema":    { "puntos": 16, "max": 20, "comentario": "Comentario específico de 1-2 oraciones" },
    "propuesta_valor":      { "puntos": 14, "max": 20, "comentario": "Comentario específico de 1-2 oraciones" },
    "modelo_negocio":       { "puntos": 12, "max": 20, "comentario": "Comentario específico de 1-2 oraciones" },
    "equipo_credibilidad":  { "puntos": 15, "max": 20, "comentario": "Comentario específico de 1-2 oraciones" },
    "traccion_validacion":  { "puntos": 15, "max": 20, "comentario": "Comentario específico de 1-2 oraciones" }
  },
  "veredicto": "interes_condicionado",
  "razon_veredicto": "2-3 oraciones explicando la decisión del jurado considerando el escenario específico.",
  "pitch_ideal": "Texto completo (300-400 palabras) del pitch ideal para ESTE escenario específico, adaptado a la audiencia, formato y condición especial. Debe sonar natural y profesional.",
  "lineamientos_exito": [
    "Lo que haría a este pitch ganador en este escenario específico 1",
    "Lineamiento 2",
    "Lineamiento 3",
    "Lineamiento 4",
    "Lineamiento 5"
  ],
  "lineamientos_fracaso": [
    "Lo que hundiría este pitch en este escenario específico 1",
    "Riesgo 2",
    "Riesgo 3",
    "Riesgo 4",
    "Riesgo 5"
  ],
  "respuesta_pregunta_critica": "Cómo debería responder el emprendedor la pregunta crítica del escenario. 3-5 oraciones concretas y convincentes."
}

REGLAS:
- puntuacion_total: suma real de los 5 dimensiones (máx 100)
- veredicto: exactamente "inversion_aprobada" si >= 80, "interes_condicionado" si 60-79, "rechazado" si < 60
- Sé crítico y justo. Evalúa si el pitch realmente se adapta al escenario dado.
- pitch_ideal: debe mencionar explícitamente elementos del escenario (audiencia, condición especial)
- lineamientos_exito y lineamientos_fracaso: específicos para ESTE escenario, no genéricos`;

  try {
    const parsed = await callClaude(prompt);
    res.json(parsed);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}

export async function construirPitch(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada.' });
  const { escenario, respuestas } = req.body;
  if (!escenario || !respuestas?.length) return res.status(400).json({ error: 'Faltan datos del escenario o diagnóstico.' });

  const resumenIdea = respuestas.map((r, i) => `P${i+1}: ${r.respuesta}`).join(' | ');

  const prompt = `Eres un experto en pitch competitions y ecosistemas de emprendimiento en Bolivia y Latinoamérica. Tienes el diagnóstico de un emprendedor y un escenario específico. Construye el pitch ideal para ese escenario y proporciona el análisis completo.

ESCENARIO ASIGNADO:
- Audiencia: ${escenario.audiencia}
- Formato: ${escenario.formato}
- Contexto: ${escenario.contexto}
- Perfil evaluador: ${escenario.perfil_evaluador}
- Condición especial: ${escenario.condicion_especial}
- Expectativas: ${escenario.expectativas}
- Pregunta crítica: ${escenario.pregunta_critica}

DIAGNÓSTICO DEL EMPRENDEDOR: ${resumenIdea}

Responde ÚNICAMENTE con este JSON exacto (sin markdown ni texto extra):
{
  "pitch_generado": "Texto completo del pitch ideal (300-400 palabras). Debe sonar natural, profesional, estar adaptado al tipo de evaluador y mencionar explícitamente la condición especial del escenario.",
  "puntuacion_total": 88,
  "dimensiones": {
    "claridad_problema":    { "puntos": 18, "max": 20, "comentario": "Comentario específico sobre cómo el pitch aborda este aspecto" },
    "propuesta_valor":      { "puntos": 17, "max": 20, "comentario": "Comentario específico" },
    "modelo_negocio":       { "puntos": 17, "max": 20, "comentario": "Comentario específico" },
    "equipo_credibilidad":  { "puntos": 16, "max": 20, "comentario": "Comentario específico" },
    "traccion_validacion":  { "puntos": 20, "max": 20, "comentario": "Comentario específico" }
  },
  "veredicto": "inversion_aprobada",
  "razon_veredicto": "2-3 oraciones explicando por qué este pitch funciona para este evaluador específico en este contexto.",
  "lineamientos_exito": [
    "Elemento clave 1 que hace funcionar un pitch en ESTE escenario específico",
    "Elemento 2", "Elemento 3", "Elemento 4", "Elemento 5"
  ],
  "lineamientos_fracaso": [
    "Error fatal 1 que hundiría cualquier pitch en ESTE escenario específico",
    "Error 2", "Error 3", "Error 4", "Error 5"
  ],
  "respuesta_pregunta_critica": "Cómo responder: '${escenario.pregunta_critica}' — 3-5 oraciones concretas, con datos y argumentos del diagnóstico del emprendedor."
}

REGLAS:
- pitch_generado: adaptado al formato (tiempo), al perfil del evaluador y a la condición especial
- puntuacion_total: suma real de los 5 dimensiones. Para un pitch ideal espera 80-95
- veredicto: exactamente "inversion_aprobada" si >= 80, "interes_condicionado" si 60-79
- lineamientos_exito y lineamientos_fracaso: muy específicos para ESTE escenario, no genéricos
- respuesta_pregunta_critica: práctica y directa, usa datos del diagnóstico`;

  try {
    const parsed = await callClaude(prompt, 5000);
    res.json(parsed);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}

export async function validarHipotesis(req, res) {
  const { segmento, problema, solucion, diferenciador, experimento, metrica, umbral } = req.body;
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en el servidor.' });
  }
  if (!segmento?.trim() || !solucion?.trim()) {
    return res.status(400).json({ error: 'Completa al menos el segmento y la solución.' });
  }

  const hipotesis = `Creemos que "${segmento}" experimenta "${problema}". Nuestra solución "${solucion}" resuelve esto mejor que las alternativas porque "${diferenciador}".`;

  const prompt = `Eres un experto en metodología Lean Startup y validación de ideas de negocio en el contexto boliviano y latinoamericano. Simula la respuesta de 8 clientes potenciales reales ante la siguiente hipótesis de negocio, y proporciona un análisis de validación.

HIPÓTESIS:
${hipotesis}

EXPERIMENTO DISEÑADO: ${experimento || 'Entrevistas de problema'}
MÉTRICA DE VALIDACIÓN: ${metrica || 'Porcentaje de interés genuino'}
UMBRAL DE ÉXITO: ${umbral || 60}% de respuestas positivas

Responde ÚNICAMENTE con este JSON exacto (sin markdown, sin texto extra):
{
  "perfiles": [
    {
      "nombre": "Nombre, edad, perfil breve que coincida con el segmento boliviano",
      "respuesta": "Su reacción honesta y realista de 2-3 oraciones al escuchar la solución",
      "interes": "alto",
      "pagaria": true,
      "comentario_clave": "La frase más reveladora que diría este cliente (máx 15 palabras)"
    }
  ],
  "tasa_validacion": 62,
  "decision": "perseverar",
  "razon_decision": "2-3 oraciones explicando por qué se debe perseverar o pivotar basándose en los datos.",
  "evidencia_favor": ["evidencia concreta 1", "evidencia concreta 2", "evidencia concreta 3"],
  "evidencia_contra": ["obstáculo real 1", "obstáculo real 2", "obstáculo real 3"],
  "tipo_pivote": null,
  "proximos_pasos": ["acción concreta 1", "acción concreta 2", "acción concreta 3"],
  "insight_clave": "El aprendizaje más sorprendente o inesperado de esta simulación en 1-2 oraciones."
}

REGLAS ESTRICTAS:
- perfiles: exactamente 8 personas con perfiles variados y realistas para Bolivia (La Paz, Santa Cruz, Cochabamba, etc.)
- interes: exactamente "alto", "medio" o "bajo"
- pagaria: true o false
- tasa_validacion: número entero 0-100, calculado como % de perfiles con interés "alto" o "medio"
- decision: exactamente "perseverar" si tasa >= ${umbral || 60}, "pivotar_parcial" si tasa entre ${(umbral || 60) - 20} y ${(umbral || 60) - 1}, "pivotar" si tasa < ${(umbral || 60) - 20}
- tipo_pivote: si decision es "pivotar" o "pivotar_parcial", indica el tipo (ejemplo: "Segmento de clientes", "Propuesta de valor", "Canal de distribución", "Modelo de precios"). Si es "perseverar", pon null.
- Sé crítico y realista. No todas las ideas son buenas. Si el problema no es urgente o la solución no es diferenciada, la tasa debe ser baja (30-50%).`;

  try {
    const parsed = await callClaude(prompt);
    res.json(parsed);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: 'No se pudo interpretar la respuesta. Intenta de nuevo.' });
    }
    res.status(502).json({ error: err.message });
  }
}
