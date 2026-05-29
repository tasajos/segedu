import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

/* ══════════════════════════════════════════════════════════════
   CONSTANTES
   ══════════════════════════════════════════════════════════════ */
const SECTORES = [
  { id: 'gastronomia',   emoji: '🍽️',  nombre: 'Gastronomía',       desc: 'Alimentos y bebidas típicas' },
  { id: 'textil',        emoji: '👕',  nombre: 'Textil & Moda',      desc: 'Ropa, artesanías y accesorios' },
  { id: 'tecnologia',    emoji: '💻',  nombre: 'Tecnología',         desc: 'Software, hardware y servicios TI' },
  { id: 'agro',          emoji: '🌱',  nombre: 'Agroalimentos',      desc: 'Productos del campo y agroindustria' },
  { id: 'salud',         emoji: '💊',  nombre: 'Salud & Bienestar',  desc: 'Farmacia, naturales y cuidado personal' },
  { id: 'artesanias',    emoji: '🏺',  nombre: 'Artesanías',         desc: 'Arte popular y souvenirs bolivianos' },
  { id: 'educacion',     emoji: '📚',  nombre: 'Educación',          desc: 'Cursos, materiales y tutorías' },
  { id: 'construccion',  emoji: '🧱',  nombre: 'Construcción',       desc: 'Materiales y herramientas' },
  { id: 'transporte',    emoji: '🚚',  nombre: 'Transporte & Logística', desc: 'Delivery y distribución' },
  { id: 'turismo',       emoji: '🗺️',  nombre: 'Turismo',            desc: 'Tours, hospedaje y experiencias' },
  { id: 'mascotas',      emoji: '🐾',  nombre: 'Mascotas',           desc: 'Alimentos, accesorios y servicios' },
  { id: 'hogar',         emoji: '🏠',  nombre: 'Hogar & Deco',       desc: 'Muebles, decoración y limpieza' },
];

const EMOCION_STYLE = {
  interesado:   { bg: '#eff6ff', border: '#3b82f6', icon: '👀' },
  dudoso:       { bg: '#fffbeb', border: '#f59e0b', icon: '🤔' },
  convencido:   { bg: '#f0fdf4', border: '#16a34a', icon: '😊' },
  decepcionado: { bg: '#fef2f2', border: '#ef4444', icon: '😞' },
  neutral:      { bg: '#f8fafc', border: '#94a3b8', icon: '😐' },
  molesto:      { bg: '#fef2f2', border: '#dc2626', icon: '😤' },
};

const MSGS_PRODUCTOS = (sector) => [
  { t: 'cmd',     s: `ia --generar-productos --sector="${sector}" --ciudad=Cochabamba` },
  { t: 'output',  s: 'Analizando mercado local de Cochabamba 2026...' },
  { t: 'success', s: 'Base de datos de precios bolivianos cargada ✓' },
  { t: 'output',  s: `Identificando los mejores productos para: ${sector}...` },
  { t: 'info',    s: 'Criterios: demanda local · margen comercial · disponibilidad' },
  { t: 'output',  s: 'Calculando precios referenciales en bolivianos...' },
  { t: 'output',  s: 'Definiendo diferenciadores para el mercado cochabambino...' },
  { t: 'success', s: '12 productos generados exitosamente ✓' },
];

const MSGS_ESCENARIO = (productosStr) => [
  { t: 'cmd',     s: 'ia --generar-escenario-ventas --region=Cochabamba' },
  { t: 'output',  s: `Productos seleccionados: ${productosStr}` },
  { t: 'output',  s: 'Mapeando canales de distribución en Cochabamba...' },
  { t: 'info',    s: 'Canales: supermercados · tiendas · mercados · online · empresas' },
  { t: 'output',  s: 'Generando compradores potenciales con perfil realista...' },
  { t: 'info',    s: 'Perfiles: gerentes, amas de casa, distribuidores, consumidores finales' },
  { t: 'output',  s: 'Configurando personalidades y presupuestos por comprador...' },
  { t: 'success', s: '5 lugares + 5 compradores listos para la simulación ✓' },
];

/* ══════════════════════════════════════════════════════════════
   TERMINAL IA
   ══════════════════════════════════════════════════════════════ */
function AITerminal({ msgs, titulo = 'ia-engine · mercado-virtual · Cochabamba, Bolivia' }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const COLOR   = { cmd: '#c792ea', output: '#cdd6f4', success: '#a6e3a1', info: '#89dceb', warning: '#f9e2af', error: '#f38ba8' };
  const PREFIX  = { cmd: '$ ', output: '  ', success: '✓ ', info: 'ℹ ', warning: '⚠ ', error: '✗ ' };

  return (
    <div style={{ background: '#1e1e2e', borderRadius: '10px', overflow: 'hidden', border: '1px solid #313244' }}>
      <div style={{ background: '#181825', padding: '.35rem .75rem', display: 'flex',
        alignItems: 'center', gap: '.4rem', borderBottom: '1px solid #313244' }}>
        {['#f38ba8', '#f9e2af', '#a6e3a1'].map(c => (
          <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
        ))}
        <span style={{ fontSize: '.62rem', color: '#6c7086', marginLeft: '.4rem', fontFamily: 'monospace' }}>
          {titulo}
        </span>
      </div>
      <div style={{ padding: '.75rem 1rem', minHeight: '140px', maxHeight: '200px', overflowY: 'auto',
        fontSize: '.76rem', lineHeight: 1.85, fontFamily: '"Fira Code", "Cascadia Code", monospace' }}>
        {msgs.map((msg, i) => (
          <div key={i} style={{ color: COLOR[msg.t] || '#cdd6f4' }}>
            <span style={{ color: '#6c7086', userSelect: 'none' }}>{PREFIX[msg.t] || '  '}</span>
            {msg.s}
          </div>
        ))}
        {msgs.length > 0 && (
          <span style={{ color: '#a6e3a1', animation: 'blink 1s steps(1) infinite' }}>▋</span>
        )}
        <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
        <div ref={endRef} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TARJETA DE PRODUCTO
   ══════════════════════════════════════════════════════════════ */
function ProductoCard({ producto, seleccionado, onClick, bloqueado }) {
  const PRECIO_COLOR = (p) => {
    const num = parseFloat(p);
    if (num <= 30)  return '#16a34a';
    if (num <= 100) return '#d97706';
    return '#7c3aed';
  };
  const color = PRECIO_COLOR(producto.precio_referencial);

  return (
    <button
      onClick={() => !bloqueado && onClick(producto)}
      title={bloqueado ? 'Ya seleccionaste 5 productos' : ''}
      style={{
        all: 'unset', cursor: bloqueado ? 'not-allowed' : 'pointer',
        display: 'flex', flexDirection: 'column', gap: '.4rem',
        background: seleccionado ? '#f0fdf4' : '#fff',
        border: `2px solid ${seleccionado ? '#16a34a' : bloqueado ? '#e2e8f0' : '#e2e8f0'}`,
        borderRadius: '10px', padding: '.85rem', transition: 'all .18s',
        opacity: bloqueado ? .5 : 1,
        boxShadow: seleccionado ? '0 0 14px #16a34a44,0 4px 12px rgba(0,0,0,.1)' : '0 2px 6px rgba(0,0,0,.06)',
        transform: seleccionado ? 'translateY(-3px)' : undefined,
        position: 'relative',
      }}
      onMouseEnter={e => { if (!bloqueado) e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,.12)'; }}
      onMouseLeave={e => { if (!seleccionado) e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,.06)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem' }}>
        <span style={{ fontSize: '2rem', lineHeight: 1 }}>{producto.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.88rem', color: '#1e293b', lineHeight: 1.2 }}>
            {producto.nombre}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '.6rem', color: '#64748b', textTransform: 'uppercase' }}>
            {producto.categoria}
          </div>
        </div>
        <div style={{ background: color, color: '#fff', borderRadius: '6px',
          padding: '.2rem .55rem', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '.72rem',
          flexShrink: 0 }}>
          {producto.precio_referencial}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: '.74rem', color: '#475569', lineHeight: 1.45 }}>
        {producto.descripcion}
      </p>
      <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '5px',
        padding: '.22rem .45rem', fontSize: '.65rem', color: '#854d0e', fontFamily: 'var(--mono)' }}>
        ⚡ {producto.diferenciador}
      </div>
      {seleccionado && (
        <div style={{ position: 'absolute', top: '.45rem', right: '.45rem', width: '22px', height: '22px',
          borderRadius: '50%', background: '#16a34a', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', fontWeight: 700 }}>✓</div>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   BURBUJA DE CHAT
   ══════════════════════════════════════════════════════════════ */
function ChatBubble({ msg, personajeNombre, personajeEmoji }) {
  const esPersonaje = msg.rol === 'personaje';
  const esDecision  = msg.rol === 'decision';

  if (esDecision) {
    const isCompra = msg.decision === 'compra';
    return (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '.5rem 0' }}>
        <div style={{
          background: isCompra ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${isCompra ? '#16a34a' : '#ef4444'}`,
          borderRadius: '10px', padding: '.65rem 1.1rem', maxWidth: '480px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '.25rem' }}>{isCompra ? '🎉' : '😞'}</div>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.92rem',
            color: isCompra ? '#166534' : '#991b1b' }}>
            {isCompra ? `¡Venta realizada! +${msg.monto} Bs` : 'No se concretó la venta'}
          </div>
          {msg.productos?.length > 0 && (
            <div style={{ fontSize: '.73rem', color: '#374151', marginTop: '.2rem' }}>
              Compró: {msg.productos.join(', ')}
            </div>
          )}
          {msg.feedback && (
            <div style={{ marginTop: '.5rem', background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '6px', padding: '.4rem .65rem', fontSize: '.71rem', color: '#475569',
              textAlign: 'left', lineHeight: 1.5 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '.62rem', color: '#64748b',
                display: 'block', marginBottom: '.1rem' }}>💭 Análisis del negociador:</span>
              {msg.feedback}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: esPersonaje ? 'flex-start' : 'flex-end',
      marginBottom: '.5rem' }}>
      {esPersonaje && (
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#7c3aed',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0, marginRight: '.5rem', alignSelf: 'flex-end' }}>
          {personajeEmoji}
        </div>
      )}
      <div style={{
        background: esPersonaje ? '#f1f5f9' : '#1e293b',
        color: esPersonaje ? '#1e293b' : '#f8fafc',
        borderRadius: esPersonaje ? '0 12px 12px 12px' : '12px 0 12px 12px',
        padding: '.55rem .85rem', maxWidth: '70%', fontSize: '.84rem', lineHeight: 1.55,
        boxShadow: '0 1px 3px rgba(0,0,0,.1)',
      }}>
        {esPersonaje && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: '.58rem', color: '#7c3aed',
            fontWeight: 700, marginBottom: '.2rem' }}>{personajeNombre}</div>
        )}
        {msg.texto}
        {msg.emocion && (
          <div style={{ marginTop: '.3rem', fontSize: '.65rem',
            color: esPersonaje ? '#64748b' : '#94a3b8', fontFamily: 'var(--mono)' }}>
            {EMOCION_STYLE[msg.emocion]?.icon || '😐'} {msg.emocion}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SIMULADOR PRINCIPAL
   ══════════════════════════════════════════════════════════════ */
export default function MercadoVirtualSimulator() {
  /* ── fase general ── */
  const [fase, setFase] = useState('inicio');
  const [error, setError] = useState('');

  /* ── sector ── */
  const [sectorSel, setSectorSel] = useState(null);

  /* ── productos ── */
  const [terminalMsgs, setTerminalMsgs]   = useState([]);
  const [productos, setProductos]         = useState([]);
  const [productosSel, setProductosSel]   = useState([]);

  /* ── escenario ── */
  const [terminalMsgs2, setTerminalMsgs2] = useState([]);
  const [lugares, setLugares]             = useState([]);
  const [personajes, setPersonajes]       = useState([]);

  /* ── ventas ── */
  const [personajeActual, setPersonajeActual] = useState(0);
  const [conversaciones, setConversaciones]   = useState({});
  // { [id]: { mensajes:[{rol,texto,emocion?}], decision:null|'compra'|'rechaza',
  //           intercambios:0, productosComprados:[], montoTotal:0, feedbackFinal:'' } }
  const [mensajeActual, setMensajeActual]     = useState('');
  const [esperandoResp, setEsperandoResp]     = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversaciones, personajeActual]);

  /* ══ HELPERS ════════════════════════════════════════════════ */
  async function revealTerminal(msgs, setter, interval = 480) {
    setter([]);
    for (let i = 0; i < msgs.length; i++) {
      await new Promise(r => setTimeout(r, interval));
      setter(prev => [...prev, msgs[i]]);
    }
  }

  /* ══ FASE 1 → 2: generar productos ═════════════════════════ */
  async function handleSectorElegido(sector) {
    setSectorSel(sector);
    setFase('generando_productos');
    setError('');

    const msgs = MSGS_PRODUCTOS(sector.nombre);

    const [, result] = await Promise.all([
      revealTerminal(msgs, setTerminalMsgs, 450),
      api.post('/auth/generar-productos', { sector: sector.nombre }).then(r => r.data).catch(e => ({ error: e?.response?.data?.error || e.message })),
    ]);

    if (result.error) { setError(result.error); setFase('inicio'); return; }
    setProductos(result.productos || []);
    setFase('seleccion_productos');
  }

  /* ══ FASE 3 → 4: seleccionar productos y generar escenario ══ */
  function toggleProducto(p) {
    setProductosSel(prev =>
      prev.find(x => x.id === p.id) ? prev.filter(x => x.id !== p.id) : prev.length < 5 ? [...prev, p] : prev
    );
  }

  async function handleConfirmarProductos() {
    if (productosSel.length < 3) { setError('Selecciona al menos 3 productos.'); return; }
    setError('');
    setFase('generando_escenario');

    const pStr = productosSel.map(p => p.emoji + ' ' + p.nombre).join(' · ');
    const msgs  = MSGS_ESCENARIO(pStr);

    const [, result] = await Promise.all([
      revealTerminal(msgs, setTerminalMsgs2, 470),
      api.post('/auth/generar-escenario-ventas', { sector: sectorSel.nombre, productos: productosSel })
        .then(r => r.data).catch(e => ({ error: e?.response?.data?.error || e.message })),
    ]);

    if (result.error) { setError(result.error); setFase('seleccion_productos'); return; }

    const personajesData = result.personajes || [];
    setLugares(result.lugares || []);
    setPersonajes(personajesData);

    // Inicializar estado de conversación para cada personaje
    const convInit = {};
    personajesData.forEach(p => {
      convInit[p.id] = {
        mensajes: [{ rol: 'personaje', texto: p.saludo_inicial, emocion: 'neutral' }],
        decision: null,
        intercambios: 0,
        productosComprados: [],
        montoTotal: 0,
        feedbackFinal: '',
      };
    });
    setConversaciones(convInit);
    setPersonajeActual(0);
    setFase('ventas');
  }

  /* ══ VENTAS: enviar mensaje ═════════════════════════════════ */
  async function handleEnviarMensaje() {
    const msg = mensajeActual.trim();
    if (!msg || esperandoResp) return;

    const p     = personajes[personajeActual];
    const conv  = conversaciones[p.id];
    if (!conv || conv.decision) return;

    // agregar mensaje del estudiante
    const nuevoIntercambio = conv.intercambios + 1;
    const nuevosMensajes   = [...conv.mensajes, { rol: 'estudiante', texto: msg }];

    setConversaciones(prev => ({
      ...prev,
      [p.id]: { ...prev[p.id], mensajes: nuevosMensajes, intercambios: nuevoIntercambio },
    }));
    setMensajeActual('');
    setEsperandoResp(true);

    try {
      const historial = conv.mensajes.map(m => ({ rol: m.rol, texto: m.texto }));
      const { data } = await api.post('/auth/interactuar-venta', {
        personaje: p,
        productos: productosSel,
        historial,
        mensaje: msg,
        intercambio: nuevoIntercambio,
      });

      const msgsResp = [
        { rol: 'personaje', texto: data.respuesta, emocion: data.emocion },
      ];

      const decidido = data.decision === 'compra' || data.decision === 'rechaza';
      if (decidido) {
        msgsResp.push({
          rol: 'decision',
          decision: data.decision,
          monto: data.monto_total,
          productos: data.productos_comprados,
          feedback: data.feedback_interno,
        });
      }

      setConversaciones(prev => ({
        ...prev,
        [p.id]: {
          ...prev[p.id],
          mensajes: [...nuevosMensajes, ...msgsResp],
          decision: decidido ? data.decision : null,
          productosComprados: data.productos_comprados || [],
          montoTotal: data.monto_total || 0,
          feedbackFinal: data.feedback_interno || '',
        },
      }));
    } catch (e) {
      setConversaciones(prev => ({
        ...prev,
        [p.id]: {
          ...prev[p.id],
          mensajes: [...nuevosMensajes, { rol: 'personaje', texto: '(Error de conexión, intenta de nuevo)', emocion: 'neutral' }],
        },
      }));
    } finally {
      setEsperandoResp(false);
    }
  }

  /* ══ CALCULAR RESULTADOS ════════════════════════════════════ */
  function calcularResultados() {
    const ventas = personajes.map(p => {
      const c = conversaciones[p.id] || {};
      return {
        personaje: p,
        decision: c.decision,
        monto: c.montoTotal || 0,
        productos: c.productosComprados || [],
        feedback: c.feedbackFinal || '',
      };
    });
    const totalVentas  = ventas.filter(v => v.decision === 'compra');
    const totalIngresos = totalVentas.reduce((s, v) => s + v.monto, 0);
    return { ventas, totalVentas, totalIngresos };
  }

  /* ══ RENDER ══════════════════════════════════════════════════ */

  /* ─ INICIO ─────────────────────────────────────────────── */
  if (fase === 'inicio') {
    return (
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.55rem', margin: 0, marginBottom: '.35rem' }}>
            🛒 Mercado Virtual
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-light)', fontSize: '.88rem' }}>
            Elige un sector económico y vende tus productos a compradores reales de Cochabamba.
            Practica tus habilidades de negociación con la IA.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px',
            padding: '.75rem 1rem', marginBottom: '1rem', color: '#991b1b', fontSize: '.84rem' }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.1)',
          borderRadius: '8px', padding: '1.25rem' }}>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1.05rem',
            marginBottom: '1rem', color: 'var(--ink)' }}>
            Paso 1 de 3 — Elige tu sector de negocio
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '.75rem' }}>
            {SECTORES.map(s => (
              <button key={s.id} onClick={() => handleSectorElegido(s)}
                style={{
                  all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: '.6rem', background: '#fff', border: '1.5px solid #e2e8f0',
                  borderRadius: '8px', padding: '.7rem .9rem', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(99,102,241,.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = ''; }}
              >
                <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{s.emoji}</span>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.85rem', color: '#1e293b', lineHeight: 1.2 }}>{s.nombre}</div>
                  <div style={{ fontSize: '.67rem', color: '#64748b', marginTop: '.1rem' }}>{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─ CARGANDO PRODUCTOS ─────────────────────────────────── */
  if (fase === 'generando_productos') {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2rem' }}>{sectorSel?.emoji}</span>
          <div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', margin: 0 }}>
              {sectorSel?.nombre}
            </h2>
            <p style={{ margin: 0, fontSize: '.82rem', color: 'var(--ink-light)' }}>Generando catálogo de productos...</p>
          </div>
        </div>
        <AITerminal msgs={terminalMsgs} />
      </div>
    );
  }

  /* ─ SELECCIÓN DE PRODUCTOS ─────────────────────────────── */
  if (fase === 'seleccion_productos') {
    const bloqueado = productosSel.length >= 5;
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', margin: 0, marginBottom: '.3rem' }}>
              {sectorSel?.emoji} Paso 2 — Elige tus productos
            </h2>
            <p style={{ margin: 0, fontSize: '.83rem', color: 'var(--ink-light)' }}>
              Selecciona entre 3 y 5 productos para llevar al mercado.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '.8rem', color: '#1e293b',
              background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '.3rem .7rem' }}>
              {productosSel.length}/5 seleccionados
            </div>
            <button
              onClick={handleConfirmarProductos}
              disabled={productosSel.length < 3}
              style={{
                all: 'unset', cursor: productosSel.length < 3 ? 'not-allowed' : 'pointer',
                background: productosSel.length < 3 ? '#94a3b8' : '#1e293b',
                color: '#fff', padding: '.5rem 1.1rem', borderRadius: '7px',
                fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '.82rem',
                transition: 'background .15s',
              }}>
              Ir al mercado →
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px',
            padding: '.6rem .9rem', marginBottom: '1rem', color: '#991b1b', fontSize: '.82rem' }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: '.9rem' }}>
          {productos.map(p => (
            <ProductoCard
              key={p.id} producto={p}
              seleccionado={!!productosSel.find(x => x.id === p.id)}
              onClick={toggleProducto}
              bloqueado={bloqueado && !productosSel.find(x => x.id === p.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ─ CARGANDO ESCENARIO ─────────────────────────────────── */
  if (fase === 'generando_escenario') {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.35rem', margin: 0, marginBottom: '.3rem' }}>
            🗺️ Preparando el mercado...
          </h2>
          <p style={{ margin: 0, fontSize: '.83rem', color: 'var(--ink-light)' }}>
            Productos elegidos: {productosSel.map(p => `${p.emoji} ${p.nombre}`).join(' · ')}
          </p>
        </div>
        <AITerminal msgs={terminalMsgs2} />
      </div>
    );
  }

  /* ─ VENTAS ──────────────────────────────────────────────── */
  if (fase === 'ventas') {
    const p      = personajes[personajeActual];
    const conv   = p ? conversaciones[p.id] : null;
    const terminado = conv?.decision != null;
    const todosFin  = personajes.every(x => conversaciones[x.id]?.decision != null);

    const emocion = terminado
      ? (conv.decision === 'compra' ? 'convencido' : 'decepcionado')
      : (conv?.mensajes?.slice(-1)[0]?.emocion || 'neutral');
    const esStyle = EMOCION_STYLE[emocion] || EMOCION_STYLE.neutral;

    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Cabecera */}
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', margin: 0, marginBottom: '.4rem' }}>
            🛒 Simulación de Ventas
          </h2>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {personajes.map((per, idx) => {
              const c = conversaciones[per.id];
              const activo = idx === personajeActual;
              const fin    = c?.decision != null;
              const isCompra = c?.decision === 'compra';
              return (
                <button key={per.id} onClick={() => setPersonajeActual(idx)}
                  style={{
                    all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    gap: '.35rem', padding: '.35rem .75rem', borderRadius: '20px',
                    border: `2px solid ${activo ? '#1e293b' : fin ? (isCompra ? '#16a34a' : '#ef4444') : '#e2e8f0'}`,
                    background: activo ? '#1e293b' : fin ? (isCompra ? '#f0fdf4' : '#fef2f2') : '#fff',
                    color: activo ? '#fff' : '#1e293b',
                    fontSize: '.76rem', fontFamily: 'var(--mono)', transition: 'all .15s',
                  }}>
                  <span>{per.emoji}</span>
                  <span>{per.nombre.split(' ')[0]}</span>
                  {fin && <span>{isCompra ? '✅' : '❌'}</span>}
                  {!fin && idx === personajeActual && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1rem', alignItems: 'start' }}>
          {/* Panel izquierdo: perfil */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {/* Tarjeta personaje */}
            <div style={{ background: esStyle.bg, border: `2px solid ${esStyle.border}`,
              borderRadius: '10px', padding: '.9rem', transition: 'all .3s' }}>
              <div style={{ textAlign: 'center', marginBottom: '.6rem' }}>
                <div style={{ fontSize: '2.4rem', lineHeight: 1 }}>{p?.emoji}</div>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.95rem',
                  color: '#1e293b', marginTop: '.25rem' }}>{p?.nombre}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '.62rem', color: '#7c3aed',
                  textTransform: 'uppercase' }}>{p?.tipo}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem', fontSize: '.73rem', color: '#475569' }}>
                <div><span style={{ fontFamily: 'var(--mono)', fontSize: '.62rem', color: '#94a3b8' }}>📍 LUGAR</span><br />{p?.lugar}</div>
                <div><span style={{ fontFamily: 'var(--mono)', fontSize: '.62rem', color: '#94a3b8' }}>💰 PRESUPUESTO</span><br />{p?.presupuesto}</div>
                <div><span style={{ fontFamily: 'var(--mono)', fontSize: '.62rem', color: '#94a3b8' }}>🎯 NECESIDAD</span><br />{p?.necesidad}</div>
                <div><span style={{ fontFamily: 'var(--mono)', fontSize: '.62rem', color: '#94a3b8' }}>🎭 ACTITUD</span><br />{p?.actitud}</div>
              </div>
              {/* Estado emocional */}
              <div style={{ marginTop: '.65rem', textAlign: 'center', fontFamily: 'var(--mono)',
                fontSize: '.65rem', color: '#64748b' }}>
                {EMOCION_STYLE[emocion]?.icon} {emocion}
              </div>
            </div>

            {/* Mis productos */}
            <details style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '.6rem .8rem' }}>
              <summary style={{ cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '.72rem',
                fontWeight: 700, color: '#475569', userSelect: 'none' }}>
                🛍️ Mis productos ({productosSel.length})
              </summary>
              <div style={{ marginTop: '.5rem', display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                {productosSel.map(pr => (
                  <div key={pr.id} style={{ fontSize: '.71rem', color: '#374151', lineHeight: 1.4 }}>
                    <span style={{ fontSize: '.95rem' }}>{pr.emoji}</span> <strong>{pr.nombre}</strong>
                    <span style={{ color: '#64748b' }}> · {pr.precio_referencial}</span>
                  </div>
                ))}
              </div>
            </details>

            {/* Intercambios */}
            {!terminado && (
              <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '.5rem .8rem',
                textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '.73rem', color: '#475569' }}>
                Intercambio {conv?.intercambios || 0} / 5
                <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '99px', marginTop: '.35rem', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${((conv?.intercambios || 0) / 5) * 100}%`,
                    background: '#6366f1', borderRadius: '99px', transition: 'width .4s' }} />
                </div>
              </div>
            )}

            {/* Botón siguiente */}
            {terminado && personajeActual < personajes.length - 1 && (
              <button onClick={() => setPersonajeActual(i => i + 1)}
                style={{ all: 'unset', cursor: 'pointer', background: '#1e293b', color: '#fff',
                  padding: '.55rem .9rem', borderRadius: '8px', textAlign: 'center',
                  fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '.78rem' }}>
                Siguiente comprador →
              </button>
            )}
            {todosFin && (
              <button onClick={() => setFase('resultados')}
                style={{ all: 'unset', cursor: 'pointer', background: '#7c3aed', color: '#fff',
                  padding: '.55rem .9rem', borderRadius: '8px', textAlign: 'center',
                  fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.88rem' }}>
                🏆 Ver resultados finales
              </button>
            )}
          </div>

          {/* Chat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {/* Burbuja de mensajes */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
              padding: '1rem', minHeight: '360px', maxHeight: '420px', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
              {conv?.mensajes?.map((m, i) => (
                <ChatBubble key={i} msg={m} personajeNombre={p?.nombre} personajeEmoji={p?.emoji} />
              ))}
              {esperandoResp && (
                <div style={{ display: 'flex', gap: '.45rem', alignItems: 'center', padding: '.3rem 0', marginLeft: '2.8rem' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#94a3b8',
                      animation: `bounce .8s ease-in-out ${i * .18}s infinite alternate` }} />
                  ))}
                  <style>{`@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-5px)}}`}</style>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            {!terminado && (
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <input
                  value={mensajeActual}
                  onChange={e => setMensajeActual(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleEnviarMensaje()}
                  placeholder="Tu mensaje como vendedor... (Enter para enviar)"
                  disabled={esperandoResp}
                  style={{
                    flex: 1, padding: '.6rem .85rem', borderRadius: '8px',
                    border: '1.5px solid #cbd5e1', fontSize: '.84rem', outline: 'none',
                    fontFamily: 'var(--sans)', color: '#1e293b', background: '#fff',
                  }}
                />
                <button onClick={handleEnviarMensaje} disabled={esperandoResp || !mensajeActual.trim()}
                  style={{
                    all: 'unset', cursor: esperandoResp || !mensajeActual.trim() ? 'not-allowed' : 'pointer',
                    background: esperandoResp ? '#94a3b8' : '#1e293b',
                    color: '#fff', padding: '.6rem 1.1rem', borderRadius: '8px',
                    fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '.82rem', flexShrink: 0,
                  }}>
                  Enviar
                </button>
              </div>
            )}

            {terminado && (
              <div style={{ textAlign: 'center', padding: '.65rem',
                fontFamily: 'var(--mono)', fontSize: '.75rem', color: '#64748b',
                background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                {conv.decision === 'compra' ? '✅ Venta concretada' : '❌ Sin venta'} — Selecciona otro comprador o ve a resultados
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─ RESULTADOS ─────────────────────────────────────────── */
  if (fase === 'resultados') {
    const { ventas, totalVentas, totalIngresos } = calcularResultados();
    const tasaExito = Math.round((totalVentas.length / ventas.length) * 100);

    const NIVEL = tasaExito >= 80 ? { label: 'Vendedor Experto', emoji: '🏆', color: '#7c3aed' }
                : tasaExito >= 60 ? { label: 'Buen Vendedor',    emoji: '🥈', color: '#16a34a' }
                : tasaExito >= 40 ? { label: 'En Desarrollo',    emoji: '🥉', color: '#d97706' }
                :                   { label: 'Necesita Mejorar', emoji: '📚', color: '#ef4444' };

    return (
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>{NIVEL.emoji}</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.65rem', margin: 0, color: NIVEL.color }}>
            {NIVEL.label}
          </h2>
          <p style={{ margin: '.4rem 0 0', color: 'var(--ink-light)', fontSize: '.88rem' }}>
            Simulación de ventas completada — Cochabamba, Bolivia
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
          {[
            { label: 'Ventas logradas', value: `${totalVentas.length} / ${ventas.length}`, sub: 'compradores convencidos', color: '#7c3aed' },
            { label: 'Ingresos totales', value: `${totalIngresos.toLocaleString()} Bs`, sub: 'bolivianos generados', color: '#16a34a' },
            { label: 'Tasa de éxito', value: `${tasaExito}%`, sub: 'efectividad de ventas', color: NIVEL.color },
          ].map(k => (
            <div key={k.label} style={{ background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.08)',
              borderRadius: '10px', padding: '1.1rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '.2rem' }}>{k.sub}</div>
              <div style={{ fontSize: '.78rem', color: '#475569' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Tabla de resultados */}
        <div style={{ background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.1)',
          borderRadius: '10px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ padding: '.75rem 1.1rem', borderBottom: '1px solid rgba(0,0,0,.08)',
            fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '.78rem', color: '#475569',
            display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr', gap: '1rem' }}>
            <span>COMPRADOR</span><span>LUGAR</span><span>RESULTADO</span><span>MONTO</span>
          </div>
          {ventas.map((v, i) => (
            <div key={i} style={{
              padding: '.7rem 1.1rem', borderBottom: i < ventas.length - 1 ? '1px solid rgba(0,0,0,.05)' : 'none',
              display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.5fr', gap: '1rem', alignItems: 'center',
              background: v.decision === 'compra' ? '#f0fdf455' : '#fef2f222',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{v.personaje.emoji}</span>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.85rem' }}>{v.personaje.nombre}</div>
                  <div style={{ fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--mono)' }}>{v.personaje.tipo}</div>
                </div>
              </div>
              <div style={{ fontSize: '.78rem', color: '#475569' }}>{v.personaje.lugar}</div>
              <div style={{ textAlign: 'center', fontSize: '1.1rem' }}>
                {v.decision === 'compra' ? '✅' : '❌'}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '.85rem',
                color: v.decision === 'compra' ? '#16a34a' : '#ef4444' }}>
                {v.decision === 'compra' ? `+${v.monto} Bs` : '0 Bs'}
              </div>
            </div>
          ))}
        </div>

        {/* Feedbacks */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '.85rem' }}>
            💭 Análisis por comprador
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {ventas.filter(v => v.feedback).map((v, i) => (
              <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '8px', padding: '.75rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.3rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{v.personaje.emoji}</span>
                  <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.88rem' }}>{v.personaje.nombre}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '.9rem' }}>{v.decision === 'compra' ? '✅' : '❌'}</span>
                </div>
                <p style={{ margin: 0, fontSize: '.78rem', color: '#475569', lineHeight: 1.55 }}>{v.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reiniciar */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => {
            setSectorSel(null); setProductos([]); setProductosSel([]);
            setPersonajes([]); setLugares([]); setConversaciones({});
            setTerminalMsgs([]); setTerminalMsgs2([]);
            setPersonajeActual(0); setMensajeActual(''); setError('');
            setFase('inicio');
          }}
            style={{ all: 'unset', cursor: 'pointer', background: '#1e293b', color: '#fff',
              padding: '.65rem 1.5rem', borderRadius: '8px',
              fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '.88rem' }}>
            ↺ Nueva simulación
          </button>
        </div>
      </div>
    );
  }

  return null;
}
