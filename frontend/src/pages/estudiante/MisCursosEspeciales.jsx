import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const TABS = ['Material', 'Asistencia', 'Notas'];

const ASIST_COLOR = { presente: 'var(--forest)', falta: 'var(--crimson)', permiso: '#d97706' };
const ASIST_ICON  = { presente: '✓', falta: '✕', permiso: '⏳' };

const toDrivePreview = (url) => {
  if (!url) return url;

  // Google Slides → embed en modo presentación solo lectura
  const slidesMatch = url.match(/docs\.google\.com\/presentation\/d\/([^/?#]+)/);
  if (slidesMatch) return `https://docs.google.com/presentation/d/${slidesMatch[1]}/embed?start=false&loop=false&rm=minimal`;

  // Google Docs → preview sin edición
  const docsMatch = url.match(/docs\.google\.com\/document\/d\/([^/?#]+)/);
  if (docsMatch) return `https://docs.google.com/document/d/${docsMatch[1]}/preview`;

  // Google Sheets → preview
  const sheetsMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([^/?#]+)/);
  if (sheetsMatch) return `https://docs.google.com/spreadsheets/d/${sheetsMatch[1]}/preview`;

  // Drive archivo genérico
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;

  // Enlace con ?id=
  const idMatch = url.match(/[?&]id=([^&#]+)/);
  if (idMatch) return `https://drive.google.com/file/d/${idMatch[1]}/preview`;

  return url;
};
const EXT_ICON_ST = { pdf:'📄', doc:'📝', docx:'📝', pptx:'📊', xlsx:'📊', mp4:'🎬', mp3:'🎵', zip:'📦' };

function TabMaterial({ cursoId }) {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [previewItem, setPreview] = useState(null);

  useEffect(() => {
    api.get(`/estudiante/mis-cursos-especiales/${cursoId}/material`)
      .then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [cursoId]);

  if (loading) return <Spinner />;
  if (items.length === 0) return <Empty text="Sin material publicado aún" />;

  return (
    <>
      <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
        {items.map(m => {
          const esDrive = m.tipo_material === 'enlace' || m.url?.includes('drive.google.com');
          return (
            <div key={m.id}
              style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.25rem',
                background:'var(--paper-dark)', borderRadius:'10px',
                border:'1px solid var(--line)',
                borderLeft: esDrive ? '4px solid #1d4ed8' : '4px solid var(--line-strong)' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'10px', flexShrink:0,
                background: esDrive ? '#eff6ff' : 'var(--paper-light)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem',
                border:`1px solid ${esDrive ? '#bfdbfe' : 'var(--line)'}` }}>
                {esDrive ? '🔗' : (EXT_ICON_ST[m.tipo_archivo] || '📁')}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--serif)', fontWeight:600, fontSize:'.95rem',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {m.titulo}
                </div>
                <div style={{ fontFamily:'var(--mono)', fontSize:'.68rem', color:'var(--ink-light)', marginTop:'.2rem' }}>
                  {esDrive ? 'Google Drive · ver en línea' : `.${m.tipo_archivo || 'archivo'}`}
                  {' · '}{new Date(m.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>
              <button onClick={() => setPreview(m)}
                style={{ padding:'.45rem 1rem', borderRadius:'8px', border:'none',
                  background: esDrive ? '#1d4ed8' : 'var(--ink)', color:'#fff',
                  cursor:'pointer', fontFamily:'var(--mono)', fontSize:'.8rem',
                  fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>
                👁 Ver
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal de preview */}
      {previewItem && (
        <div onClick={e => { if (e.target === e.currentTarget) setPreview(null); }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(5px)',
            zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'var(--paper-light)', borderRadius:'16px', width:'100%', maxWidth:'920px',
            maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden',
            boxShadow:'0 32px 100px rgba(0,0,0,.5)' }}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'1rem 1.5rem', borderBottom:'1px solid var(--line)', background:'var(--paper-dark)' }}>
              <div>
                <div style={{ fontFamily:'var(--serif)', fontWeight:700, fontSize:'1rem' }}>{previewItem.titulo}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:'.7rem', color:'var(--ink-light)', marginTop:'.15rem' }}>
                  {previewItem.tipo_material === 'enlace' ? 'Google Drive — solo lectura' : 'Archivo del curso'}
                </div>
              </div>
              <button onClick={() => setPreview(null)}
                style={{ background:'var(--paper-light)', border:'1px solid var(--line)', borderRadius:'8px',
                  padding:'.4rem .85rem', cursor:'pointer', fontFamily:'var(--mono)', fontSize:'.8rem' }}>
                ✕ Cerrar
              </button>
            </div>

            {/* Iframe */}
            <div style={{ flex:1, overflow:'hidden', minHeight:'60vh' }}>
              <iframe
                src={previewItem.tipo_material === 'enlace'
                  ? toDrivePreview(previewItem.url)
                  : `/uploads/${previewItem.archivo_path}`}
                style={{ width:'100%', height:'100%', minHeight:'60vh', border:'none' }}
                title={previewItem.titulo}
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabAsistencia({ cursoId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/estudiante/mis-cursos-especiales/${cursoId}/asistencia`)
      .then(r => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cursoId]);

  if (loading) return <Spinner />;
  if (rows.length === 0) return <Empty text="Sin sesiones de asistencia registradas" />;

  const presentes = rows.filter(r => r.estado === 'presente').length;
  const total     = rows.length;

  return (
    <div>
      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Presentes', count: rows.filter(r=>r.estado==='presente').length, color:'var(--forest)' },
          { label:'Faltas',    count: rows.filter(r=>r.estado==='falta').length,    color:'var(--crimson)' },
          { label:'Permisos',  count: rows.filter(r=>r.estado==='permiso').length,  color:'#d97706' },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center', padding:'1rem', background:'var(--paper-dark)',
            borderRadius:'8px', border:'1px solid var(--line)' }}>
            <div style={{ fontFamily:'var(--serif)', fontSize:'2rem', fontWeight:700, color:s.color }}>{s.count}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:'.72rem', color:'var(--ink-light)', marginTop:'.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Attendance % bar */}
      <div style={{ marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.82rem', marginBottom:'.4rem' }}>
          <span style={{ fontFamily:'var(--mono)', color:'var(--ink-light)' }}>Asistencia acumulada</span>
          <strong>{total > 0 ? Math.round((presentes/total)*100) : 0}%</strong>
        </div>
        <div style={{ height:'8px', background:'var(--paper-dark)', borderRadius:'999px', overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${total>0 ? (presentes/total)*100 : 0}%`,
            background:'var(--forest)', borderRadius:'999px', transition:'width .4s' }}/>
        </div>
      </div>

      {/* List */}
      <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'.75rem 1rem', background:'var(--paper-dark)', borderRadius:'6px', border:'1px solid var(--line)' }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:'.82rem' }}>
              {new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
            </span>
            <span style={{ fontFamily:'var(--mono)', fontSize:'.78rem', fontWeight:700,
              color:ASIST_COLOR[r.estado] }}>
              {ASIST_ICON[r.estado]} {r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabNotas({ cursoId }) {
  const [nota, setNota]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/estudiante/mis-cursos-especiales/${cursoId}/notas`)
      .then(r => setNota(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cursoId]);

  if (loading) return <Spinner />;
  if (nota?.nota == null) return <Empty text="Aún no tienes calificación registrada" />;

  const n   = parseFloat(nota.nota);
  const pct = Math.min(100, (n / 100) * 100);
  const color = n >= 60 ? 'var(--forest)' : n >= 40 ? '#d97706' : 'var(--crimson)';

  return (
    <div>
      <div style={{ textAlign:'center', padding:'2.5rem 1rem', background:'var(--paper-dark)',
        borderRadius:'12px', border:'1px solid var(--line)', marginBottom:'1.25rem' }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:'.68rem', letterSpacing:'.15em',
          textTransform:'uppercase', color:'var(--ink-light)', marginBottom:'.75rem' }}>
          Calificación final
        </div>
        <div style={{ fontFamily:'var(--serif)', fontSize:'4.5rem', fontWeight:900, color, lineHeight:1 }}>
          {n.toFixed(1)}
        </div>
        <div style={{ fontFamily:'var(--mono)', fontSize:'.75rem', color:'var(--ink-light)', marginTop:'.4rem' }}>
          / 100 puntos
        </div>
        <div style={{ marginTop:'1.25rem', height:'10px', background:'var(--paper-light)',
          borderRadius:'999px', overflow:'hidden', maxWidth:'200px', margin:'1.25rem auto 0' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:'999px' }}/>
        </div>
      </div>
      {nota.descripcion && (
        <div style={{ padding:'1rem 1.25rem', background:'var(--paper-dark)',
          borderRadius:'8px', border:'1px solid var(--line)', fontSize:'.88rem', lineHeight:1.6 }}>
          <strong>Observaciones:</strong> {nota.descripcion}
        </div>
      )}
    </div>
  );
}

const Spinner = () => (
  <div style={{ textAlign:'center', padding:'2.5rem', color:'var(--ink-light)' }}>Cargando...</div>
);
const Empty = ({ text }) => (
  <div style={{ textAlign:'center', padding:'2.5rem', border:'1px dashed var(--line-strong)',
    borderRadius:'8px', color:'var(--ink-light)', fontStyle:'italic' }}>{text}</div>
);

export default function MisCursosEspeciales() {
  const [cursos, setCursos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [activoCurso, setActivoCurso] = useState(null);
  const [activeTab, setActiveTab]     = useState(0);

  useEffect(() => {
    api.get('/estudiante/mis-cursos-especiales')
      .then(r => { setCursos(r.data); if (r.data.length > 0) setActivoCurso(r.data[0].id); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const curso = cursos.find(c => c.id === activoCurso);

  return (
    <>
      <PageHeader
        num="09"
        eyebrow="Mis estudios"
        title={<>Mis cursos <span className="display-italic">especiales</span></>}
        lead="Aquí encontrarás los cursos en los que estás inscrito y aprobado."
      />

      {loading && <div style={{ textAlign:'center', padding:'4rem', color:'var(--ink-light)' }}>Cargando...</div>}

      {!loading && cursos.length === 0 && (
        <div style={{ textAlign:'center', padding:'4rem', border:'1px dashed var(--line-strong)',
          borderRadius:'8px', color:'var(--ink-light)', fontStyle:'italic' }}>
          No tienes cursos especiales aprobados aún. Solicita inscripción en «Cursos especiales».
        </div>
      )}

      {cursos.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'1.5rem', alignItems:'start' }}>
          {/* Sidebar: lista de cursos */}
          <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:'.68rem', letterSpacing:'.15em',
              textTransform:'uppercase', color:'var(--ink-light)', marginBottom:'.25rem', paddingLeft:'.25rem' }}>
              Mis cursos
            </div>
            {cursos.map((c, i) => (
              <button
                key={c.id}
                onClick={() => { setActivoCurso(c.id); setActiveTab(0); }}
                style={{
                  textAlign:'left', padding:'1rem', borderRadius:'8px', border:'1px solid',
                  borderColor: activoCurso === c.id ? 'var(--ink)' : 'var(--line)',
                  background: activoCurso === c.id ? 'var(--ink)' : 'var(--paper-light)',
                  color: activoCurso === c.id ? '#fff' : 'inherit',
                  cursor:'pointer', transition:'all .15s'
                }}
              >
                <div style={{ fontFamily:'var(--mono)', fontSize:'.65rem', letterSpacing:'.12em',
                  color: activoCurso === c.id ? 'rgba(255,255,255,.5)' : 'var(--gold-dark)',
                  marginBottom:'.3rem' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ fontFamily:'var(--serif)', fontSize:'.95rem', fontWeight:600, lineHeight:1.3 }}>
                  {c.nombre}
                </div>
                {c.instructor_nombre && (
                  <div style={{ fontSize:'.75rem', marginTop:'.3rem',
                    color: activoCurso === c.id ? 'rgba(255,255,255,.6)' : 'var(--ink-light)' }}>
                    {c.instructor_nombre} {c.instructor_apellido || ''}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Main panel */}
          <div>
            {curso && (
              <>
                <div style={{ marginBottom:'1.25rem' }}>
                  <h2 style={{ fontFamily:'var(--serif)', fontSize:'1.5rem', margin:'0 0 .25rem' }}>{curso.nombre}</h2>
                  {curso.descripcion && (
                    <p style={{ fontSize:'.88rem', color:'var(--ink-light)', margin:0 }}>{curso.descripcion}</p>
                  )}
                </div>

                {/* Tabs */}
                <div style={{ display:'flex', borderBottom:'2px solid var(--line)', marginBottom:'1.5rem', gap:'0' }}>
                  {TABS.map((tab, idx) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(idx)}
                      style={{
                        padding:'.65rem 1.25rem', background:'none', border:'none', cursor:'pointer',
                        fontFamily:'var(--mono)', fontSize:'.8rem', letterSpacing:'.08em',
                        color: activeTab === idx ? 'var(--ink)' : 'var(--ink-light)',
                        borderBottom: activeTab === idx ? '2px solid var(--ink)' : '2px solid transparent',
                        marginBottom:'-2px', transition:'color .15s'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === 0 && <TabMaterial   cursoId={curso.id} key={`mat-${curso.id}`}  />}
                {activeTab === 1 && <TabAsistencia cursoId={curso.id} key={`asi-${curso.id}`}  />}
                {activeTab === 2 && <TabNotas      cursoId={curso.id} key={`not-${curso.id}`}  />}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
