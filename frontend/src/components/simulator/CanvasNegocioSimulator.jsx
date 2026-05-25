import { useState } from 'react';

// ── Datos ─────────────────────────────────────────────────────────────────────

const ADVISORS = [
  {
    id: 'inversionista', label: 'Inversionista', icon: '🏦',
    color: '#1d4ed8', bg: '#dbeafe',
    description: 'Evalúa ROI, escalabilidad y atractivo para inversores de capital de riesgo.',
  },
  {
    id: 'cliente', label: 'Cliente exigente', icon: '😤',
    color: '#dc2626', bg: '#fee2e2',
    description: 'Cuestiona cada bloque desde la perspectiva del usuario final más crítico.',
  },
  {
    id: 'marketing', label: 'Experto en marketing', icon: '📱',
    color: '#d97706', bg: '#fef3c7',
    description: 'Optimiza posicionamiento, mensajes y estrategias de adquisición de clientes.',
  },
  {
    id: 'mentor', label: 'Mentor emprendedor', icon: '🎓',
    color: '#7c3aed', bg: '#ede9fe',
    description: 'Guía estratégica integral para fortalecer el modelo en etapa temprana.',
  },
  {
    id: 'financiero', label: 'Analista financiero', icon: '📊',
    color: '#16a34a', bg: '#dcfce7',
    description: 'Proyecciones, estructura de costos, métricas y punto de equilibrio.',
  },
];

const BLOCKS = [
  {
    id: 'aliados', label: 'Aliados clave', icon: '🤝', area: 'aliados',
    hint: 'Socios y proveedores estratégicos que hacen funcionar tu modelo.',
    questions: [
      '¿Quiénes son tus socios estratégicos?',
      '¿Qué recursos u actividades obtienes de ellos?',
      '¿Qué alianza reduce costos o riesgo?',
    ],
    prompts: {
      inversionista: c => `Actúa como un inversionista de capital de riesgo evaluando "${c.n}". ¿Qué alianzas estratégicas harían este negocio más atractivo para inversión, reducirían el riesgo y acelerarían el crecimiento? El problema que resuelve es: "${c.p}". Sé específico y crítico.`,
      cliente:       c => `Actúa como un cliente muy exigente de "${c.n}". ¿Qué alianzas con otras empresas necesitarías ver para confiar plenamente en este negocio? ¿Qué certificaciones o socios te darían mayor confianza? Sé directo.`,
      marketing:     c => `Actúa como experto en marketing digital. Para "${c.n}", ¿qué alianzas de co-marketing, distribución o influencia serían más poderosas para llegar a "${c.cl}"? Propón tácticas concretas de crecimiento vía alianzas.`,
      mentor:        c => `Actúa como mentor de emprendimiento experimentado. Para "${c.n}", un negocio que resuelve "${c.p}", ¿cuáles son los aliados más críticos en etapa temprana? ¿Cómo identificarlos, abordarlos y convencerlos? Dame pasos accionables.`,
      financiero:    c => `Actúa como analista financiero evaluando "${c.n}". ¿Qué alianzas reducirían los costos operativos o abrirían nuevas fuentes de ingreso? Analiza el impacto financiero de cada tipo de alianza propuesta.`,
    },
  },
  {
    id: 'problema', label: 'Problema', icon: '🎯', area: 'problema',
    hint: 'El dolor real de tu cliente que justifica la existencia del negocio.',
    questions: [
      '¿Cuál es el dolor principal del cliente?',
      '¿Cómo lo resuelven hoy con alternativas?',
      '¿Por qué las soluciones actuales fallan?',
    ],
    prompts: {
      inversionista: c => `Actúa como inversionista evaluando "${c.n}". ¿Es el problema "${c.p}" lo suficientemente grande y urgente para justificar inversión? ¿Cómo validarías que existe ese dolor en el mercado de "${c.cl}"? Sé escéptico y cuantifica el tamaño del problema.`,
      cliente:       c => `Actúa como un cliente típico de "${c.n}" (perfil: ${c.cl || 'cliente objetivo'}). Describe en primera persona cómo vives el problema de "${c.p}" actualmente. ¿Qué tan frecuente y doloroso es? ¿Qué soluciones usas hoy? ¿Por qué no te satisfacen?`,
      marketing:     c => `Actúa como experto en marketing. ¿Cómo describirías el problema "${c.p}" de forma que resuene emocionalmente con "${c.cl}"? Sugiere mensajes y encuadres narrativos que comuniquen el dolor y la urgencia de resolverlo.`,
      mentor:        c => `Actúa como mentor de emprendimiento. Para "${c.n}", profundiza en el problema "${c.p}": ¿es "vitamina" (nice-to-have) o "analgésico" (necesidad urgente)? ¿Cómo validar el problema antes de construir la solución? Dame un plan de discovery en 2 semanas.`,
      financiero:    c => `Actúa como analista financiero. Cuantifica el costo del problema "${c.p}" para "${c.cl}": ¿cuánto les cuesta no resolverlo en tiempo, dinero y oportunidad perdida? Esto define el precio máximo que pagarían y el mercado potencial.`,
    },
  },
  {
    id: 'actividades', label: 'Actividades clave', icon: '⚙️', area: 'actividades',
    hint: 'Las tareas esenciales que debes ejecutar bien para entregar tu propuesta.',
    questions: [
      '¿Qué actividades son críticas para tu propuesta de valor?',
      '¿Cuáles no puedes dejar de hacer nunca?',
      '¿Cuáles son más costosas o complejas?',
    ],
    prompts: {
      inversionista: c => `Actúa como inversionista evaluando "${c.n}". ¿Cuáles son las actividades clave que crean mayor valor y ventaja competitiva difícil de replicar? ¿Dónde debería concentrarse la inversión inicial para escalar más rápido?`,
      cliente:       c => `Actúa como cliente exigente de "${c.n}". ¿Qué actividades behind-the-scenes son imprescindibles para que tu experiencia sea consistente y de calidad? ¿Qué suelen descuidar los competidores en este sector?`,
      marketing:     c => `Actúa como experto en crecimiento (growth hacking). Para "${c.n}" dirigido a "${c.cl}", ¿cuáles son las actividades de marketing y growth más críticas en los primeros 90 días? Prioriza por impacto en adquisición y conversión.`,
      mentor:        c => `Actúa como mentor de emprendimiento. Para "${c.n}", lista las 5 actividades clave más importantes ordenadas por impacto. ¿Cuáles se pueden delegar, automatizar o tercerizar? ¿Cuáles debe hacer el fundador personalmente?`,
      financiero:    c => `Actúa como analista financiero. Para cada actividad clave de "${c.n}", estima el costo mensual (personal, tiempo, tecnología). ¿Cuáles tienen mejor relación costo-impacto? ¿Cuáles deberían tercerizarse vs. hacerse in-house?`,
    },
  },
  {
    id: 'propuesta', label: 'Propuesta de valor', icon: '💡', area: 'propuesta',
    hint: 'El valor único que ofreces. Por qué te elegirán a ti y no a la competencia.',
    questions: [
      '¿Qué problema resuelves mejor que nadie?',
      '¿Qué gana el cliente con tu solución?',
      '¿Qué te hace diferente o único?',
    ],
    prompts: {
      inversionista: c => `Actúa como inversionista de riesgo evaluando "${c.n}". ¿La propuesta de valor es lo suficientemente diferenciada para crear una ventaja competitiva sostenible? ¿Qué la protege de la imitación? ¿Hay un "moat" (foso competitivo)? Sé brutalmente honesto.`,
      cliente:       c => `Actúa como el cliente más escéptico de "${c.n}". ¿La propuesta de valor realmente resuelve mi problema de "${c.p}"? ¿Por qué debería elegirlos sobre las alternativas que ya uso? Convénceme en 30 segundos con un elevator pitch.`,
      marketing:     c => `Actúa como experto en copywriting y posicionamiento. Para "${c.n}", crea 3 versiones de la propuesta de valor: una para redes sociales (15 palabras), una para landing page (50 palabras) y una para presentación a clientes (150 palabras). Optimiza para "${c.cl}".`,
      mentor:        c => `Actúa como mentor de emprendimiento. Aplica el framework "Jobs-to-be-Done" y el concepto de "Value Proposition Canvas" para refinar la propuesta de valor de "${c.n}". ¿Es un pain reliever, un gain creator, o ambos? ¿Cómo medirías si funciona?`,
      financiero:    c => `Actúa como analista financiero. Para "${c.n}", ¿cuánto vale monetariamente la propuesta de valor para "${c.cl}"? Ayúdame a calcular el valor económico entregado (EVE), justificar el precio de la solución y calcular el margen bruto potencial.`,
    },
  },
  {
    id: 'relacion', label: 'Relación con clientes', icon: '💬', area: 'relacion',
    hint: 'Cómo interactúas, atraes y fidelizas a tus clientes.',
    questions: [
      '¿Cómo adquieres nuevos clientes?',
      '¿Cómo los retienes y fidelizas?',
      '¿Es autoservicio, personalizado o comunidad?',
    ],
    prompts: {
      inversionista: c => `Actúa como inversionista evaluando "${c.n}". Analiza la estrategia de relación con clientes: ¿qué LTV (valor de vida del cliente) y churn rate esperarías? ¿El modelo de adquisición y retención es escalable y económicamente viable? ¿El NPS esperado es alto?`,
      cliente:       c => `Actúa como un cliente leal pero exigente de "${c.n}". ¿Qué tipo de relación espero con esta empresa? ¿Prefiero autoservicio o atención personalizada? ¿Qué me haría recomendarlos a 3 amigos? ¿Qué me haría irme con la competencia sin dudarlo?`,
      marketing:     c => `Actúa como experto en marketing de retención (retention marketing). Para "${c.n}", diseña un customer journey completo: desde que "${c.cl}" descubre el producto hasta que se convierte en promotor. Incluye touchpoints clave, contenido en cada etapa y métricas.`,
      mentor:        c => `Actúa como mentor de emprendimiento. Para "${c.n}", ¿cuál es la estrategia de relación con clientes más adecuada para la etapa actual? ¿Cómo construir comunidad y advocacy sin un gran presupuesto de marketing?`,
      financiero:    c => `Actúa como analista financiero. Para "${c.n}", calcula el CAC (costo de adquisición) esperado por canal y el LTV por segmento. ¿La relación LTV/CAC es saludable (>3x)? ¿Qué modelo de retención maximiza el margen a largo plazo?`,
    },
  },
  {
    id: 'segmentos', label: 'Segmento de clientes', icon: '👥', area: 'segmentos',
    hint: 'Para quién creas valor. El cliente específico al que sirves mejor.',
    questions: [
      '¿Quién es tu cliente ideal (perfil detallado)?',
      '¿Qué tiene en común este grupo?',
      '¿Hay segmentos secundarios o early adopters?',
    ],
    prompts: {
      inversionista: c => `Actúa como inversionista evaluando "${c.n}". ¿El segmento "${c.cl}" es lo suficientemente grande (TAM/SAM/SOM) para justificar el negocio? ¿Tiene poder adquisitivo real? ¿El mercado está creciendo o en declive? Dame números.`,
      cliente:       c => `Actúa como un cliente representativo de "${c.n}" (perfil: ${c.cl || 'cliente objetivo'}). Descríbete con detalle: tus frustraciones diarias, metas, comportamiento de compra y cómo descubres nuevas soluciones. ¿Qué influye en tu decisión de compra?`,
      marketing:     c => `Actúa como experto en segmentación y buyer personas. Para "${c.n}", crea 3 buyer personas detalladas para el segmento "${c.cl}". Incluye datos demográficos, psicográficos, canales preferidos y mensajes que resonarían con cada uno.`,
      mentor:        c => `Actúa como mentor de emprendimiento. Para "${c.n}", ¿quién es el "early adopter" ideal (el primer 1% que adoptará la solución)? ¿Dónde encontrarlos? ¿Cómo conseguir los primeros 10 clientes sin presupuesto de marketing?`,
      financiero:    c => `Actúa como analista financiero. Para "${c.n}", estima el TAM (mercado total), SAM (mercado alcanzable) y SOM (mercado objetivo) del segmento "${c.cl}". ¿Cuál es el potencial de ingresos a 1, 3 y 5 años si capturas el 1%, 5% y 10% del SOM?`,
    },
  },
  {
    id: 'recursos', label: 'Recursos clave', icon: '🔑', area: 'recursos',
    hint: 'Los activos esenciales que necesitas para operar y crecer.',
    questions: [
      '¿Qué recursos son imprescindibles?',
      '¿Son físicos, humanos, intelectuales o financieros?',
      '¿Cuáles ya tienes y cuáles faltan?',
    ],
    prompts: {
      inversionista: c => `Actúa como inversionista evaluando "${c.n}". ¿Qué recursos clave son los más costosos de construir o adquirir? ¿Cuáles representan una barrera de entrada para competidores? ¿Dónde iría prioritariamente el capital de inversión?`,
      cliente:       c => `Actúa como cliente de "${c.n}". ¿Qué recursos (tecnología, personal, datos, marca) son visibles para mí como usuario y afectan directamente mi experiencia? ¿Qué activos de la empresa me darían más confianza en la calidad del servicio?`,
      marketing:     c => `Actúa como experto en marketing de contenidos y marca. Para "${c.n}", ¿qué activos de marketing son recursos clave? (marca, contenido, base de datos, comunidad, SEO, redes). ¿Cómo construir estos activos sin grandes presupuestos en los primeros 6 meses?`,
      mentor:        c => `Actúa como mentor de emprendimiento. Para "${c.n}" en etapa inicial, ¿cuáles son los recursos clave mínimos para un MVP funcional? ¿Qué puede bootstrapearse vs. qué requiere inversión? Prioriza por urgencia e impacto en la propuesta de valor.`,
      financiero:    c => `Actúa como analista financiero. Lista los recursos clave de "${c.n}" con su costo de adquisición y mantenimiento mensual. ¿Cuál es la inversión inicial total requerida (CAPEX)? ¿Qué puede rentarse, compartirse o adquirirse gradualmente?`,
    },
  },
  {
    id: 'canales', label: 'Canales', icon: '📣', area: 'canales',
    hint: 'Cómo llegas a tus clientes para entregar tu propuesta de valor.',
    questions: [
      '¿Por dónde descubren tu producto?',
      '¿Cómo lo compran y reciben?',
      '¿Cuáles canales son más eficientes y económicos?',
    ],
    prompts: {
      inversionista: c => `Actúa como inversionista evaluando "${c.n}". ¿Los canales de adquisición son escalables, eficientes y con bajo CAC? ¿Hay dependencia peligrosa de un solo canal (ej: solo redes sociales)? ¿Cómo se diversifican sin perder foco?`,
      cliente:       c => `Actúa como cliente de "${c.n}" (perfil: ${c.cl || 'cliente objetivo'}). ¿Por qué canales descubrirías este producto de forma natural? ¿Cómo preferirías comprarlo y recibirlo? ¿Qué canales te generan más confianza y cuáles te parecerían invasivos?`,
      marketing:     c => `Actúa como experto en growth marketing. Para "${c.n}" con el segmento "${c.cl}", diseña una estrategia multicanal para los primeros 6 meses. Prioriza por costo de adquisición, velocidad de resultados y capacidad de escalar.`,
      mentor:        c => `Actúa como mentor de emprendimiento. Para "${c.n}", ¿cuál debería ser el canal de adquisición principal en etapa temprana (traction channel)? ¿Cómo probar rápido y barato qué canal funciona mejor con un experimento de 2 semanas?`,
      financiero:    c => `Actúa como analista financiero. Compara los canales posibles para "${c.n}" en: costo por adquisición, tasa de conversión esperada, tiempo hasta primera venta y escalabilidad. Construye una tabla comparativa y recomienda el mix óptimo para el primer año.`,
    },
  },
  {
    id: 'costos', label: 'Estructura de costos', icon: '💸', area: 'costos',
    hint: 'Todos los costos que implica operar y escalar tu modelo de negocio.',
    questions: [
      '¿Cuáles son los costos fijos y variables?',
      '¿Cuáles son los más importantes e inevitables?',
      '¿Cuándo llegas al punto de equilibrio?',
    ],
    prompts: {
      inversionista: c => `Actúa como inversionista evaluando "${c.n}". Analiza la estructura de costos: ¿es un modelo intensivo en capital o "asset-light"? ¿Cuál es el burn rate mensual estimado? ¿Cuánto runway necesita antes de ser rentable? ¿Es el margen bruto atractivo (>60%)?`,
      cliente:       c => `Actúa como cliente de "${c.n}" consciente del precio. ¿Cómo impacta la estructura de costos en el precio que pagaré? ¿Hay costos que podrían eliminarse sin afectar mi experiencia? ¿Por qué costos de calidad estaría dispuesto a pagar más?`,
      marketing:     c => `Actúa como experto en marketing y presupuesto. Para "${c.n}", ¿cuánto debería destinarse al presupuesto de marketing (% de ingresos)? ¿Cómo balancear inversión en adquisición vs. retención en las distintas fases de crecimiento?`,
      mentor:        c => `Actúa como mentor de emprendimiento lean. Para "${c.n}", construye una estructura de costos mínima viable: ¿qué costos son absolutamente necesarios desde el día 1? ¿Qué puede eliminarse o diferirse? ¿Cómo llegar al punto de equilibrio en el menor tiempo?`,
      financiero:    c => `Actúa como analista financiero especializado en startups. Para "${c.n}", construye un modelo de costos con: costos fijos mensuales, costos variables por cliente, punto de equilibrio en número de clientes y en ingresos, y proyección mes a mes a 12 meses.`,
    },
  },
  {
    id: 'ingresos', label: 'Fuentes de ingreso', icon: '💰', area: 'ingresos',
    hint: 'Cómo ganas dinero. El valor por el que tus clientes pagan.',
    questions: [
      '¿Por qué valor pagan tus clientes?',
      '¿Cuál es el modelo de monetización?',
      '¿Cómo se fija el precio? ¿Es recurrente?',
    ],
    prompts: {
      inversionista: c => `Actúa como inversionista evaluando "${c.n}". ¿El modelo de ingresos es recurrente, escalable y predecible (MRR/ARR)? ¿Hay oportunidades de upsell o expansión de ingresos? ¿El precio está alineado al valor entregado y al poder adquisitivo de "${c.cl}"?`,
      cliente:       c => `Actúa como cliente muy consciente del precio de "${c.n}". ¿Por qué estaría dispuesto a pagar? ¿Cuánto es mi precio máximo psicológico? ¿Prefiero pagar por uso, suscripción mensual o pago único? ¿Qué modelo me parece más justo y transparente?`,
      marketing:     c => `Actúa como experto en pricing y marketing. Para "${c.n}", ¿qué estrategia de precios maximiza la adquisición y el revenue simultáneamente? Analiza: freemium, prueba gratis, descuento de lanzamiento, pricing por valor. ¿Cuál funciona mejor para "${c.cl}"?`,
      mentor:        c => `Actúa como mentor de emprendimiento. Para "${c.n}", ¿cuál es el modelo de monetización más apropiado para la etapa actual? ¿Cómo validar el precio antes de lanzar (técnica de la "pre-venta" o "smoke test")? ¿Cómo el precio posiciona la marca?`,
      financiero:    c => `Actúa como analista financiero. Para "${c.n}", modela 3 escenarios de ingresos (pesimista, realista, optimista) para 12 meses. Incluye: precio por cliente, número de clientes por mes, tasa de crecimiento mensual y MRR/ARR resultante en cada escenario.`,
    },
  },
];

const CANVAS_AREAS = `
  "aliados     actividades propuesta relacion  segmentos"
  "problema    recursos    propuesta canales   segmentos"
  "costos      costos      costos    ingresos  ingresos "
`;

// ── Componente ────────────────────────────────────────────────────────────────

export default function CanvasNegocioSimulator() {
  const [nombre,   setNombre]   = useState('');
  const [problema, setProblema] = useState('');
  const [cliente,  setCliente]  = useState('');
  const [advisorId, setAdvisorId] = useState('mentor');
  const [selected, setSelected] = useState(null);
  const [content,  setContent]  = useState({});
  const [copied,   setCopied]   = useState(false);

  const ctx = { n: nombre, p: problema, cl: cliente };
  const advisor = ADVISORS.find(a => a.id === advisorId);
  const block   = BLOCKS.find(b => b.id === selected);
  const prompt  = block ? block.prompts[advisorId](ctx) : '';

  const copy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filled    = Object.values(content).filter(v => v?.trim()).length;
  const progress  = Math.round((filled / BLOCKS.length) * 100);
  const generalPrompt = `Ayúdame a construir un modelo Canvas para una idea de negocio llamada "${nombre || '[nombre]'}", que resuelve "${problema || '[problema]'}", dirigida a "${cliente || '[cliente]'}". Dame una versión clara, realista y aplicable para cada bloque del Canvas.`;

  const downloadPDF = () => {
    const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const blockDetailRows = BLOCKS.map(b => {
      const val = content[b.id] || '';
      return `<div class="block-row">
        <div class="block-header">
          <span class="block-icon">${b.icon}</span>
          <span class="block-title">${b.label}</span>
          ${val ? '<span class="check">✓ completado</span>' : '<span class="empty-mark">sin completar</span>'}
        </div>
        <div class="block-content">${val ? val.replace(/\n/g, '<br>') : '<em>—</em>'}</div>
      </div>`;
    }).join('');

    const gridCells = BLOCKS.map(b => {
      const val = content[b.id] || '';
      const isFilled = !!val.trim();
      return `<div class="cell area-${b.id}${isFilled ? ' filled' : ''}">
        <div class="cell-head">${b.icon} ${b.label.toUpperCase()}</div>
        ${isFilled
          ? `<div class="cell-body">${val.replace(/\n/g, ' ')}</div>`
          : `<div class="cell-empty">${b.hint}</div>`}
      </div>`;
    }).join('');

    const advisorActivo = ADVISORS.find(a => a.id === advisorId);
    const promptGeneral = `Ayúdame a analizar el siguiente modelo Canvas de mi negocio llamado "${nombre || '[nombre]'}", que resuelve "${problema || '[problema]'}", dirigido a "${cliente || '[cliente]'}". Revisa cada bloque, identifica fortalezas, debilidades y dame recomendaciones concretas para mejorar el modelo.`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Canvas — ${nombre || 'Modelo de Negocio'}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{margin:1.5cm}
body{font-family:'Georgia',serif;color:#1e3a5f;font-size:10.5pt;padding:1cm}
.header{border-bottom:3px solid #1d4ed8;padding-bottom:.9rem;margin-bottom:1.2rem}
.biz-name{font-size:20pt;font-weight:bold;color:#1d4ed8;line-height:1.2}
.biz-sub{font-size:10pt;color:#64748b;margin-top:.25rem}
.meta{display:flex;gap:1.5rem;flex-wrap:wrap;margin-top:.7rem;font-size:9.5pt;color:#475569}
.meta strong{color:#1e3a5f}
.prog-row{display:flex;align-items:center;gap:1rem;margin:.9rem 0}
.prog-wrap{flex:1;height:7px;background:#e2e8f0;border-radius:99px}
.prog-fill{height:100%;border-radius:99px;background:${progress===100?'#16a34a':'#1d4ed8'};width:${progress}%}
.prog-label{font-size:9pt;color:#64748b;white-space:nowrap;font-family:monospace}
.section-title{font-size:12pt;font-weight:bold;color:#1d4ed8;border-bottom:2px solid #e2e8f0;
  padding-bottom:.35rem;margin:1.4rem 0 .9rem}
.canvas-grid{display:grid;grid-template-columns:repeat(5,1fr);
  grid-template-areas:
    "aliados actividades propuesta relacion segmentos"
    "problema recursos propuesta canales segmentos"
    "costos costos costos ingresos ingresos";
  gap:4px;background:#e2e8f0;border-radius:8px;padding:4px;border:1px solid #cbd5e1;
  margin-bottom:1.2rem;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cell{background:#fff;border-radius:4px;padding:6px 8px;border:2px solid transparent}
.cell.filled{border-color:#16a34a}
.area-aliados{grid-area:aliados}.area-problema{grid-area:problema}
.area-actividades{grid-area:actividades}.area-propuesta{grid-area:propuesta}
.area-relacion{grid-area:relacion}.area-segmentos{grid-area:segmentos}
.area-recursos{grid-area:recursos}.area-canales{grid-area:canales}
.area-costos{grid-area:costos}.area-ingresos{grid-area:ingresos}
.cell-head{font-size:7pt;font-weight:bold;text-transform:uppercase;letter-spacing:.04em;
  color:#475569;margin-bottom:3px;font-family:monospace}
.cell-body{font-size:7.5pt;color:#334155;line-height:1.35}
.cell-empty{font-size:7pt;color:#94a3b8;font-style:italic}
.block-row{margin-bottom:.85rem;padding:.65rem .9rem;border-radius:6px;
  border:1px solid #e2e8f0;break-inside:avoid}
.block-header{display:flex;align-items:center;gap:.4rem;margin-bottom:.35rem}
.block-icon{font-size:13pt}
.block-title{font-size:10pt;font-weight:bold;text-transform:uppercase;
  letter-spacing:.05em;color:#1e3a5f;flex:1;font-family:monospace}
.check{color:#16a34a;font-size:9pt;font-family:monospace}
.empty-mark{color:#94a3b8;font-size:9pt;font-family:monospace}
.block-content{font-size:10pt;color:#334155;line-height:1.6}
.block-content em{color:#94a3b8}
.prompt-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:1rem;
  margin-top:1.2rem;break-inside:avoid}
.prompt-label{font-size:9pt;font-weight:bold;font-family:monospace;color:#1d4ed8;
  text-transform:uppercase;letter-spacing:.07em;margin-bottom:.5rem}
.prompt-text{font-size:9.5pt;color:#1e40af;line-height:1.7}
.footer{margin-top:1.5rem;padding-top:.8rem;border-top:1px solid #e2e8f0;
  font-size:8.5pt;color:#94a3b8;text-align:center}
</style>
</head>
<body>
<div class="header">
  <div class="biz-name">${nombre || 'Modelo de Negocio Canvas'}</div>
  <div class="biz-sub">Business Model Canvas — Unidad Interactiva de Instrucción</div>
  <div class="meta">
    <span>🎯 <strong>Problema:</strong> ${problema || '—'}</span>
    <span>👥 <strong>Cliente objetivo:</strong> ${cliente || '—'}</span>
    <span>📅 ${fecha}</span>
  </div>
</div>
<div class="prog-row">
  <div class="prog-wrap"><div class="prog-fill"></div></div>
  <span class="prog-label">${filled}/${BLOCKS.length} bloques completados · ${progress}%</span>
</div>
<div class="section-title">Vista general del Canvas</div>
<div class="canvas-grid">${gridCells}</div>
<div class="section-title">Detalle por bloque</div>
${blockDetailRows}
<div class="prompt-box">
  <div class="prompt-label">💡 Prompt para análisis IA — ${advisorActivo?.icon} ${advisorActivo?.label}</div>
  <div class="prompt-text">${promptGeneral}</div>
</div>
<div class="footer">Generado con Canvas Inteligente — SEGEDU · ${fecha}</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

    const win = window.open('', '_blank', 'width=950,height=750');
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Contexto del negocio */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.75rem',
        background: '#f8fafc', borderRadius: '10px', padding: '1rem 1.25rem',
        border: '1px solid #e2e8f0' }}>
        {[
          { label: 'Nombre del negocio', val: nombre, set: setNombre, placeholder: 'Ej: EcoDelivery' },
          { label: 'Problema que resuelve', val: problema, set: setProblema, placeholder: 'Ej: falta de envíos sostenibles' },
          { label: 'Cliente objetivo', val: cliente, set: setCliente, placeholder: 'Ej: tiendas eco-friendly' },
        ].map(f => (
          <div key={f.label}>
            <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '.68rem',
              color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em',
              marginBottom: '.3rem' }}>
              {f.label}
            </label>
            <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
              style={{ width: '100%', padding: '.5rem .75rem', borderRadius: '6px',
                border: '1px solid #cbd5e1', fontSize: '.88rem', background: '#fff',
                boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = '#1d4ed8'; }}
              onBlur={e => { e.target.style.borderColor = '#cbd5e1'; }} />
          </div>
        ))}
      </div>

      {/* Selector de asesor IA */}
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', color: '#64748b',
          textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.6rem' }}>
          Asesor IA activo
        </div>
        <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap' }}>
          {ADVISORS.map(a => (
            <button key={a.id} onClick={() => setAdvisorId(a.id)}
              style={{ padding: '.4rem .95rem', borderRadius: '999px', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: '.75rem', fontWeight: 700,
                border: `2px solid ${advisorId === a.id ? a.color : '#e2e8f0'}`,
                background: advisorId === a.id ? a.bg : '#fff',
                color: advisorId === a.id ? a.color : '#64748b',
                transition: 'all .15s' }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
        {advisor && (
          <p style={{ margin: '.45rem 0 0', fontSize: '.78rem', color: '#64748b',
            fontStyle: 'italic', paddingLeft: '.2rem' }}>
            {advisor.icon} {advisor.description}
          </p>
        )}
      </div>

      {/* Progreso + botón descarga */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1, height: '5px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, borderRadius: '999px',
            background: progress === 100 ? '#16a34a' : '#1d4ed8', transition: 'width .4s' }} />
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', color: '#64748b', whiteSpace: 'nowrap' }}>
          {filled}/{BLOCKS.length} bloques · {progress}%
        </span>
        <button
          onClick={downloadPDF}
          disabled={filled === 0 && !nombre.trim()}
          title="Descargar tu Canvas como PDF para adjuntar a una IA"
          style={{
            padding: '.38rem .9rem', borderRadius: '6px', cursor: filled === 0 && !nombre.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--mono)', fontSize: '.72rem', fontWeight: 700,
            border: '1.5px solid #16a34a',
            background: filled === 0 && !nombre.trim() ? '#f1f5f9' : '#16a34a',
            color: filled === 0 && !nombre.trim() ? '#94a3b8' : '#fff',
            whiteSpace: 'nowrap', transition: 'all .15s', flexShrink: 0,
          }}>
          ⬇ Descargar PDF
        </button>
      </div>

      {/* Canvas grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gridTemplateRows: 'minmax(130px, auto) minmax(100px, auto) auto',
        gap: '5px',
        gridTemplateAreas: CANVAS_AREAS,
        background: '#e2e8f0',
        borderRadius: '10px',
        padding: '5px',
        border: '1px solid #cbd5e1',
      }}>
        {BLOCKS.map(b => {
          const isFilled   = !!(content[b.id]?.trim());
          const isSelected = selected === b.id;
          const isBottom   = b.id === 'costos' || b.id === 'ingresos';
          return (
            <div key={b.id}
              onClick={() => setSelected(isSelected ? null : b.id)}
              style={{
                gridArea: b.area,
                padding: '.75rem .85rem',
                borderRadius: '6px',
                border: `2px solid ${isSelected ? advisor.color : isFilled ? '#16a34a' : 'transparent'}`,
                background: isSelected ? advisor.bg : '#fff',
                cursor: 'pointer',
                transition: 'all .15s',
                display: 'flex', flexDirection: 'column', gap: '.3rem',
                minHeight: isBottom ? '70px' : undefined,
                position: 'relative',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                <span style={{ fontSize: '.9rem' }}>{b.icon}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '.62rem', fontWeight: 700,
                  color: isSelected ? advisor.color : '#475569',
                  textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {b.label}
                </span>
                {isFilled && !isSelected && (
                  <span style={{ marginLeft: 'auto', fontSize: '.7rem', color: '#16a34a', fontWeight: 700 }}>✓</span>
                )}
              </div>
              {content[b.id] ? (
                <p style={{ fontSize: '.75rem', color: '#334155', margin: 0, lineHeight: 1.45, flex: 1,
                  display: '-webkit-box', WebkitLineClamp: isBottom ? 2 : 5,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {content[b.id]}
                </p>
              ) : (
                <p style={{ fontSize: '.71rem', color: '#94a3b8', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                  {b.hint}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Panel de edición y prompt */}
      {block ? (
        <div style={{ borderRadius: '12px', border: `1px solid ${advisor.color}33`,
          background: '#fafafa', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: '.9rem 1.1rem', borderBottom: `1px solid ${advisor.color}22`,
            background: advisor.bg }}>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1.05rem',
                color: advisor.color }}>
                {block.icon} {block.label}
              </div>
              <ul style={{ margin: '.35rem 0 0', paddingLeft: '1.2rem', fontSize: '.78rem',
                color: '#475569', lineHeight: 1.8 }}>
                {block.questions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
            <button onClick={() => setSelected(null)}
              style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '6px',
                padding: '.3rem .55rem', cursor: 'pointer', fontSize: '.8rem', color: '#64748b',
                flexShrink: 0 }}>
              ✕
            </button>
          </div>

          <div style={{ padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Textarea */}
            <textarea
              value={content[block.id] || ''}
              onChange={e => setContent(c => ({ ...c, [block.id]: e.target.value }))}
              placeholder={`Escribe el contenido de "${block.label}"...`}
              rows={4}
              style={{ width: '100%', padding: '.75rem', borderRadius: '8px',
                border: '1px solid #cbd5e1', fontSize: '.88rem', resize: 'vertical',
                boxSizing: 'border-box', lineHeight: 1.6, background: '#fff',
                fontFamily: 'inherit', outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = advisor.color; }}
              onBlur={e => { e.target.style.borderColor = '#cbd5e1'; }}
            />

            {/* Prompt del asesor */}
            <div style={{ borderRadius: '8px', border: `1px solid ${advisor.color}33`,
              overflow: 'hidden', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '.55rem 1rem', background: advisor.bg,
                borderBottom: `1px solid ${advisor.color}22` }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', fontWeight: 700,
                  color: advisor.color, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  {advisor.icon} Prompt — {advisor.label}
                </span>
                <button onClick={copy}
                  style={{ padding: '.3rem .8rem', borderRadius: '6px', cursor: 'pointer',
                    fontFamily: 'var(--mono)', fontSize: '.72rem', fontWeight: 700,
                    border: `1.5px solid ${advisor.color}`,
                    background: copied ? advisor.color : 'transparent',
                    color: copied ? '#fff' : advisor.color,
                    transition: 'all .15s' }}>
                  {copied ? '✓ Copiado!' : '⧉ Copiar prompt'}
                </button>
              </div>
              <div style={{ padding: '.85rem 1rem' }}>
                <p style={{ margin: 0, fontSize: '.82rem', lineHeight: 1.75, color: '#334155',
                  whiteSpace: 'pre-wrap' }}>
                  {prompt}
                </p>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
              💡 Copia el prompt y pégalo en ChatGPT, Claude, Gemini u otra IA. Usa la respuesta para completar este bloque.
            </p>
          </div>
        </div>
      ) : (
        /* Prompt general cuando no hay bloque seleccionado */
        <div style={{ borderRadius: '10px', border: '1px solid #bfdbfe',
          background: '#eff6ff', overflow: 'hidden' }}>
          <div style={{ padding: '.55rem 1rem', borderBottom: '1px solid #bfdbfe',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', fontWeight: 700,
              color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              💡 Prompt general del Canvas
            </span>
          </div>
          <div style={{ padding: '.85rem 1rem' }}>
            <p style={{ margin: '0 0 .5rem', fontSize: '.82rem', lineHeight: 1.75, color: '#1e40af' }}>
              {generalPrompt}
            </p>
            <p style={{ margin: 0, fontSize: '.75rem', color: '#3b82f6' }}>
              Haz clic en cualquier bloque del Canvas para ver el prompt específico de tu asesor IA activo ({advisor?.icon} {advisor?.label}).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
