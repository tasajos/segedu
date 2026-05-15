import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente de aprobación', color: '#d97706', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.3)' },
  aprobado:  { label: 'Inscrito — Aprobado',     color: '#16a34a', bg: 'rgba(22,163,74,.1)',  border: 'rgba(22,163,74,.3)' },
  rechazado: { label: 'Solicitud rechazada',      color: '#dc2626', bg: 'rgba(220,38,38,.1)',  border: 'rgba(220,38,38,.3)' },
};

const EXT_ICON = { pdf: '📄', doc: '📝', docx: '📝', pptx: '📊', xlsx: '📊', mp4: '🎬', mp3: '🎵', zip: '📦' };
const extIcon = (t) => EXT_ICON[t] || '📁';

function CursoModal({ curso, onClose, onInscribir, onCancelar, procesando }) {
  if (!curso) return null;
  const yaInscrito = parseInt(curso.inscrito_yo) > 0;
  const miEstado   = curso.mi_estado;
  const aprobados  = parseInt(curso.inscritos) || 0;
  const max        = parseInt(curso.max_estudiantes);
  const pct        = Math.min(100, Math.round((aprobados / max) * 100));
  const lleno      = aprobados >= max;

  const BANNER = {
    aprobado:  { bg:'#052e16', border:'#16a34a', text:'#4ade80', icon:'✓', msg:'Inscripción aprobada — ya formas parte de este curso' },
    pendiente: { bg:'#1c1003', border:'#d97706', text:'#fbbf24', icon:'⏳', msg:'Solicitud enviada — esperando aprobación del jefe de carrera' },
    rechazado: { bg:'#1f0707', border:'#dc2626', text:'#f87171', icon:'✕', msg:'Tu solicitud fue rechazada — puedes volver a intentarlo' },
  };
  const banner = miEstado ? BANNER[miEstado] : null;

  return createPortal(
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.72)', backdropFilter:'blur(6px)',
        zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background:'#0f172a', borderRadius:'16px', width:'100%', maxWidth:'580px',
        maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 32px 100px rgba(0,0,0,.7)', border:'1px solid rgba(255,255,255,.08)'
      }}>

        {/* ── Hero ── */}
        <div style={{
          background:'linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%)',
          padding:'1.75rem 1.75rem 1.5rem', position:'relative', overflow:'hidden', flexShrink:0
        }}>
          {/* Orb decoration */}
          <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'200px', height:'200px',
            borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:'-60px', left:'60px', width:'120px', height:'120px',
            borderRadius:'50%', background:'rgba(59,130,246,.15)', pointerEvents:'none' }}/>

          <button onClick={onClose}
            style={{ position:'absolute', top:'1rem', right:'1rem',
              background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.18)',
              color:'#fff', width:'30px', height:'30px', borderRadius:'50%',
              cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
          >×</button>

          <div style={{ fontFamily:'var(--mono)', fontSize:'.6rem', letterSpacing:'.22em',
            color:'rgba(147,197,253,.8)', textTransform:'uppercase', marginBottom:'.5rem' }}>
            Curso especial
          </div>
          <h2 style={{ fontFamily:'var(--serif)', fontSize:'1.65rem', color:'#fff',
            margin:'0', lineHeight:1.2, textShadow:'0 2px 12px rgba(0,0,0,.3)' }}>
            {curso.nombre}
          </h2>
        </div>

        {/* ── Estado banner ── */}
        {banner && (
          <div style={{ background:banner.bg, borderBottom:`1px solid ${banner.border}33`,
            padding:'.75rem 1.75rem', display:'flex', alignItems:'center', gap:'.65rem', flexShrink:0 }}>
            <span style={{ fontSize:'1rem', color:banner.text }}>{banner.icon}</span>
            <span style={{ fontFamily:'var(--mono)', fontSize:'.78rem', color:banner.text, fontWeight:600 }}>
              {banner.msg}
            </span>
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ overflowY:'auto', flex:1, display:'flex', flexDirection:'column' }}>

          {/* Cupos */}
          <div style={{ padding:'1.25rem 1.75rem', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.6rem' }}>
              <span style={{ fontFamily:'var(--mono)', fontSize:'.72rem', letterSpacing:'.1em',
                textTransform:'uppercase', color:'rgba(148,163,184,1)' }}>Cupos</span>
              <span style={{ fontFamily:'var(--mono)', fontSize:'.82rem', fontWeight:700,
                color: lleno ? '#f87171' : aprobados / max > 0.7 ? '#fbbf24' : '#4ade80' }}>
                {aprobados} / {max} {lleno ? '· Lleno' : `· ${max - aprobados} disponibles`}
              </span>
            </div>
            <div style={{ height:'8px', background:'rgba(255,255,255,.08)', borderRadius:'999px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, borderRadius:'999px', transition:'width .5s ease',
                background: pct >= 90 ? 'linear-gradient(90deg,#dc2626,#f87171)'
                           : pct >= 60 ? 'linear-gradient(90deg,#d97706,#fbbf24)'
                           : 'linear-gradient(90deg,#16a34a,#4ade80)' }}/>
            </div>
          </div>

          {/* Instructor */}
          {curso.instructor_nombre && (
            <div style={{ padding:'1rem 1.75rem', borderBottom:'1px solid rgba(255,255,255,.06)',
              display:'flex', gap:'.85rem', alignItems:'center' }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'50%', flexShrink:0,
                background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--serif)', fontWeight:700, fontSize:'1rem', color:'#fff',
                boxShadow:'0 0 0 3px rgba(59,130,246,.25)' }}>
                {curso.instructor_nombre[0]}{curso.instructor_apellido?.[0] || ''}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:'.95rem', color:'#f1f5f9' }}>
                  {curso.instructor_nombre} {curso.instructor_apellido || ''}
                </div>
                {curso.instructor_especialidad && (
                  <div style={{ fontSize:'.78rem', color:'#94a3b8', marginTop:'.15rem' }}>
                    {curso.instructor_especialidad}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Descripción */}
          {curso.descripcion && (
            <div style={{ padding:'1.25rem 1.75rem', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:'.65rem', letterSpacing:'.16em',
                textTransform:'uppercase', color:'#64748b', marginBottom:'.6rem' }}>Descripción</div>
              <p style={{ fontSize:'.9rem', lineHeight:1.7, margin:0, color:'#cbd5e1' }}>
                {curso.descripcion}
              </p>
            </div>
          )}

          {/* Requisitos */}
          {curso.requisitos && (
            <div style={{ padding:'1.25rem 1.75rem', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:'.65rem', letterSpacing:'.16em',
                textTransform:'uppercase', color:'#d97706', marginBottom:'.6rem' }}>Requisitos</div>
              <div style={{ padding:'.85rem 1rem', background:'rgba(217,119,6,.08)',
                border:'1px solid rgba(217,119,6,.2)', borderRadius:'8px' }}>
                <p style={{ fontSize:'.88rem', lineHeight:1.65, margin:0, color:'#fde68a' }}>
                  {curso.requisitos}
                </p>
              </div>
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex:1, minHeight:'1rem' }} />
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:'1.1rem 1.75rem', borderTop:'1px solid rgba(255,255,255,.1)',
          background:'rgba(0,0,0,.25)', display:'flex', alignItems:'center',
          justifyContent:'flex-end', gap:'.75rem', flexShrink:0 }}>

          <button onClick={onClose}
            style={{ padding:'.5rem 1.1rem', borderRadius:'8px', border:'1px solid rgba(255,255,255,.15)',
              background:'rgba(255,255,255,.05)', color:'#94a3b8', cursor:'pointer',
              fontFamily:'var(--mono)', fontSize:'.82rem', transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,.1)'; e.currentTarget.style.color='#e2e8f0'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.color='#94a3b8'; }}
          >Cerrar</button>

          {!yaInscrito && !lleno && (
            <button onClick={() => onInscribir(curso.id)} disabled={procesando === curso.id}
              style={{ padding:'.55rem 1.4rem', borderRadius:'8px', border:'none',
                background:'linear-gradient(135deg,#1d4ed8,#2563eb)', color:'#fff',
                cursor: procesando === curso.id ? 'not-allowed' : 'pointer',
                fontFamily:'var(--mono)', fontSize:'.82rem', fontWeight:700,
                boxShadow:'0 4px 14px rgba(37,99,235,.4)', transition:'all .15s',
                opacity: procesando === curso.id ? .7 : 1 }}>
              {procesando === curso.id ? 'Procesando...' : 'Pre-inscribirme'}
            </button>
          )}
          {!yaInscrito && lleno && (
            <span style={{ fontFamily:'var(--mono)', fontSize:'.8rem', color:'#f87171',
              padding:'.5rem 1rem', background:'rgba(239,68,68,.1)',
              border:'1px solid rgba(239,68,68,.25)', borderRadius:'8px' }}>
              Sin cupos disponibles
            </span>
          )}
          {yaInscrito && miEstado === 'pendiente' && (
            <button onClick={() => onCancelar(curso.id)} disabled={procesando === curso.id}
              style={{ padding:'.5rem 1.1rem', borderRadius:'8px',
                border:'1px solid rgba(251,191,36,.3)', background:'rgba(251,191,36,.07)',
                color:'#fbbf24', cursor:'pointer', fontFamily:'var(--mono)', fontSize:'.8rem' }}>
              {procesando === curso.id ? '...' : 'Cancelar solicitud'}
            </button>
          )}
          {yaInscrito && miEstado === 'rechazado' && (
            <button onClick={() => onInscribir(curso.id)} disabled={procesando === curso.id}
              style={{ padding:'.55rem 1.4rem', borderRadius:'8px', border:'none',
                background:'linear-gradient(135deg,#1d4ed8,#2563eb)', color:'#fff',
                cursor:'pointer', fontFamily:'var(--mono)', fontSize:'.82rem', fontWeight:700,
                boxShadow:'0 4px 14px rgba(37,99,235,.4)' }}>
              Volver a solicitar
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function EstudianteCursosEspeciales() {
  const [cursos, setCursos]       = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [selected, setSelected]   = useState(null);

  const cargar = async () => {
    try {
      const { data } = await api.get('/estudiante/cursos-especiales');
      setCursos(data);
    } catch { /* silent */ } finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const inscribirse = async (id) => {
    setProcesando(id);
    try {
      await api.post(`/estudiante/cursos-especiales/${id}/inscribir`);
      await cargar();
      // Update selected modal data
      setSelected(prev => prev ? { ...prev, inscrito_yo: 1, mi_estado: 'pendiente' } : null);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al inscribirse');
    } finally { setProcesando(null); }
  };

  const cancelar = async (id) => {
    if (!confirm('¿Cancelar tu solicitud de inscripción?')) return;
    setProcesando(id);
    try {
      await api.delete(`/estudiante/cursos-especiales/${id}/inscripcion`);
      await cargar();
      setSelected(prev => prev ? { ...prev, inscrito_yo: 0, mi_estado: null } : null);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cancelar');
    } finally { setProcesando(null); }
  };

  const estadoChip = (c) => {
    if (!parseInt(c.inscrito_yo)) return null;
    const cfg = ESTADO_CONFIG[c.mi_estado];
    if (!cfg) return null;
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'.3rem', padding:'.2rem .6rem',
        borderRadius:'999px', fontSize:'.72rem', fontFamily:'var(--mono)',
        background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.color }}>
        {c.mi_estado === 'aprobado' ? '✓' : c.mi_estado === 'rechazado' ? '✕' : '⏳'} {cfg.label}
      </span>
    );
  };

  return (
    <>
      <PageHeader
        num="03"
        eyebrow="Oferta académica"
        title={<>Cursos <span className="display-italic">especiales</span></>}
        lead="Cursos opcionales habilitados para tu carrera. Solicita tu inscripción y el jefe de carrera la aprobará."
      />

      {cargando && (
        <div style={{ textAlign:'center', padding:'4rem', color:'var(--ink-light)' }}>Cargando cursos...</div>
      )}

      {!cargando && cursos.length === 0 && (
        <div style={{ textAlign:'center', padding:'4rem', border:'1px dashed var(--line-strong)',
          borderRadius:'8px', color:'var(--ink-light)', fontStyle:'italic' }}>
          No hay cursos especiales disponibles en este momento
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem' }}>
        {cursos.map((c, i) => {
          const aprobados = parseInt(c.inscritos) || 0;
          const max       = parseInt(c.max_estudiantes);
          const pct       = Math.min(100, Math.round((aprobados / max) * 100));
          const lleno     = aprobados >= max;

          return (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              style={{
                cursor:'pointer', background:'var(--paper-light)', border:'1px solid var(--line)',
                borderRadius:'12px', padding:'1.5rem', transition:'all .2s',
                display:'flex', flexDirection:'column', gap:'.75rem'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'.5rem' }}>
                <span style={{ fontFamily:'var(--mono)', fontSize:'.65rem', color:'var(--gold-dark)', letterSpacing:'.15em' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {lleno && !parseInt(c.inscrito_yo) && (
                  <span className="chip chip-crimson" style={{ fontSize:'.68rem' }}>Lleno</span>
                )}
              </div>

              <h3 style={{ fontFamily:'var(--serif)', fontSize:'1.1rem', margin:0, lineHeight:1.3 }}>{c.nombre}</h3>

              {c.descripcion && (
                <p style={{
                  fontSize:'.83rem', color:'var(--ink-light)', margin:0, lineHeight:1.5,
                  display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'
                }}>
                  {c.descripcion}
                </p>
              )}

              {c.instructor_nombre && (
                <div style={{ display:'flex', alignItems:'center', gap:'.5rem',
                  fontSize:'.8rem', color:'var(--ink-light)' }}>
                  <span style={{ width:'24px', height:'24px', borderRadius:'50%', background:'var(--paper-dark)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'.72rem', fontWeight:700, fontFamily:'var(--serif)', flexShrink:0 }}>
                    {c.instructor_nombre[0]}
                  </span>
                  {c.instructor_nombre} {c.instructor_apellido || ''}
                </div>
              )}

              {/* Progress bar */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.72rem',
                  fontFamily:'var(--mono)', color:'var(--ink-light)', marginBottom:'.3rem' }}>
                  <span>Cupos</span>
                  <span>{aprobados}/{max}</span>
                </div>
                <div style={{ height:'4px', background:'var(--paper-dark)', borderRadius:'999px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, borderRadius:'999px',
                    background: pct >= 90 ? 'var(--crimson)' : pct >= 60 ? '#d97706' : 'var(--forest)' }}/>
                </div>
              </div>

              {estadoChip(c)}

              <div style={{ fontSize:'.78rem', color:'var(--ink-light)', fontFamily:'var(--mono)',
                textAlign:'right', marginTop:'auto', paddingTop:'.25rem' }}>
                Ver detalles →
              </div>
            </div>
          );
        })}
      </div>

      <CursoModal
        curso={selected}
        onClose={() => setSelected(null)}
        onInscribir={inscribirse}
        onCancelar={cancelar}
        procesando={procesando}
      />
    </>
  );
}
