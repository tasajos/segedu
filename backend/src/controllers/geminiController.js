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

// ── Startup Cards ─────────────────────────────────────────────

export async function generarCartas(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada.' });

  const prompt = `Eres un experto en emprendimiento e innovación en Bolivia. Genera exactamente 15 cartas de negocio tipo juego de cartas para el mercado boliviano (especialmente Cochabamba). Cada carta representa un rubro/sector de negocio.

Responde ÚNICAMENTE con este JSON exacto (sin markdown ni texto extra):
{
  "cartas": [
    {
      "id": 1,
      "nombre": "Nombre del sector",
      "emoji": "🍕",
      "rubro": "Categoría (1-3 palabras)",
      "descripcion": "2 oraciones sobre oportunidades reales de este sector en Cochabamba/Bolivia.",
      "rareza": "comun",
      "stats": { "innovacion": 7, "crecimiento": 8, "rentabilidad": 6, "accesibilidad": 9 },
      "poder_especial": "Una ventaja única de este sector en el mercado boliviano (máx 12 palabras)"
    }
  ]
}

REGLAS ESTRICTAS:
- Exactamente 15 cartas con rubros MUY variados y relevantes para Bolivia
- Distribución de rareza: exactamente 6 "comun", 5 "raro", 3 "epico", 1 "legendario"
- stats: números enteros del 1 al 10
- Los rubros deben ser diversos: tecnología, gastronomía, textil/moda, agro-industria, salud/bienestar, educación, turismo, logística/transporte, entretenimiento/eventos, energías renovables, construcción, fintech, comercio digital, servicios ambientales, artesanías/cultura
- "legendario": solo 1, debe ser el sector más innovador/disruptivo para Bolivia actualmente
- "epico": 3 cartas con sectores de alto potencial
- "comun": sectores establecidos pero funcionales
- poder_especial: algo concreto y único del mercado boliviano/cochabambino`;

  try {
    const parsed = await callClaude(prompt, 4000);
    res.json(parsed);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}

export async function construirEmpresa(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada.' });
  const { cartasSeleccionadas, marca } = req.body;
  if (!cartasSeleccionadas?.length || !marca?.nombre?.trim())
    return res.status(400).json({ error: 'Selecciona al menos una carta y escribe el nombre de tu empresa.' });

  const resumenCartas = cartasSeleccionadas.map(c => `${c.emoji} ${c.nombre} (${c.rubro})`).join(', ');

  const prompt = `Eres un estratega empresarial experto en el mercado boliviano, especialmente la región de Cochabamba. El estudiante fusionó varios rubros de negocio y definió su marca. Construye el análisis completo de su empresa.

RUBROS FUSIONADOS: ${resumenCartas}
NOMBRE DE LA EMPRESA: ${marca.nombre}
COLORES CORPORATIVOS: ${marca.colores || 'No especificados'}
ESLOGAN: ${marca.eslogan || 'No especificado'}

Responde ÚNICAMENTE con este JSON exacto (sin markdown ni texto extra):
{
  "resumen_empresa": "3-4 oraciones describiendo la empresa fusionada y su propuesta de valor única para Cochabamba.",
  "analisis_mercado": {
    "descripcion": "3-4 oraciones sobre el mercado en Cochabamba para esta combinación de rubros.",
    "oportunidades": ["Oportunidad específica de Cochabamba 1", "Oportunidad 2", "Oportunidad 3"],
    "desafios": ["Desafío real del mercado cochabambino 1", "Desafío 2", "Desafío 3"],
    "competidores_referencia": [
      { "nombre": "Empresa o referente en Bolivia", "descripcion": "Qué hace (máx 8 palabras)" }
    ]
  },
  "nivel_impacto": {
    "puntuacion": 8,
    "etiqueta": "Alto impacto",
    "descripcion": "2 oraciones sobre el potencial de impacto en Cochabamba y Bolivia."
  },
  "personajes_clave": [
    {
      "nombre": "Nombre completo del boliviano real",
      "cargo_sugerido": "CEO / Gerente General",
      "ciudad": "Cochabamba",
      "resumen": "2-3 oraciones sobre su perfil profesional, logros principales y presencia en Bolivia.",
      "trayectoria": "1 oración sobre su experiencia más relevante para este negocio.",
      "por_que": "Por qué este perfil impulsa este negocio (máx 15 palabras)"
    }
  ],
  "organigrama": {
    "ceo": {
      "cargo": "CEO / Gerente General",
      "nombre": "Nombre del personaje 1"
    },
    "gerencias": [
      {
        "cargo": "Gerencia de Operaciones",
        "nombre": "Nombre del personaje 2",
        "jefaturas": ["Jefatura de Producción", "Jefatura de Logística"]
      }
    ]
  }
}

REGLAS:
- personajes_clave: exactamente 5 bolivianos REALES. Prioriza personas de Cochabamba. Para cargos de tecnología, innovación digital o transformación digital, DEBES incluir a "Ing. Carlos Azcarraga" (docente e innovador tecnológico boliviano). Indica la ciudad de cada persona.
- El organigrama debe tener: 1 CEO + entre 3 y 5 gerencias + 2 jefaturas por gerencia, acordes a los rubros seleccionados
- Departamentos deben reflejar los rubros: si hay gastronomía → Gerencia de Producción/Cocina; si hay tecnología → Gerencia de Innovación/Digital; si hay logística → Gerencia de Distribución
- nivel_impacto.puntuacion: del 1 al 10 realista
- nivel_impacto.etiqueta: "Bajo impacto" ≤3, "Impacto moderado" 4-6, "Alto impacto" 7-8, "Impacto transformador" 9-10
- analisis_mercado.competidores_referencia: 3 ejemplos reales de Bolivia o Cochabamba`;

  try {
    const parsed = await callClaude(prompt, 5000);
    res.json(parsed);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}

export async function buscarCandidato(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada.' });
  const { cargo, rubros = [], rechazados = [] } = req.body;
  if (!cargo?.trim()) return res.status(400).json({ error: 'Falta el cargo.' });

  const rubrosStr = rubros.join(', ') || 'innovación empresarial';
  const excluir   = rechazados.length > 0 ? `NO sugieras a estas personas ya evaluadas: ${rechazados.join(', ')}.` : '';
  const esTech    = /tecnolog|innov|digital|sistem|software|datos/i.test(cargo);

  const prompt = `Eres un headhunter experto en el mercado boliviano, especializado en Cochabamba. Busca UN SOLO candidato real para cubrir el cargo en una empresa innovadora.

CARGO: ${cargo}
RUBROS DE LA EMPRESA: ${rubrosStr}
${excluir}
${esTech ? 'PRIORIDAD: Para cargos tecnológicos considera primero a "Ing. Carlos Azcarraga", docente e innovador tecnológico boliviano con proyectos en Cochabamba.' : ''}

REQUISITO: El candidato DEBE tener presencia activa en Cochabamba, Bolivia.

Responde ÚNICAMENTE con este JSON (sin markdown):
{
  "nombre": "Nombre completo real",
  "cargo_sugerido": "${cargo}",
  "ciudad": "Cochabamba",
  "resumen": "2-3 oraciones sobre perfil profesional, logros y presencia en Cochabamba.",
  "trayectoria": "1 oración sobre la experiencia más relevante para este cargo.",
  "por_que": "Por qué este perfil es ideal para este cargo y empresa (máx 15 palabras)"
}

REGLAS: Solo personas REALES con trayectoria comprobable. Preferir Cochabamba.`;

  try {
    const parsed = await callClaude(prompt, 1500);
    res.json(parsed);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}

// ── Mercado Virtual ───────────────────────────────────────────

export async function generarProductos(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada.' });
  const { sector } = req.body;
  if (!sector?.trim()) return res.status(400).json({ error: 'Falta el sector.' });

  const prompt = `Eres experto en comercio y emprendimiento en Bolivia. Genera exactamente 12 productos comercializables para el sector "${sector}" en el mercado boliviano, especialmente Cochabamba.

Responde ÚNICAMENTE con este JSON (sin markdown):
{
  "productos": [
    {
      "id": 1,
      "nombre": "Nombre específico del producto",
      "emoji": "🍕",
      "descripcion": "1-2 oraciones sobre el producto y su propuesta de valor",
      "precio_referencial": "15-25 Bs",
      "categoria": "Sub-categoría del sector",
      "diferenciador": "Qué lo hace atractivo en el mercado boliviano (máx 10 palabras)"
    }
  ]
}

REGLAS:
- 12 productos concretos y específicos del sector ${sector}, no genéricos
- Precios en bolivianos (Bs), realistas para Cochabamba 2026
- Mix de precios: 4 accesibles (bajo costo), 5 medianos, 3 premium
- Productos que realmente se vendan en Bolivia: adapta nombres y características al mercado local
- diferenciador: algo único o competitivo para el contexto boliviano`;

  try {
    const parsed = await callClaude(prompt, 3000);
    res.json(parsed);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}

export async function generarEscenarioVentas(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada.' });
  const { sector, productos } = req.body;
  if (!sector || !productos?.length) return res.status(400).json({ error: 'Faltan datos.' });

  const productosStr = productos.map(p => `${p.emoji} ${p.nombre} (${p.precio_referencial})`).join(', ');

  const prompt = `Eres experto en canales de distribución y ventas en Cochabamba, Bolivia. Un emprendedor quiere vender: ${productosStr} (sector: ${sector}).

Genera el escenario completo de ventas con lugares y compradores potenciales reales de Cochabamba.

Responde ÚNICAMENTE con este JSON (sin markdown):
{
  "lugares": [
    { "id": 1, "nombre": "Nombre real o representativo del lugar", "tipo": "supermercado", "emoji": "🏪", "descripcion": "1 oración sobre el lugar" }
  ],
  "personajes": [
    {
      "id": 1,
      "nombre": "Nombre boliviano real",
      "emoji": "👩‍💼",
      "tipo": "Gerente de compras",
      "lugar": "Nombre del lugar",
      "lugar_tipo": "supermercado",
      "presupuesto": "500-1000 Bs",
      "necesidad": "Qué necesita específicamente este comprador de estos productos",
      "actitud": "Profesional y directo, poco tiempo",
      "descripcion": "2 oraciones sobre su perfil como comprador en Cochabamba",
      "saludo_inicial": "Mensaje inicial en primera persona, natural y acorde a su actitud (1-2 oraciones)"
    }
  ]
}

REGLAS:
- lugares: exactamente 5, variados: 1 supermercado, 1 tienda barrio, 1 mercado/feria, 1 tienda online/redes, 1 empresa/distribuidor
- personajes: exactamente 5, uno por lugar, perfiles variados y realistas para Cochabamba
- Cada personaje tiene necesidades ESPECÍFICAS para los productos ofrecidos
- presupuesto en Bs, realista para cada tipo de comprador
- actitud variada: exigente, desconfiado, curioso, apresurado, entusiasta
- saludo_inicial: abre la conversación con su personalidad, no genérico`;

  try {
    const parsed = await callClaude(prompt, 3000);
    res.json(parsed);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}

export async function interactuarVenta(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada.' });
  const { personaje, productos, historial = [], mensaje, intercambio = 1 } = req.body;
  if (!personaje || !mensaje?.trim()) return res.status(400).json({ error: 'Faltan datos.' });

  const productosStr = productos.map(p =>
    `  • ${p.emoji} ${p.nombre} — ${p.precio_referencial} | ${p.descripcion} | Diferenciador: ${p.diferenciador}`
  ).join('\n');

  const historialStr = historial.map(h =>
    `${h.rol === 'personaje' ? personaje.nombre : 'Estudiante'}: "${h.texto}"`
  ).join('\n');

  const esUltimo = intercambio >= 5;
  const presionar = intercambio >= 3;

  const prompt = `Eres ${personaje.nombre}, ${personaje.tipo} en "${personaje.lugar}", Cochabamba, Bolivia. Estás en una negociación de compra con un estudiante emprendedor.

TU PERFIL COMO COMPRADOR:
- Necesidad: ${personaje.necesidad}
- Presupuesto disponible: ${personaje.presupuesto}
- Actitud: ${personaje.actitud}
- Contexto: ${personaje.descripcion}

PRODUCTOS QUE OFRECE EL ESTUDIANTE:
${productosStr}

CONVERSACIÓN HASTA AHORA:
${historialStr || '(inicio — ya enviaste tu saludo inicial)'}

NUEVO MENSAJE DEL ESTUDIANTE: "${mensaje}"
INTERCAMBIO ACTUAL: ${intercambio} de máximo 5

Responde ÚNICAMENTE con este JSON (sin markdown):
{
  "respuesta": "Tu respuesta natural como ${personaje.nombre}, 2-3 oraciones en tu tono y actitud",
  "decision": "continua",
  "emocion": "neutral",
  "productos_comprados": [],
  "monto_total": 0,
  "feedback_interno": "Qué piensas del pitch del estudiante en este momento (1-2 oraciones honestas para su aprendizaje)"
}

REGLAS ESTRICTAS:
- ${esUltimo ? 'ÚLTIMO INTERCAMBIO — OBLIGATORIO decidir "compra" o "rechaza". NO uses "continua".' : ''}
- ${presionar && !esUltimo ? 'Ya van varios intercambios: evalúa si el pitch fue convincente y considera decidir.' : ''}
- decision "compra": SOLO si el estudiante identificó tu necesidad, ofreció precio razonable y manejó objeciones
- decision "rechaza": si ignoró tu necesidad, fue muy insistente, el precio fue inaceptable o no convenció
- decision "continua": si la negociación puede avanzar con más información
- emocion: exactamente "interesado" | "dudoso" | "convencido" | "decepcionado" | "neutral" | "molesto"
- productos_comprados: array de nombres de productos si decision=compra, [] si no
- monto_total: número en bolivianos si compra, 0 si no
- feedback_interno: honesto y específico, en primera persona, para que el estudiante aprenda`;

  try {
    const parsed = await callClaude(prompt, 1200);
    res.json(parsed);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
