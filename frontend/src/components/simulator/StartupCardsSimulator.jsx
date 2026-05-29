import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

/* ── Constantes de rareza ──────────────────────────────────── */
const RAREZA = {
  comun:      { label: 'Común',      stars: '★☆☆☆', bg: '#f8fafc', border: '#94a3b8', badge: '#64748b', glow: '#94a3b8', text: '#475569' },
  raro:       { label: 'Raro',       stars: '★★☆☆', bg: '#eff6ff', border: '#3b82f6', badge: '#1d4ed8', glow: '#3b82f6', text: '#1e40af' },
  epico:      { label: 'Épico',      stars: '★★★☆', bg: '#faf5ff', border: '#8b5cf6', badge: '#7c3aed', glow: '#8b5cf6', text: '#5b21b6' },
  legendario: { label: 'Legendario', stars: '★★★★', bg: '#fffbeb', border: '#f59e0b', badge: '#d97706', glow: '#fbbf24', text: '#92400e' },
};

const STAT_LABELS = { innovacion: '💡', crecimiento: '📈', rentabilidad: '💰', accesibilidad: '🤝' };

const IMPACTO_COLOR = p => p >= 9 ? '#7c3aed' : p >= 7 ? '#16a34a' : p >= 4 ? '#d97706' : '#dc2626';

/* ── Mensajes terminal por fase ────────────────────────────── */
const MSGS_GENERANDO = [
  { t: 'cmd',     s: 'ia --generar-cartas --region=Bolivia --ciudad=Cochabamba' },
  { t: 'output',  s: 'Cargando base de conocimiento del mercado boliviano 2026...' },
  { t: 'success', s: 'Datos cargados: 847 rubros analizados en Bolivia' },
  { t: 'output',  s: 'Identificando sectores con alto potencial en Cochabamba...' },
  { t: 'info',    s: 'Top sectores: Tecnología · Gastronomía · Turismo · Agro' },
  { t: 'output',  s: 'Calculando rareza y estadísticas por sector...' },
  { t: 'info',    s: 'Distribución: 6 Común | 5 Raro | 3 Épico | 1 Legendario' },
  { t: 'output',  s: 'Asignando poderes especiales para el mercado boliviano...' },
  { t: 'success', s: '15 cartas de negocio generadas exitosamente ✓' },
];

const getMsgsAnalizando = (cartas, marca) => [
  { t: 'cmd',     s: `ia --construir-empresa --nombre="${marca.nombre}"` },
  { t: 'output',  s: `Input recibido: ${cartas.length} rubros + marca definida` },
  { t: 'info',    s: `Rubros: ${cartas.map(c => c.emoji + ' ' + c.nombre).join(' · ')}` },
  { t: 'output',  s: 'Calculando sinergia entre rubros seleccionados...' },
  { t: 'success', s: 'Combinación validada: alta complementariedad detectada' },
  { t: 'output',  s: 'Accediendo a datos del mercado de Cochabamba, Bolivia...' },
  { t: 'output',  s: 'Analizando competidores y oportunidades en la región...' },
  { t: 'output',  s: 'Iniciando búsqueda de personajes clave bolivianos...' },
  { t: 'info',    s: 'Criterios: trayectoria comprobada · presencia en Bolivia · expertise' },
  { t: 'success', s: 'Candidato tecnología identificado: Ing. Carlos Azcarraga ✓' },
  { t: 'output',  s: 'Buscando directivos en: Cochabamba · La Paz · Santa Cruz...' },
  { t: 'output',  s: 'Construyendo organigrama por departamentos...' },
  { t: 'success', s: 'Empresa construida → generando reporte final...' },
];

/* ── Terminal IA ───────────────────────────────────────────── */
function AITerminal({ msgs }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const COLOR = { cmd: '#c792ea', output: '#cdd6f4', success: '#a6e3a1', info: '#89dceb', warning: '#f9e2af', error: '#f38ba8' };
  const PREFIX = { cmd: '$ ', output: '  ', success: '✓ ', info: 'ℹ ', warning: '⚠ ', error: '✗ ' };

  return (
    <div style={{ background: '#1e1e2e', borderRadius: '10px', overflow: 'hidden', border: '1px solid #313244' }}>
      {/* Barra título */}
      <div style={{ background: '#181825', padding: '.35rem .75rem', display: 'flex',
        alignItems: 'center', gap: '.4rem', borderBottom: '1px solid #313244' }}>
        {['#f38ba8', '#f9e2af', '#a6e3a1'].map(c => (
          <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
        ))}
        <span style={{ fontSize: '.62rem', color: '#6c7086', marginLeft: '.4rem', fontFamily: 'monospace' }}>
          ia-engine · startup-cards · Cochabamba, Bolivia
        </span>
      </div>
      {/* Output */}
      <div style={{ padding: '.75rem 1rem', minHeight: '150px', maxHeight: '210px', overflowY: 'auto',
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

/* ── Carta Pokémon ─────────────────────────────────────────── */
function Carta({ carta, seleccionada, onClick, bloqueada }) {
  const r = RAREZA[carta.rareza] || RAREZA.comun;
  const isLeg = carta.rareza === 'legendario';
  return (
    <button onClick={() => !bloqueada && onClick(carta)} title={bloqueada ? 'Ya elegiste 5 cartas' : ''}
      style={{ all: 'unset', cursor: bloqueada ? 'not-allowed' : 'pointer', display: 'flex',
        flexDirection: 'column', width: '162px', borderRadius: '12px',
        border: `2.5px solid ${seleccionada ? r.glow : r.border}`, background: r.bg, overflow: 'hidden',
        transition: 'transform .18s, box-shadow .18s', flexShrink: 0, position: 'relative',
        boxShadow: seleccionada ? `0 0 18px ${r.glow}99,0 6px 16px rgba(0,0,0,.18)`
          : isLeg ? `0 0 8px ${r.glow}55` : '0 2px 6px rgba(0,0,0,.08)',
        transform: seleccionada ? 'translateY(-5px) scale(1.03)' : bloqueada ? 'scale(.97)' : undefined,
        opacity: bloqueada ? .45 : 1 }}>
      {/* Header rareza */}
      <div style={{ background: r.badge, padding: '.28rem .6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '.57rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700 }}>{r.label}</span>
        <span style={{ fontSize: '.65rem', color: '#ffffffcc' }}>{r.stars}</span>
      </div>
      {/* Emoji */}
      <div style={{ padding: '.65rem .5rem .3rem', textAlign: 'center', fontSize: '2.6rem', lineHeight: 1,
        filter: isLeg ? 'drop-shadow(0 0 6px #fbbf2488)' : undefined }}>{carta.emoji}</div>
      {/* Nombre */}
      <div style={{ padding: '0 .6rem', textAlign: 'center', minHeight: '44px' }}>
        <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.83rem', color: '#1e293b', lineHeight: 1.2 }}>{carta.nombre}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '.57rem', color: r.text, marginTop: '.1rem', textTransform: 'uppercase' }}>{carta.rubro}</div>
      </div>
      <div style={{ margin: '.4rem .6rem .3rem', height: '1px', background: r.border + '55' }} />
      {/* Descripción */}
      <div style={{ padding: '0 .65rem', fontSize: '.68rem', color: '#475569', lineHeight: 1.45, minHeight: '58px',
        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
        {carta.descripcion}
      </div>
      {/* Stats */}
      <div style={{ padding: '.45rem .65rem .3rem', display: 'flex', flexDirection: 'column', gap: '.22rem' }}>
        {Object.entries(carta.stats).map(([k, v]) => (
          <div key={k}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.08rem' }}>
              <span style={{ fontSize: '.59rem', color: '#64748b', fontFamily: 'var(--mono)' }}>{STAT_LABELS[k]} {k.charAt(0).toUpperCase() + k.slice(1)}</span>
              <span style={{ fontSize: '.59rem', fontWeight: 700, color: r.badge, fontFamily: 'var(--mono)' }}>{v}</span>
            </div>
            <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${v * 10}%`, background: r.badge, borderRadius: '99px' }} />
            </div>
          </div>
        ))}
      </div>
      {/* Poder especial */}
      <div style={{ margin: '.4rem .55rem .6rem', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '6px', padding: '.3rem .5rem' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '.56rem', color: '#854d0e', fontWeight: 700, marginBottom: '.08rem' }}>⚡ PODER ESPECIAL</div>
        <div style={{ fontSize: '.63rem', color: '#713f12', lineHeight: 1.4 }}>{carta.poder_especial}</div>
      </div>
      {seleccionada && (
        <div style={{ position: 'absolute', top: '.4rem', right: '.4rem', width: '20px', height: '20px',
          borderRadius: '50%', background: '#16a34a', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700 }}>✓</div>
      )}
    </button>
  );
}

/* ── Tarjeta candidato ─────────────────────────────────────── */
function CandidatoCard({ candidato, index, estado, onAceptar, onRechazar }) {
  const bg  = estado === 'aceptado' ? '#f0fdf4' : estado === 'buscando' ? '#fffbeb' : '#faf5ff';
  const brd = estado === 'aceptado' ? '#86efac' : estado === 'buscando' ? '#fde68a' : '#e9d5ff';
  const avatarBg = [`#7c3aed`, '#1d4ed8', '#0891b2', '#16a34a', '#d97706'][index % 5];

  return (
    <div style={{ border: `2px solid ${brd}`, borderRadius: '12px', background: bg,
      padding: '.9rem 1rem', transition: 'all .3s' }}>
      <div style={{ display: 'flex', gap: '.85rem', alignItems: 'flex-start' }}>
        {/* Avatar */}
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
          background: avatarBg, color: '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '.95rem' }}>
          {index + 1}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '.4rem', marginBottom: '.3rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '.98rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                {candidato.nombre}
              </div>
              <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', marginTop: '.2rem', flexWrap: 'wrap' }}>
                <span style={{ background: avatarBg, color: '#fff', borderRadius: '4px',
                  padding: '.1rem .5rem', fontSize: '.65rem', fontFamily: 'var(--mono)', fontWeight: 700 }}>
                  {candidato.cargo_sugerido}
                </span>
                {candidato.ciudad && (
                  <span style={{ fontSize: '.68rem', color: '#7c3aed', fontFamily: 'var(--mono)' }}>
                    📍 {candidato.ciudad}
                  </span>
                )}
              </div>
            </div>

            {/* Botones / estado */}
            {estado === 'pendiente' && (
              <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                <button onClick={() => onAceptar(index)}
                  style={{ padding: '.35rem .8rem', borderRadius: '7px', cursor: 'pointer',
                    fontFamily: 'var(--mono)', fontSize: '.72rem', fontWeight: 700,
                    border: '1.5px solid #16a34a', background: '#16a34a', color: '#fff' }}>
                  ✓ Aceptar
                </button>
                <button onClick={() => onRechazar(index)}
                  style={{ padding: '.35rem .8rem', borderRadius: '7px', cursor: 'pointer',
                    fontFamily: 'var(--mono)', fontSize: '.72rem', fontWeight: 700,
                    border: '1.5px solid #dc2626', background: '#fff', color: '#dc2626' }}>
                  ✗ Rechazar
                </button>
              </div>
            )}
            {estado === 'buscando' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem',
                fontFamily: 'var(--mono)', fontSize: '.72rem', color: '#d97706', flexShrink: 0 }}>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: '1rem' }}>⟳</span>
                Buscando en Cbba...
              </div>
            )}
            {estado === 'aceptado' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: '#16a34a', color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✓</div>
            )}
          </div>

          {/* Resumen / trayectoria */}
          {(candidato.resumen || candidato.trayectoria) && (
            <div style={{ fontSize: '.81rem', color: '#334155', lineHeight: 1.6, marginTop: '.3rem' }}>
              {candidato.resumen || candidato.trayectoria}
            </div>
          )}
          {candidato.por_que && (
            <div style={{ fontSize: '.76rem', color: '#7c3aed', marginTop: '.3rem', fontStyle: 'italic' }}>
              ✓ {candidato.por_que}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Nodo organigrama ──────────────────────────────────────── */
function OrgNodo({ cargo, nombre, color = '#1d4ed8', small = false }) {
  return (
    <div style={{ background: color + '15', border: `1.5px solid ${color}44`, borderRadius: '8px',
      padding: small ? '.32rem .6rem' : '.5rem .85rem', textAlign: 'center',
      minWidth: small ? '115px' : '150px', maxWidth: small ? '140px' : '180px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: small ? '.6rem' : '.67rem',
        color, textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 700, lineHeight: 1.25 }}>{cargo}</div>
      {nombre && <div style={{ fontSize: small ? '.63rem' : '.7rem', color: '#334155', marginTop: '.18rem', lineHeight: 1.3 }}>{nombre}</div>}
    </div>
  );
}

/* ── Componente principal ───────────────────────────────────── */
export default function StartupCardsSimulator() {
  const [phase,       setPhase]       = useState('inicio');
  const [cartas,      setCartas]      = useState([]);
  const [selecIds,    setSelecIds]    = useState([]);
  const [marca,       setMarca]       = useState({ nombre: '', colores: '', eslogan: '' });
  const [empresa,     setEmpresa]     = useState(null);
  const [candidatos,  setCandidatos]  = useState([]);   // [{...data, estado:'pendiente'|'aceptado'|'buscando'}]
  const [rejectedMap, setRejectedMap] = useState({});   // { index: [nombres rechazados] }
  const [termMsgs,    setTermMsgs]    = useState([]);
  const [error,       setError]       = useState(null);

  const cartasSelec       = cartas.filter(c => selecIds.includes(c.id));
  const canContinuarSelec = selecIds.length === 5;
  const canConstruir      = marca.nombre.trim().length >= 2;
  const todosDecididos    = candidatos.length > 0 && candidatos.every(c => c.estado === 'aceptado');

  /* Helper: revelar mensajes en terminal progresivamente */
  const revealTerminal = (msgs, interval = 370) =>
    new Promise(resolve => {
      setTermMsgs([]);
      msgs.forEach((msg, i) => {
        setTimeout(() => {
          setTermMsgs(prev => [...prev, msg]);
          if (i === msgs.length - 1) setTimeout(resolve, 400);
        }, i * interval);
      });
    });

  /* ── Abrir mazo ──────────────────────────────────────────── */
  const abrirMazo = async () => {
    setPhase('generando');
    setError(null);
    try {
      const [, { data }] = await Promise.all([
        revealTerminal(MSGS_GENERANDO),
        api.post('/auth/generar-cartas', {}),
      ]);
      setCartas(data.cartas || []);
      setSelecIds([]);
      setPhase('seleccion');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar las cartas.');
      setPhase('inicio');
    }
  };

  /* ── Toggle carta ────────────────────────────────────────── */
  const toggleCarta = (carta) => {
    setSelecIds(prev => {
      if (prev.includes(carta.id)) return prev.filter(id => id !== carta.id);
      if (prev.length >= 5) return prev;
      return [...prev, carta.id];
    });
  };

  /* ── Construir empresa ───────────────────────────────────── */
  const construir = async () => {
    setPhase('analizando');
    setError(null);
    try {
      const [, { data }] = await Promise.all([
        revealTerminal(getMsgsAnalizando(cartasSelec, marca)),
        api.post('/auth/construir-empresa', { cartasSeleccionadas: cartasSelec, marca }),
      ]);
      setEmpresa(data);
      // Inicializar estado de candidatos
      const init = (data.personajes_clave || []).map(p => ({ ...p, estado: 'pendiente' }));
      setCandidatos(init);
      setRejectedMap({});
      setPhase('candidatos');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al construir la empresa.');
      setPhase('marca');
    }
  };

  /* ── Aceptar candidato ───────────────────────────────────── */
  const aceptarCandidato = (idx) => {
    setCandidatos(prev => prev.map((c, i) => i === idx ? { ...c, estado: 'aceptado' } : c));
  };

  /* ── Rechazar y buscar reemplazo ─────────────────────────── */
  const rechazarCandidato = async (idx) => {
    const candidatoActual = candidatos[idx];
    // Agregar al listado de rechazados para este slot
    const rechazadosSlot = [...(rejectedMap[idx] || []), candidatoActual.nombre];
    setRejectedMap(prev => ({ ...prev, [idx]: rechazadosSlot }));
    setCandidatos(prev => prev.map((c, i) => i === idx ? { ...c, estado: 'buscando' } : c));

    try {
      const rubros = cartasSelec.map(c => `${c.nombre} (${c.rubro})`);
      const { data } = await api.post('/auth/buscar-candidato', {
        cargo: candidatoActual.cargo_sugerido,
        rubros,
        rechazados: rechazadosSlot,
      });
      setCandidatos(prev => prev.map((c, i) =>
        i === idx ? { ...data, estado: 'pendiente' } : c
      ));
    } catch (err) {
      // Si falla la búsqueda, vuelve al original como pendiente
      setCandidatos(prev => prev.map((c, i) =>
        i === idx ? { ...candidatoActual, estado: 'pendiente' } : c
      ));
    }
  };

  /* ── Confirmar equipo e ir a resultados ──────────────────── */
  const confirmarEquipo = () => {
    const aceptados = candidatos.filter(c => c.estado === 'aceptado');

    // Sincronizar nombres del organigrama con el equipo confirmado por índice:
    // aceptados[0] → CEO, aceptados[1..] → gerencias en orden
    const orgActualizado = empresa.organigrama
      ? {
          ceo: {
            ...empresa.organigrama.ceo,
            nombre: aceptados[0]?.nombre || empresa.organigrama.ceo?.nombre,
          },
          gerencias: (empresa.organigrama.gerencias || []).map((g, i) => ({
            ...g,
            nombre: aceptados[i + 1]?.nombre || g.nombre,
          })),
        }
      : empresa.organigrama;

    setEmpresa(prev => ({
      ...prev,
      personajes_clave: aceptados,
      organigrama: orgActualizado,
    }));
    setPhase('resultados');
  };

  /* ── Reset ───────────────────────────────────────────────── */
  const reset = () => {
    setPhase('inicio'); setCartas([]); setSelecIds([]);
    setMarca({ nombre: '', colores: '', eslogan: '' });
    setEmpresa(null); setCandidatos([]); setRejectedMap({});
    setTermMsgs([]); setError(null);
  };

  /* ── PDF ─────────────────────────────────────────────────── */
  const downloadPDF = () => {
    if (!empresa) return;
    const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const ic = IMPACTO_COLOR(empresa.nivel_impacto?.puntuacion || 0);

    const cartasHtml = cartasSelec.map(c => {
      const r = RAREZA[c.rareza] || RAREZA.comun;
      return `<div style="border:1.5px solid ${r.badge};border-radius:7px;padding:.4rem .5rem;display:flex;gap:.4rem;align-items:center;font-size:9pt">
        <span style="font-size:1.3rem">${c.emoji}</span>
        <div><strong>${c.nombre}</strong><br><small style="color:${r.badge}">${c.rubro} · ${r.label}</small></div>
      </div>`;
    }).join('');

    const personajesHtml = candidatos.filter(p => p.estado === 'aceptado').map((p, i) => `
      <div style="display:flex;gap:.6rem;padding:.45rem 0;border-bottom:1px solid #f1f5f9;font-size:9pt;line-height:1.5;align-items:flex-start">
        <div style="width:20px;height:20px;border-radius:50%;background:#7c3aed;color:#fff;display:flex;align-items:center;justify-content:center;font-size:8pt;font-weight:bold;flex-shrink:0;margin-top:.1rem">${i+1}</div>
        <div><strong>${p.nombre}</strong> — <em>${p.cargo_sugerido}</em>${p.ciudad ? ` · 📍 ${p.ciudad}` : ''}<br>
        <small>${p.resumen || p.trayectoria || ''}</small><br>
        ${p.por_que ? `<small style="color:#7c3aed">✓ ${p.por_que}</small>` : ''}</div>
      </div>`).join('');

    const { ceo, gerencias = [] } = empresa.organigrama || {};
    const orgHtml = `
      <div style="text-align:center;margin-bottom:.5rem">
        <div style="display:inline-block;background:#ede9fe;border:1.5px solid #7c3aed;border-radius:7px;padding:.5rem 1.2rem;font-weight:bold;font-size:10pt">${ceo?.cargo || 'CEO'}<br><small>${ceo?.nombre || ''}</small></div>
      </div>
      <div style="display:flex;gap:.7rem;flex-wrap:wrap;justify-content:center">
        ${gerencias.map(g => `<div style="display:flex;flex-direction:column;align-items:center;gap:.3rem">
          <div style="background:#dbeafe;border:1.5px solid #3b82f6;border-radius:6px;padding:.35rem .7rem;text-align:center;font-size:9pt;min-width:120px">${g.cargo}<br><small>${g.nombre||''}</small></div>
          ${(g.jefaturas||[]).map(j=>`<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:5px;padding:.22rem .5rem;font-size:8.5pt;text-align:center">${j}</div>`).join('')}
        </div>`).join('')}
      </div>`;

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Startup Cards — ${marca.nombre}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}@page{margin:1.4cm}
body{font-family:'Georgia',serif;color:#1e293b;font-size:10pt;padding:.4cm}
.header{border-bottom:3px solid #7c3aed;padding-bottom:.8rem;margin-bottom:1rem}
.title{font-size:18pt;font-weight:bold;color:#7c3aed}
.section{margin:.9rem 0}
.section-title{font-size:11pt;font-weight:bold;color:#7c3aed;border-bottom:2px solid #e9d5ff;padding-bottom:.3rem;margin-bottom:.6rem}
.impact-box{border:2px solid ${ic};border-radius:8px;padding:.7rem 1rem;display:flex;align-items:center;gap:1rem;margin:.5rem 0}
.impact-num{font-size:15pt;font-weight:bold;color:${ic};font-family:monospace;line-height:1}
.footer{margin-top:1.5rem;padding-top:.7rem;border-top:1px solid #e2e8f0;font-size:8pt;color:#94a3b8;text-align:center}
</style></head><body>
<div class="header">
  <div class="title">🃏 Startup Cards — ${marca.nombre}</div>
  <div style="font-size:9.5pt;color:#64748b;margin-top:.2rem">${marca.eslogan || 'Constructor de empresa · Mercado Cochabamba'}</div>
  <div style="font-size:9pt;color:#475569;margin-top:.4rem">📅 ${fecha} · ${marca.colores ? `🎨 ${marca.colores}` : ''}</div>
</div>
<div class="section">
  <div class="section-title">Rubros seleccionados</div>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:.5rem;margin:.4rem 0">${cartasHtml}</div>
  <p style="font-size:9.5pt;color:#334155;margin-top:.6rem;line-height:1.65">${empresa.resumen_empresa}</p>
</div>
<div class="section">
  <div class="section-title">Análisis de mercado — Cochabamba</div>
  <p style="font-size:9.5pt;line-height:1.65;color:#334155">${empresa.analisis_mercado?.descripcion||''}</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin-top:.6rem">
    <div>
      <div style="font-weight:bold;color:#16a34a;font-size:9.5pt;margin-bottom:.3rem">✅ Oportunidades</div>
      ${(empresa.analisis_mercado?.oportunidades||[]).map(o=>`<div style="font-size:9.5pt;color:#334155;line-height:1.55;padding:.12rem 0">• ${o}</div>`).join('')}
    </div>
    <div>
      <div style="font-weight:bold;color:#dc2626;font-size:9.5pt;margin-bottom:.3rem">⚠ Desafíos</div>
      ${(empresa.analisis_mercado?.desafios||[]).map(d=>`<div style="font-size:9.5pt;color:#334155;line-height:1.55;padding:.12rem 0">• ${d}</div>`).join('')}
    </div>
  </div>
</div>
<div class="section">
  <div class="section-title">Nivel de impacto</div>
  <div class="impact-box">
    <div style="width:55px;height:55px;border-radius:50%;border:2.5px solid ${ic};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
      <span class="impact-num">${empresa.nivel_impacto?.puntuacion}</span>
      <span style="font-size:7.5pt;color:${ic};font-family:monospace">/10</span>
    </div>
    <div><strong style="color:${ic};font-size:12pt">${empresa.nivel_impacto?.etiqueta}</strong><br>
    <span style="font-size:9.5pt;color:#475569">${empresa.nivel_impacto?.descripcion}</span></div>
  </div>
</div>
<div class="section">
  <div class="section-title">Equipo directivo confirmado</div>
  ${personajesHtml}
</div>
<div class="section">
  <div class="section-title">Organigrama</div>
  ${orgHtml}
</div>
<div class="footer">Generado con IA · Startup Cards · SEGEDU · ${fecha}<br>
Desarrollado por Dhc. Ing. Carlos Andres Azcarraga Esquivel</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;
    const win = window.open('', '_blank', 'width=1000,height=780');
    if (win) { win.document.write(html); win.document.close(); }
  };

  /* ─────────────────── RENDER ───────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* ── INICIO ──────────────────────────────────────── */}
      {phase === 'inicio' && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'linear-gradient(135deg,#faf5ff,#eff6ff)',
          borderRadius: '16px', border: '1px solid #e9d5ff' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🃏</div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', color: '#1e293b', marginBottom: '.5rem' }}>Startup Cards</h2>
          <p style={{ fontSize: '.9rem', color: '#64748b', maxWidth: '500px', margin: '0 auto 1.75rem', lineHeight: 1.65 }}>
            La IA genera <strong>15 cartas de rubros de negocio</strong>. Elige 5, define tu marca y
            construye tu empresa con <strong>análisis de mercado para Cochabamba</strong>,
            personajes bolivianos reales y organigrama jerárquico.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {['🎴 15 cartas', '5️⃣ Elige 5', '🏢 Tu marca', '👥 Equipo directivo', '📊 Organigrama'].map(t => (
              <div key={t} style={{ background: '#fff', borderRadius: '8px', padding: '.4rem .75rem',
                border: '1px solid #e9d5ff', fontSize: '.8rem', color: '#475569' }}>{t}</div>
            ))}
          </div>
          <button onClick={abrirMazo}
            style={{ padding: '.8rem 2.2rem', borderRadius: '10px', cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: '.95rem', fontWeight: 700, border: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#1d4ed8)', color: '#fff',
              boxShadow: '0 4px 14px rgba(124,58,237,.35)' }}>
            🎴 Abrir mi mazo
          </button>
        </div>
      )}

      {/* ── GENERANDO ───────────────────────────────────── */}
      {phase === 'generando' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AITerminal msgs={termMsgs} />
          <div style={{ textAlign: 'center', padding: '1.5rem', background: '#faf5ff',
            borderRadius: '12px', border: '1px solid #e9d5ff' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '.5rem',
              animation: 'cardSpin 1.2s ease-in-out infinite alternate', display: 'inline-block' }}>🃏</div>
            <style>{`@keyframes cardSpin{from{transform:rotate(-8deg) scale(1)}to{transform:rotate(8deg) scale(1.08)}}`}</style>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: '#4c1d95' }}>
              Generando tu mazo de negocios...
            </div>
          </div>
        </div>
      )}

      {/* ── SELECCIÓN ───────────────────────────────────── */}
      {phase === 'seleccion' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Elige 5 cartas para tu empresa</div>
              <div style={{ fontSize: '.8rem', color: '#64748b', marginTop: '.1rem' }}>Combina rubros que se complementen para crear algo innovador</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '.82rem', fontWeight: 700,
                color: selecIds.length === 5 ? '#16a34a' : '#7c3aed' }}>{selecIds.length}/5 seleccionadas</div>
              <button onClick={() => { setCartas([]); setSelecIds([]); abrirMazo(); }}
                style={{ padding: '.35rem .75rem', borderRadius: '7px', cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: '.72rem', border: '1.5px solid #e9d5ff',
                  background: '#fff', color: '#7c3aed' }}>🔄 Nuevo mazo</button>
            </div>
          </div>
          <div style={{ height: '5px', background: '#ede9fe', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(selecIds.length / 5) * 100}%`,
              background: 'linear-gradient(90deg,#7c3aed,#1d4ed8)', borderRadius: '99px', transition: 'width .3s' }} />
          </div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {Object.entries(RAREZA).map(([k, r]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '.3rem',
                background: r.bg, border: `1px solid ${r.border}`, borderRadius: '5px', padding: '.2rem .5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: r.badge }} />
                <span style={{ fontSize: '.64rem', color: r.text, fontFamily: 'var(--mono)' }}>{r.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.85rem', justifyContent: 'center' }}>
            {cartas.map(c => (
              <Carta key={c.id} carta={c}
                seleccionada={selecIds.includes(c.id)}
                bloqueada={!selecIds.includes(c.id) && selecIds.length >= 5}
                onClick={toggleCarta} />
            ))}
          </div>
          {selecIds.length > 0 && (
            <div style={{ background: '#f8faff', border: '1px solid #e9d5ff', borderRadius: '10px',
              padding: '.9rem 1.1rem', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: '.75rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '.66rem', color: '#7c3aed',
                  textTransform: 'uppercase', marginBottom: '.3rem' }}>Tu selección</div>
                <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                  {cartasSelec.map(c => (
                    <span key={c.id} style={{ background: '#ede9fe', border: '1px solid #c4b5fd',
                      borderRadius: '5px', padding: '.18rem .5rem', fontSize: '.74rem', color: '#4c1d95' }}>
                      {c.emoji} {c.nombre}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={() => setPhase('marca')} disabled={!canContinuarSelec}
                style={{ padding: '.5rem 1.3rem', borderRadius: '8px',
                  cursor: canContinuarSelec ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--mono)', fontSize: '.82rem', fontWeight: 700, border: 'none',
                  background: canContinuarSelec ? 'linear-gradient(135deg,#7c3aed,#1d4ed8)' : '#e2e8f0',
                  color: canContinuarSelec ? '#fff' : '#94a3b8' }}>
                {canContinuarSelec ? 'Definir mi marca →' : `Elige ${5 - selecIds.length} más`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MARCA ───────────────────────────────────────── */}
      {phase === 'marca' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '.85rem 1.1rem' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', color: '#7c3aed',
              textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.5rem' }}>🃏 Rubros seleccionados</div>
            <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap' }}>
              {cartasSelec.map(c => {
                const r = RAREZA[c.rareza] || RAREZA.comun;
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '.35rem',
                    background: r.bg, border: `1.5px solid ${r.border}`, borderRadius: '7px', padding: '.3rem .6rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{c.emoji}</span>
                    <div>
                      <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#1e293b' }}>{c.nombre}</div>
                      <div style={{ fontSize: '.6rem', color: r.text, fontFamily: 'var(--mono)' }}>{c.rubro}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.4rem' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>🏢 Define tu marca</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              {[
                { key: 'nombre',  label: 'Nombre de la empresa *', ph: 'Ej: InnovaBolivia S.R.L.' },
                { key: 'colores', label: 'Colores corporativos',    ph: 'Ej: Azul marino, dorado y blanco' },
                { key: 'eslogan', label: 'Eslogan o tagline',       ph: 'Ej: Conectando el futuro de Bolivia' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: '.68rem',
                    color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.3rem' }}>
                    {f.label}
                  </label>
                  <input type="text" value={marca[f.key]}
                    onChange={e => setMarca(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.ph}
                    style={{ width: '100%', padding: '.65rem .85rem', borderRadius: '8px',
                      border: '1.5px solid #cbd5e1', fontSize: '.88rem', fontFamily: 'inherit',
                      outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = '#7c3aed'; }}
                    onBlur={e => { e.target.style.borderColor = '#cbd5e1'; }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => setPhase('seleccion')}
              style={{ padding: '.45rem .9rem', borderRadius: '7px', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: '.75rem', border: '1.5px solid #cbd5e1',
                background: '#fff', color: '#64748b' }}>← Volver a las cartas</button>
            <button onClick={construir} disabled={!canConstruir}
              style={{ padding: '.6rem 1.6rem', borderRadius: '8px',
                cursor: canConstruir ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--mono)', fontSize: '.85rem', fontWeight: 700, border: 'none',
                background: canConstruir ? 'linear-gradient(135deg,#7c3aed,#1d4ed8)' : '#e2e8f0',
                color: canConstruir ? '#fff' : '#94a3b8' }}>🏗 Construir mi empresa →</button>
          </div>
        </div>
      )}

      {/* ── ANALIZANDO ──────────────────────────────────── */}
      {phase === 'analizando' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AITerminal msgs={termMsgs} />
          <div style={{ textAlign: 'center', padding: '1.5rem', background: '#faf5ff',
            borderRadius: '12px', border: '1px solid #e9d5ff' }}>
            <div style={{ fontSize: '2rem', marginBottom: '.5rem',
              animation: 'pulse 1.4s ease-in-out infinite', display: 'inline-block' }}>🏗</div>
            <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.8}}`}</style>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: '#4c1d95' }}>
              Construyendo tu empresa...
            </div>
            <div style={{ fontSize: '.8rem', color: '#7c3aed', marginTop: '.3rem' }}>
              Analizando mercado de Cochabamba · Buscando personajes clave bolivianos
            </div>
          </div>
        </div>
      )}

      {/* ── CANDIDATOS ──────────────────────────────────── */}
      {phase === 'candidatos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#faf5ff,#eff6ff)', border: '1px solid #e9d5ff',
            borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '.3rem' }}>
              👥 Selección de tu equipo directivo
            </div>
            <p style={{ fontSize: '.83rem', color: '#64748b', margin: 0, lineHeight: 1.55 }}>
              La IA sugiere personajes bolivianos reales con trayectoria para cada cargo.
              <strong> Acepta o rechaza</strong> cada candidato — si rechazas, la IA buscará otro en Cochabamba.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.65rem', flexWrap: 'wrap' }}>
              {candidatos.map((c, i) => (
                <div key={i} style={{ width: '28px', height: '28px', borderRadius: '50%',
                  border: `2px solid ${c.estado === 'aceptado' ? '#16a34a' : c.estado === 'buscando' ? '#d97706' : '#c4b5fd'}`,
                  background: c.estado === 'aceptado' ? '#dcfce7' : c.estado === 'buscando' ? '#fef3c7' : '#ede9fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.7rem', fontWeight: 700,
                  color: c.estado === 'aceptado' ? '#16a34a' : c.estado === 'buscando' ? '#d97706' : '#7c3aed' }}>
                  {c.estado === 'aceptado' ? '✓' : c.estado === 'buscando' ? '⟳' : i + 1}
                </div>
              ))}
              <span style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: '#7c3aed' }}>
                {candidatos.filter(c => c.estado === 'aceptado').length}/{candidatos.length} confirmados
              </span>
            </div>
          </div>

          {/* Lista candidatos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {candidatos.map((c, i) => (
              <CandidatoCard
                key={i}
                candidato={c}
                index={i}
                estado={c.estado}
                onAceptar={aceptarCandidato}
                onRechazar={rechazarCandidato}
              />
            ))}
          </div>

          {/* Botón continuar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={confirmarEquipo} disabled={!todosDecididos}
              style={{ padding: '.6rem 1.8rem', borderRadius: '9px',
                cursor: todosDecididos ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--mono)', fontSize: '.88rem', fontWeight: 700, border: 'none',
                background: todosDecididos ? 'linear-gradient(135deg,#16a34a,#0891b2)' : '#e2e8f0',
                color: todosDecididos ? '#fff' : '#94a3b8',
                boxShadow: todosDecididos ? '0 4px 12px rgba(22,163,74,.3)' : 'none' }}>
              {todosDecididos ? '🚀 Continuar con este equipo →' : `Acepta los ${candidatos.filter(c=>c.estado==='pendiente').length} candidatos pendientes`}
            </button>
          </div>
        </div>
      )}

      {/* ── RESULTADOS ──────────────────────────────────── */}
      {phase === 'resultados' && empresa && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}>
            <button onClick={reset}
              style={{ padding: '.45rem 1rem', borderRadius: '7px', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: '.75rem', fontWeight: 700,
                border: '1.5px solid #cbd5e1', background: '#fff', color: '#64748b' }}>↺ Nueva empresa</button>
            <button onClick={downloadPDF}
              style={{ padding: '.45rem 1rem', borderRadius: '7px', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: '.75rem', fontWeight: 700,
                border: '1.5px solid #7c3aed', background: '#7c3aed', color: '#fff' }}>⬇ Descargar reporte PDF</button>
          </div>

          {/* Header empresa */}
          <div style={{ background: 'linear-gradient(135deg,#faf5ff,#eff6ff)', border: '1.5px solid #c4b5fd',
            borderRadius: '14px', padding: '1.2rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              flexWrap: 'wrap', gap: '1rem', marginBottom: '.85rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.45rem', fontWeight: 700, color: '#1e293b' }}>🏢 {marca.nombre}</div>
                {marca.eslogan && <div style={{ fontStyle: 'italic', color: '#7c3aed', fontSize: '.88rem', marginTop: '.2rem' }}>"{marca.eslogan}"</div>}
                {marca.colores && <div style={{ fontSize: '.74rem', color: '#64748b', marginTop: '.15rem', fontFamily: 'var(--mono)' }}>🎨 {marca.colores}</div>}
              </div>
              {empresa.nivel_impacto && (
                <div style={{ textAlign: 'center', background: '#fff', border: `2px solid ${IMPACTO_COLOR(empresa.nivel_impacto.puntuacion)}`,
                  borderRadius: '12px', padding: '.65rem 1rem' }}>
                  <div style={{ fontSize: '1.7rem', fontWeight: 900, color: IMPACTO_COLOR(empresa.nivel_impacto.puntuacion),
                    fontFamily: 'var(--mono)', lineHeight: 1 }}>{empresa.nivel_impacto.puntuacion}</div>
                  <div style={{ fontSize: '.59rem', color: IMPACTO_COLOR(empresa.nivel_impacto.puntuacion), fontFamily: 'var(--mono)' }}>/10</div>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: IMPACTO_COLOR(empresa.nivel_impacto.puntuacion), marginTop: '.15rem' }}>{empresa.nivel_impacto.etiqueta}</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '.38rem', flexWrap: 'wrap' }}>
              {cartasSelec.map(c => { const r = RAREZA[c.rareza]||RAREZA.comun; return (
                <span key={c.id} style={{ background: r.bg, border: `1px solid ${r.border}`, borderRadius: '5px',
                  padding: '.18rem .48rem', fontSize: '.71rem', color: r.text, fontFamily: 'var(--mono)' }}>
                  {c.emoji} {c.nombre}
                </span>
              );})}
            </div>
          </div>

          {/* Resumen */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
            padding: '.95rem 1.2rem', fontSize: '.9rem', color: '#334155', lineHeight: 1.75 }}>
            {empresa.resumen_empresa}
          </div>

          {/* Análisis mercado */}
          <div style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '.65rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              fontFamily: 'var(--mono)', fontSize: '.7rem', fontWeight: 700, color: '#1d4ed8',
              textTransform: 'uppercase', letterSpacing: '.07em' }}>📍 Análisis de mercado — Cochabamba</div>
            <div style={{ padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '.88rem', color: '#334155', lineHeight: 1.7, marginBottom: '1rem' }}>
                {empresa.analisis_mercado?.descripcion}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { title: '✅ Oportunidades', items: empresa.analisis_mercado?.oportunidades, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                  { title: '⚠ Desafíos',       items: empresa.analisis_mercado?.desafios,      color: '#dc2626', bg: '#fff7f7', border: '#fecaca' },
                ].map(col => (
                  <div key={col.title} style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: '8px', padding: '.7rem .85rem' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', fontWeight: 700,
                      color: col.color, textTransform: 'uppercase', marginBottom: '.4rem' }}>{col.title}</div>
                    {(col.items||[]).map((item,i) => (
                      <div key={i} style={{ display: 'flex', gap: '.38rem', fontSize: '.82rem',
                        color: '#334155', lineHeight: 1.5, marginBottom: '.22rem' }}>
                        <span style={{ flexShrink: 0 }}>•</span>{item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Equipo directivo confirmado */}
          <div style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '.65rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              fontFamily: 'var(--mono)', fontSize: '.7rem', fontWeight: 700, color: '#7c3aed',
              textTransform: 'uppercase', letterSpacing: '.07em' }}>👥 Equipo directivo confirmado</div>
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
              {candidatos.filter(p => p.estado === 'aceptado').map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start',
                  background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '.8rem 1rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: [`#7c3aed`,`#1d4ed8`,`#0891b2`,`#16a34a`,`#d97706`][i%5], color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '.88rem' }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.3rem' }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 700, color: '#1e293b' }}>{p.nombre}</div>
                      <div style={{ background: '#7c3aed', color: '#fff', borderRadius: '5px',
                        padding: '.1rem .5rem', fontSize: '.65rem', fontFamily: 'var(--mono)', fontWeight: 700 }}>{p.cargo_sugerido}</div>
                    </div>
                    {p.ciudad && <div style={{ fontSize: '.68rem', color: '#7c3aed', fontFamily: 'var(--mono)', marginTop: '.1rem' }}>📍 {p.ciudad}</div>}
                    {(p.resumen || p.trayectoria) && (
                      <div style={{ fontSize: '.81rem', color: '#334155', lineHeight: 1.6, marginTop: '.3rem' }}>{p.resumen || p.trayectoria}</div>
                    )}
                    {p.por_que && <div style={{ fontSize: '.77rem', color: '#7c3aed', marginTop: '.25rem', fontStyle: 'italic' }}>✓ {p.por_que}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Organigrama */}
          <div style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '.65rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              fontFamily: 'var(--mono)', fontSize: '.7rem', fontWeight: 700, color: '#1d4ed8',
              textTransform: 'uppercase', letterSpacing: '.07em' }}>🏗 Organigrama jerárquico</div>
            <div style={{ padding: '1.25rem 1rem', overflowX: 'auto' }}>
              {empresa.organigrama?.ceo && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.55rem' }}>
                  <OrgNodo cargo={empresa.organigrama.ceo.cargo} nombre={empresa.organigrama.ceo.nombre} color="#7c3aed" />
                  {(empresa.organigrama.gerencias||[]).length > 0 && (
                    <>
                      <div style={{ width: '2px', height: '20px', background: '#c4b5fd' }} />
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
                        {empresa.organigrama.gerencias.map((g, gi) => (
                          <div key={gi} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem' }}>
                            <OrgNodo cargo={g.cargo} nombre={g.nombre} color="#1d4ed8" />
                            {(g.jefaturas||[]).length > 0 && (
                              <>
                                <div style={{ width: '2px', height: '14px', background: '#bfdbfe' }} />
                                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                  {g.jefaturas.map((j, ji) => (
                                    <OrgNodo key={ji} cargo={j} nombre={null} color="#0891b2" small />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <p style={{ fontSize: '.75rem', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
            ⚠ Este análisis es generado por IA con prompts específicos para la asignatura y tiene carácter orientativo.
            Complementa con investigación de campo local. Desarrollado por Dhc. Ing. Carlos Andres Azcarraga Esquivel
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px',
          padding: '1rem 1.25rem', display: 'flex', gap: '.75rem' }}>
          <span>⚠</span>
          <div>
            <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '.2rem' }}>Error</div>
            <div style={{ fontSize: '.85rem', color: '#7f1d1d' }}>{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
