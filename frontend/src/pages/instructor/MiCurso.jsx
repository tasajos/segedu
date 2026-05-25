import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import mammoth from 'mammoth';

// ── Constantes de asistencia (misma lógica que asistencia regular) ─────────────
const ASIST_ESTADOS = ['presente', 'falta', 'permiso'];
const ASIST_COLOR  = { presente: '#16a34a', falta: '#dc2626', permiso: '#d97706' };
const ASIST_BG     = { presente: '#f0fdf4', falta: '#fef2f2', permiso: '#fffbeb' };
const ASIST_BORDER = { presente: '#bbf7d0', falta: '#fecaca', permiso: '#fde68a' };
const ASIST_LABEL  = { presente: 'Presente', falta: 'Falta',    permiso: 'Permiso'  };

const TABS = ['Participantes', 'Asistencia', 'Material', 'Notas', 'Tareas'];

const getTodayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const Spinner = () => <div style={{ textAlign:'center', padding:'2.5rem', color:'var(--ink-light)' }}>Cargando...</div>;
const Empty   = ({ text }) => (
  <div style={{ textAlign:'center', padding:'2.5rem', border:'1px dashed var(--line-strong)',
    borderRadius:'8px', color:'var(--ink-light)', fontStyle:'italic' }}>{text}</div>
);

// ── TAB Participantes ─────────────────────────────────────────────────────────
function TabParticipantes({ cursoId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/instructor/cursos/${cursoId}/participantes`)
      .then(r => setRows(r.data)).finally(() => setLoading(false));
  }, [cursoId]);

  if (loading) return <Spinner />;
  if (!rows.length) return <Empty text="Sin participantes aprobados aún" />;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
      {rows.map((e, i) => (
        <div key={e.estudiante_id} style={{ display:'grid', gridTemplateColumns:'32px 1fr auto',
          gap:'1rem', alignItems:'center', padding:'1rem 1.25rem',
          background:'var(--paper-dark)', borderRadius:'10px', border:'1px solid var(--line)' }}>
          <span style={{ fontFamily:'var(--mono)', fontSize:'.75rem', color:'var(--ink-light)' }}>
            {String(i+1).padStart(2,'0')}
          </span>
          <div>
            <div style={{ fontFamily:'var(--serif)', fontSize:'.95rem', fontWeight:600 }}>
              {e.nombre} {e.apellido}
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:'.72rem', color:'var(--ink-light)', marginTop:'.15rem' }}>
              {e.codigo_estudiante} · Sem. {e.semestre} · {e.email}
            </div>
          </div>
          <span className="chip chip-forest" style={{ fontSize:'.7rem' }}>Aprobado</span>
        </div>
      ))}
    </div>
  );
}

// ── TAB Asistencia ────────────────────────────────────────────────────────────
function TabAsistencia({ cursoId }) {
  const [fecha, setFecha]         = useState(getTodayLocal());
  const [estudiantes, setEst]     = useState([]);
  const [estados, setEstados]     = useState({});
  const [fechas, setFechas]       = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado]   = useState(false);
  const [loading, setLoading]     = useState(true);

  const cargarFechas = () =>
    api.get(`/instructor/cursos/${cursoId}/asistencia/fechas`).then(r => setFechas(r.data));

  const cargarAsistencia = async (f) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/instructor/cursos/${cursoId}/asistencia`, { params: { fecha: f } });
      setEst(data);
      const map = {};
      data.forEach(e => { map[e.estudiante_id] = e.estado || 'presente'; });
      setEstados(map);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargarFechas(); cargarAsistencia(fecha); }, [cursoId]);

  const cambiarFecha = (f) => { setFecha(f); cargarAsistencia(f); };
  const marcarTodos  = (est) => {
    const next = {};
    estudiantes.forEach(e => { next[e.estudiante_id] = est; });
    setEstados(next);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const registros = Object.entries(estados).map(([id, estado]) => ({ estudiante_id: parseInt(id), estado }));
      await api.post(`/instructor/cursos/${cursoId}/asistencia`, { fecha, registros });
      await cargarFechas();
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setGuardando(false); }
  };

  const presentes = Object.values(estados).filter(v => v === 'presente').length;
  const faltas    = Object.values(estados).filter(v => v === 'falta').length;
  const permisos  = Object.values(estados).filter(v => v === 'permiso').length;

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns: fechas.length > 0 ? '1fr 1fr' : '1fr', gap:'1rem', marginBottom:'1.5rem' }}>
        <div>
          <label className="form-label">Fecha de sesión</label>
          <input type="date" className="form-input" value={fecha} onChange={e => cambiarFecha(e.target.value)} />
        </div>
        {fechas.length > 0 && (
          <div>
            <label className="form-label">Sesiones anteriores</label>
            <select className="form-input" value={fecha} onChange={e => cambiarFecha(e.target.value)}>
              {fechas.map(f => (
                <option key={f} value={f}>
                  {new Date(f+'T00:00:00').toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'long',year:'numeric'})}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? <Spinner /> : estudiantes.length === 0 ? <Empty text="Sin participantes aprobados" /> : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.75rem', marginBottom:'1.5rem' }}>
            {ASIST_ESTADOS.map(est => {
              const count = Object.values(estados).filter(v => v === est).length;
              return (
                <div key={est} onClick={() => marcarTodos(est)}
                  style={{ padding:'1rem 1.1rem', background:ASIST_BG[est], borderRadius:'12px',
                    border:`1px solid ${ASIST_BORDER[est]}`, cursor:'pointer',
                    boxShadow:'0 1px 4px rgba(0,0,0,.06)', transition:'transform .15s, box-shadow .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'; }}>
                  <div style={{ fontFamily:'var(--serif)', fontSize:'2.2rem', lineHeight:1, color:ASIST_COLOR[est], fontWeight:700 }}>{count}</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:'.68rem', color:ASIST_COLOR[est], textTransform:'uppercase', letterSpacing:'.1em', marginTop:'.35rem', fontWeight:700 }}>{ASIST_LABEL[est]}</div>
                  <div style={{ fontSize:'.72rem', color:'#64748b', marginTop:'.3rem' }}>clic para marcar todos</div>
                </div>
              );
            })}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'.6rem', flexWrap:'wrap', marginBottom:'1.25rem' }}>
            <span style={{ fontSize:'.82rem', color:'var(--ink-light)', fontFamily:'var(--mono)' }}>Marcar todos:</span>
            {ASIST_ESTADOS.map(est => (
              <button key={est} onClick={() => marcarTodos(est)}
                style={{ padding:'.45rem .95rem', borderRadius:'999px',
                  border:`1px solid ${ASIST_BORDER[est]}`, background:ASIST_BG[est],
                  color:ASIST_COLOR[est], fontWeight:700, fontSize:'.8rem', cursor:'pointer' }}>
                {ASIST_LABEL[est]}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'.5rem', marginBottom:'1.5rem' }}>
            {estudiantes.map((e, i) => {
              const estadoActual = estados[e.estudiante_id] || 'presente';
              return (
                <div key={e.estudiante_id}
                  style={{ padding:'1rem 1.1rem', background:ASIST_BG[estadoActual], borderRadius:'12px',
                    border:`1px solid ${ASIST_BORDER[estadoActual]}`,
                    borderLeft:`4px solid ${ASIST_COLOR[estadoActual]}`, transition:'all .2s',
                    boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'32px 1fr auto', gap:'1rem', alignItems:'center' }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:'.75rem', color:'#94a3b8' }}>
                      {String(i+1).padStart(2,'0')}
                    </span>
                    <div>
                      <div style={{ fontFamily:'var(--serif)', fontSize:'.95rem', fontWeight:600 }}>{e.nombre} {e.apellido}</div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:'.72rem', color:'#64748b' }}>{e.codigo_estudiante}</div>
                    </div>
                    <div style={{ display:'flex', gap:'.35rem', flexWrap:'wrap', justifyContent:'flex-end' }}>
                      {ASIST_ESTADOS.map(est => {
                        const activo = estadoActual === est;
                        return (
                          <button key={est}
                            onClick={() => setEstados(s => ({...s, [e.estudiante_id]: est}))}
                            style={{ padding:'.45rem .85rem', border:'1px solid',
                              borderColor: activo ? ASIST_COLOR[est] : ASIST_BORDER[est],
                              background:  activo ? ASIST_COLOR[est] : '#fff',
                              color:       activo ? '#fff' : ASIST_COLOR[est],
                              borderRadius:'999px', cursor:'pointer', fontFamily:'var(--sans)',
                              fontSize:'.78rem', fontWeight:700, transition:'all .15s', minWidth:'84px',
                              boxShadow: activo ? `0 2px 8px ${ASIST_COLOR[est]}44` : 'none' }}>
                            {ASIST_LABEL[est]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'1rem 1.25rem', background:'var(--ink)', color:'var(--paper)',
            borderRadius:'10px', gap:'1rem', flexWrap:'wrap' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:'.8rem', color:'rgba(255,255,255,.75)' }}>
              {new Date(fecha+'T00:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
              {' · '}{presentes} presentes · {faltas} faltas · {permisos} permisos
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
              {guardado && <span style={{ color:'#4ade80', fontFamily:'var(--mono)', fontSize:'.8rem' }}>✓ Lista guardada</span>}
              <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Registrar asistencia'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Utilidades Drive ─────────────────────────────────────────────────────────
const toDrivePreview = (url) => {
  if (!url) return url;

  // Google Slides → embed en modo presentación (sin edición)
  const slidesMatch = url.match(/docs\.google\.com\/presentation\/d\/([^/?#]+)/);
  if (slidesMatch) return `https://docs.google.com/presentation/d/${slidesMatch[1]}/embed?start=false&loop=false&rm=minimal`;

  // Google Docs → preview sin edición
  const docsMatch = url.match(/docs\.google\.com\/document\/d\/([^/?#]+)/);
  if (docsMatch) return `https://docs.google.com/document/d/${docsMatch[1]}/preview`;

  // Google Sheets → preview
  const sheetsMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([^/?#]+)/);
  if (sheetsMatch) return `https://docs.google.com/spreadsheets/d/${sheetsMatch[1]}/preview`;

  // Google Drive archivo genérico (file/d/ID/...)
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;

  // Enlace de compartir con ?id=
  const idMatch = url.match(/[?&]id=([^&#]+)/);
  if (idMatch) return `https://drive.google.com/file/d/${idMatch[1]}/preview`;

  return url;
};
const isDriveUrl = (url) => url && url.includes('drive.google.com');
const EXT_ICON = { pdf:'📄', doc:'📝', docx:'📝', pptx:'📊', xlsx:'📊', mp4:'🎬', mp3:'🎵', zip:'📦' };

// ── TAB Material ──────────────────────────────────────────────────────────────
function TabMaterial({ cursoId }) {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modo, setModo]           = useState('archivo'); // 'archivo' | 'enlace'
  const [subiendo, setSubiendo]   = useState(false);
  const [titulo, setTitulo]       = useState('');
  const [url, setUrl]             = useState('');
  const [previewItem, setPreview] = useState(null);
  const fileRef                   = useRef(null);

  const cargar = () => api.get(`/instructor/cursos/${cursoId}/material`)
    .then(r => setItems(r.data)).finally(() => setLoading(false));

  useEffect(() => { cargar(); }, [cursoId]);

  const subir = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return alert('Selecciona un archivo');
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append('archivo', file);
      fd.append('titulo', titulo.trim() || file.name);
      await api.post(`/instructor/cursos/${cursoId}/material`, fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      setTitulo(''); fileRef.current.value = '';
      cargar();
    } catch (err) { alert(err.response?.data?.error || 'Error al subir archivo'); }
    finally { setSubiendo(false); }
  };

  const agregarEnlace = async () => {
    if (!titulo.trim()) return alert('Ingresa un título');
    if (!url.trim())    return alert('Ingresa la URL de Google Drive');
    setSubiendo(true);
    try {
      await api.post(`/instructor/cursos/${cursoId}/material/enlace`, { titulo: titulo.trim(), url: url.trim() });
      setTitulo(''); setUrl('');
      cargar();
    } catch (err) { alert(err.response?.data?.error || 'Error al agregar enlace'); }
    finally { setSubiendo(false); }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este material?')) return;
    try { await api.delete(`/instructor/cursos/${cursoId}/material/${id}`); cargar(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      {/* ── Panel de carga ── */}
      <div style={{ background:'var(--paper-light)', borderRadius:'14px',
        border:'1px solid var(--line)', marginBottom:'1.75rem', overflow:'hidden' }}>

        {/* Selector de modo */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--line)' }}>
          {[
            { key:'archivo', icon:'📎', label:'Subir archivo' },
            { key:'enlace',  icon:'🔗', label:'Enlace de Google Drive' },
          ].map(m => (
            <button key={m.key} onClick={() => setModo(m.key)}
              style={{ flex:1, padding:'.9rem 1rem', border:'none', cursor:'pointer',
                fontFamily:'var(--mono)', fontSize:'.8rem', fontWeight:600, letterSpacing:'.06em',
                background: modo === m.key ? 'var(--ink)' : 'transparent',
                color: modo === m.key ? '#fff' : 'var(--ink-light)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem',
                transition:'all .15s' }}>
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>

        <div style={{ padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
          {modo === 'archivo' ? (
            <>
              <div>
                <label className="form-label">Título del archivo</label>
                <input className="form-input" placeholder="Nombre descriptivo (se usa el nombre del archivo si está vacío)"
                  value={titulo} onChange={e => setTitulo(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Archivo — PDF, PPTX, video, ZIP… hasta 50MB</label>
                <div style={{ marginTop:'.4rem', padding:'.85rem 1rem',
                  background:'var(--paper-dark)', borderRadius:'8px', border:'2px dashed var(--line-strong)',
                  display:'flex', alignItems:'center', gap:'1rem' }}>
                  <span style={{ fontSize:'1.4rem' }}>📎</span>
                  <input type="file" ref={fileRef}
                    style={{ flex:1, fontFamily:'var(--mono)', fontSize:'.82rem' }} />
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button onClick={subir} disabled={subiendo}
                  style={{ padding:'.55rem 1.4rem', borderRadius:'8px', border:'none',
                    background:'var(--ink)', color:'#fff', cursor: subiendo ? 'not-allowed' : 'pointer',
                    fontFamily:'var(--mono)', fontSize:'.82rem', fontWeight:700, opacity: subiendo ? .7 : 1 }}>
                  {subiendo ? 'Subiendo...' : '↑ Subir archivo'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ padding:'.75rem 1rem', background:'#eff6ff', border:'1px solid #bfdbfe',
                borderRadius:'8px', fontSize:'.83rem', color:'#1e40af', lineHeight:1.6 }}>
                Comparte el archivo en Google Drive como <strong>"Cualquiera con el enlace puede ver"</strong> y pega la URL aquí.
                Los estudiantes podrán verlo en modo preview sin opción de descarga directa.
              </div>
              <div>
                <label className="form-label">Título del material</label>
                <input className="form-input" placeholder="Ej: Semana 1 — Introducción a QA"
                  value={titulo} onChange={e => setTitulo(e.target.value)} />
              </div>
              <div>
                <label className="form-label">URL de Google Drive</label>
                <input className="form-input" placeholder="https://drive.google.com/file/d/..."
                  value={url} onChange={e => setUrl(e.target.value)} />
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button onClick={agregarEnlace} disabled={subiendo}
                  style={{ padding:'.55rem 1.4rem', borderRadius:'8px', border:'none',
                    background:'#1d4ed8', color:'#fff', cursor: subiendo ? 'not-allowed' : 'pointer',
                    fontFamily:'var(--mono)', fontSize:'.82rem', fontWeight:700, opacity: subiendo ? .7 : 1 }}>
                  {subiendo ? 'Guardando...' : '+ Agregar enlace'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Lista de material ── */}
      {!items.length && <Empty text="Sin material publicado aún" />}
      <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
        {items.map(m => {
          const esDrive = m.tipo_material === 'enlace' || isDriveUrl(m.url);
          return (
            <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'1rem',
              padding:'1rem 1.25rem', background:'var(--paper-dark)',
              borderRadius:'10px', border:'1px solid var(--line)',
              borderLeft: esDrive ? '4px solid #1d4ed8' : '4px solid var(--line-strong)' }}>
              <div style={{ width:'42px', height:'42px', borderRadius:'10px', flexShrink:0,
                background: esDrive ? '#eff6ff' : 'var(--paper-light)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem',
                border:`1px solid ${esDrive ? '#bfdbfe' : 'var(--line)'}` }}>
                {esDrive ? '🔗' : (EXT_ICON[m.tipo_archivo] || '📁')}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--serif)', fontWeight:600, fontSize:'.95rem',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {m.titulo}
                </div>
                <div style={{ fontFamily:'var(--mono)', fontSize:'.68rem', color:'var(--ink-light)', marginTop:'.2rem' }}>
                  {esDrive ? 'Google Drive' : `.${m.tipo_archivo || 'archivo'}`}
                  {' · '}{new Date(m.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>
              <button onClick={() => setPreview(m)}
                style={{ padding:'.4rem .9rem', borderRadius:'6px', border:'1px solid var(--line)',
                  background:'var(--paper-light)', cursor:'pointer', fontFamily:'var(--mono)',
                  fontSize:'.78rem', color:'var(--ink)', whiteSpace:'nowrap' }}>
                👁 Ver
              </button>
              <button onClick={() => eliminar(m.id)}
                style={{ padding:'.4rem .7rem', borderRadius:'6px', border:'1px solid #fecaca',
                  background:'#fef2f2', cursor:'pointer', color:'#dc2626', fontSize:'.82rem', flexShrink:0 }}>
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Modal de preview ── */}
      {previewItem && (
        <div onClick={e => { if (e.target === e.currentTarget) setPreview(null); }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', backdropFilter:'blur(4px)',
            zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'var(--paper-light)', borderRadius:'14px', width:'100%', maxWidth:'900px',
            maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden',
            boxShadow:'0 24px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'1rem 1.5rem', borderBottom:'1px solid var(--line)' }}>
              <div style={{ fontFamily:'var(--serif)', fontWeight:600, fontSize:'1rem' }}>{previewItem.titulo}</div>
              <div style={{ display:'flex', gap:'.5rem' }}>
                {previewItem.tipo_material !== 'enlace' && (
                  <a href={`/uploads/${previewItem.archivo_path}`} target="_blank" rel="noreferrer"
                    className="btn btn-secondary btn-sm">↓ Descargar</a>
                )}
                <button onClick={() => setPreview(null)} className="btn btn-secondary btn-sm">✕ Cerrar</button>
              </div>
            </div>
            <div style={{ flex:1, overflow:'hidden' }}>
              <iframe
                src={previewItem.tipo_material === 'enlace'
                  ? toDrivePreview(previewItem.url)
                  : `/uploads/${previewItem.archivo_path}`}
                style={{ width:'100%', height:'100%', minHeight:'65vh', border:'none' }}
                title={previewItem.titulo}
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB Notas ─────────────────────────────────────────────────────────────────
function TabNotas({ cursoId }) {
  const [rows, setRows]           = useState([]);
  const [notas, setNotas]         = useState({});
  const [descrip, setDescrip]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado]   = useState(false);

  useEffect(() => {
    api.get(`/instructor/cursos/${cursoId}/notas`)
      .then(r => {
        setRows(r.data);
        const nm = {}, dm = {};
        r.data.forEach(s => {
          nm[s.estudiante_id] = s.nota != null ? String(s.nota) : '';
          dm[s.estudiante_id] = s.descripcion || '';
        });
        setNotas(nm); setDescrip(dm);
      }).finally(() => setLoading(false));
  }, [cursoId]);

  const guardar = async () => {
    setGuardando(true);
    try {
      const arr = rows.map(s => ({
        estudiante_id: s.estudiante_id,
        nota:          notas[s.estudiante_id] !== '' ? parseFloat(notas[s.estudiante_id]) : null,
        descripcion:   descrip[s.estudiante_id] || null,
      }));
      await api.post(`/instructor/cursos/${cursoId}/notas`, { notas: arr });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setGuardando(false); }
  };

  if (loading) return <Spinner />;
  if (!rows.length) return <Empty text="Sin participantes aprobados para calificar" />;

  return (
    <div>
      <div style={{ display:'flex', flexDirection:'column', gap:'.75rem', marginBottom:'1.25rem' }}>
        {rows.map(s => (
          <div key={s.estudiante_id} style={{ padding:'1rem 1.25rem', background:'var(--paper-dark)',
            borderRadius:'10px', border:'1px solid var(--line)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', marginBottom:'.6rem' }}>
              <div>
                <div style={{ fontWeight:600, fontFamily:'var(--serif)', fontSize:'.95rem' }}>{s.nombre} {s.apellido}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:'.72rem', color:'var(--ink-light)' }}>{s.codigo_estudiante}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                <label style={{ fontFamily:'var(--mono)', fontSize:'.75rem', color:'var(--ink-light)' }}>Nota:</label>
                <input type="number" min={0} max={100} step={0.1}
                  value={notas[s.estudiante_id] ?? ''} placeholder="0-100"
                  onChange={e => setNotas(n => ({...n, [s.estudiante_id]: e.target.value}))}
                  style={{ width:'80px', padding:'.4rem .6rem', borderRadius:'6px',
                    border:'1px solid var(--line)', fontFamily:'var(--mono)', fontSize:'.88rem',
                    background:'var(--paper-light)', textAlign:'center' }} />
              </div>
            </div>
            <input className="form-input" placeholder="Observaciones (opcional)"
              value={descrip[s.estudiante_id] || ''}
              onChange={e => setDescrip(d => ({...d, [s.estudiante_id]: e.target.value}))} />
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', gap:'1rem' }}>
        {guardado && <span style={{ fontFamily:'var(--mono)', fontSize:'.82rem', color:'var(--forest)' }}>✓ Notas guardadas</span>}
        <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar notas'}
        </button>
      </div>
    </div>
  );
}

// ── Visor de archivo (PDF / Word) ─────────────────────────────────────────────
function VisorArchivo({ url, nombre, tipo, onClose }) {
  const [html, setHtml]     = useState('');
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!url) return;
    setLoad(true); setError(''); setHtml('');
    if (tipo === 'pdf') {
      setLoad(false);
    } else {
      fetch(url)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(buf => mammoth.convertToHtml({ arrayBuffer: buf }))
        .then(r => { setHtml(r.value); setLoad(false); })
        .catch(() => { setError('No se pudo cargar el documento.'); setLoad(false); });
    }
  }, [url, tipo]);

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)',
        zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'var(--paper-light)', borderRadius:'14px', width:'100%', maxWidth:'900px',
        maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden',
        boxShadow:'0 24px 80px rgba(0,0,0,.4)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'1rem 1.5rem', borderBottom:'1px solid var(--line)' }}>
          <div style={{ fontFamily:'var(--serif)', fontWeight:600 }}>{nombre}</div>
          <button onClick={onClose} className="btn btn-secondary btn-sm">✕ Cerrar</button>
        </div>
        <div style={{ flex:1, overflow:'auto', position:'relative' }}>
          {loading && <Spinner />}
          {error && <div style={{ padding:'2rem', color:'var(--crimson)', textAlign:'center' }}>{error}</div>}
          {!loading && !error && tipo === 'pdf' && (
            <div style={{ position:'relative', height:'100%', minHeight:'65vh' }}>
              <div style={{ position:'absolute', inset:0, zIndex:2, userSelect:'none' }}
                onContextMenu={e => e.preventDefault()} />
              <iframe src={url} style={{ width:'100%', height:'100%', minHeight:'65vh', border:'none' }}
                title={nombre} />
            </div>
          )}
          {!loading && !error && tipo !== 'pdf' && html && (
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', inset:0, zIndex:2, userSelect:'none' }}
                onContextMenu={e => e.preventDefault()} />
              <div style={{ padding:'2rem', fontFamily:'Georgia,serif', fontSize:'1rem',
                lineHeight:1.7, maxWidth:'780px', margin:'0 auto' }}
                dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TAB Tareas ────────────────────────────────────────────────────────────────
function TabTareas({ cursoId }) {
  const [tareas, setTareas]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState({ titulo:'', descripcion:'', fecha_entrega:'' });
  const [archivo, setArchivo]         = useState(null);
  const [guardando, setGuardando]     = useState(false);
  const [formError, setFormError]     = useState('');
  const [visor, setVisor]             = useState(null);   // { url, nombre, tipo }
  const [entregasModal, setEntregasModal] = useState(null); // tarea
  const [entregas, setEntregas]       = useState([]);
  const [loadingEntr, setLoadingEntr] = useState(false);
  const [calificando, setCalificando] = useState(null);  // entrega
  const [calForm, setCalForm]         = useState({ calificacion:'', comentario:'' });
  const [savingCal, setSavingCal]     = useState(false);
  const [visorEntrega, setVisorEntrega] = useState(null);
  const fileRef = useRef(null);

  const cargar = () => {
    setLoading(true);
    api.get(`/instructor/cursos/${cursoId}/tareas`)
      .then(r => setTareas(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [cursoId]);

  const crearTarea = async () => {
    if (!form.titulo.trim()) { setFormError('El título es obligatorio'); return; }
    setGuardando(true); setFormError('');
    try {
      const fd = new FormData();
      fd.append('titulo', form.titulo.trim());
      fd.append('descripcion', form.descripcion);
      fd.append('fecha_entrega', form.fecha_entrega);
      if (archivo) fd.append('archivo', archivo);
      await api.post(`/instructor/cursos/${cursoId}/tareas`, fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      setForm({ titulo:'', descripcion:'', fecha_entrega:'' });
      setArchivo(null);
      if (fileRef.current) fileRef.current.value = '';
      setShowForm(false);
      cargar();
    } catch (err) { setFormError(err.response?.data?.error || 'Error al crear tarea'); }
    finally { setGuardando(false); }
  };

  const eliminarTarea = async (id) => {
    if (!confirm('¿Eliminar esta tarea y todas sus entregas?')) return;
    try { await api.delete(`/instructor/cursos/${cursoId}/tareas/${id}`); cargar(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const abrirEntregas = async (tarea) => {
    setEntregasModal(tarea);
    setLoadingEntr(true);
    try {
      const { data } = await api.get(`/instructor/cursos/${cursoId}/tareas/${tarea.id}/entregas`);
      setEntregas(data);
    } catch { setEntregas([]); }
    finally { setLoadingEntr(false); }
    cargar(); // actualiza badge
  };

  const guardarCalificacion = async () => {
    if (calForm.calificacion === '') { alert('Ingresa una calificación'); return; }
    setSavingCal(true);
    try {
      await api.put(`/instructor/entregas-especiales/${calificando.id}/calificar`, {
        calificacion: parseFloat(calForm.calificacion),
        comentario_calificacion: calForm.comentario,
      });
      const { data } = await api.get(`/instructor/cursos/${cursoId}/tareas/${entregasModal.id}/entregas`);
      setEntregas(data);
      setCalificando(null);
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setSavingCal(false); }
  };

  const getApiUrl = (path) => {
    const base = api.defaults.baseURL || '';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return `${base}${path}?token=${token}`;
  };

  const abrirVisorTarea = (tarea) => {
    const url = getApiUrl(`/instructor/cursos/${cursoId}/tareas/${tarea.id}/ver`);
    setVisor({ url, nombre: tarea.archivo_nombre, tipo: tarea.tipo_archivo });
  };

  const abrirVisorEntrega = (entrega) => {
    const url = getApiUrl(`/instructor/entregas-especiales/${entrega.id}/ver`);
    const ext = entrega.archivo_nombre?.split('.').pop()?.toLowerCase();
    setVisorEntrega({ url, nombre: entrega.archivo_nombre, tipo: ext === 'pdf' ? 'pdf' : 'word' });
  };

  const diasRestantes = (fecha) => {
    if (!fecha) return null;
    const diff = Math.ceil((new Date(fecha) - new Date()) / 86400000);
    return diff;
  };

  if (loading) return <Spinner />;

  return (
    <div>
      {/* ── Botón nueva tarea ── */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1.25rem' }}>
        <button onClick={() => { setShowForm(s => !s); setFormError(''); }}
          style={{ padding:'.55rem 1.25rem', borderRadius:'8px', border:'none',
            background:'var(--ink)', color:'#fff', cursor:'pointer',
            fontFamily:'var(--mono)', fontSize:'.82rem', fontWeight:700 }}>
          {showForm ? '✕ Cancelar' : '+ Nueva tarea'}
        </button>
      </div>

      {/* ── Formulario ── */}
      {showForm && (
        <div style={{ background:'var(--paper-dark)', borderRadius:'12px',
          border:'1px solid var(--line)', padding:'1.25rem 1.5rem', marginBottom:'1.5rem' }}>
          <h3 style={{ fontFamily:'var(--serif)', fontSize:'1rem', margin:'0 0 1rem' }}>Nueva tarea</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'.85rem' }}>
            <div>
              <label className="form-label">Título *</label>
              <input className="form-input" value={form.titulo}
                onChange={e => setForm(f => ({...f, titulo: e.target.value}))}
                placeholder="Ej: Entrega parcial — semana 3" />
            </div>
            <div>
              <label className="form-label">Descripción / instrucciones</label>
              <textarea className="form-input" rows={3} style={{ resize:'vertical' }}
                value={form.descripcion}
                onChange={e => setForm(f => ({...f, descripcion: e.target.value}))}
                placeholder="Descripción detallada de la tarea..." />
            </div>
            <div>
              <label className="form-label">Fecha límite de entrega</label>
              <input className="form-input" type="datetime-local" value={form.fecha_entrega}
                onChange={e => setForm(f => ({...f, fecha_entrega: e.target.value}))} />
            </div>
            <div>
              <label className="form-label">Material adjunto — PDF o Word (opcional, máx. 30 MB)</label>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'.75rem 1rem',
                background:'var(--paper-light)', borderRadius:'8px', border:'2px dashed var(--line-strong)', marginTop:'.35rem' }}>
                <span style={{ fontSize:'1.3rem' }}>📎</span>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx"
                  onChange={e => setArchivo(e.target.files[0] || null)}
                  style={{ flex:1, fontFamily:'var(--mono)', fontSize:'.82rem' }} />
              </div>
              {archivo && (
                <div style={{ marginTop:'.4rem', fontFamily:'var(--mono)', fontSize:'.75rem', color:'var(--ink-light)' }}>
                  {archivo.name.toLowerCase().endsWith('.pdf') ? '📄' : '📝'} {archivo.name}
                  {' '}({(archivo.size/1024/1024).toFixed(1)} MB)
                </div>
              )}
            </div>
            {formError && (
              <div style={{ padding:'.65rem 1rem', background:'#fef2f2', border:'1px solid #fecaca',
                borderRadius:'6px', color:'#b91c1c', fontSize:'.85rem' }}>{formError}</div>
            )}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'.75rem' }}>
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={crearTarea} disabled={guardando} className="btn btn-primary">
                {guardando ? 'Creando...' : 'Crear tarea'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lista de tareas ── */}
      {!tareas.length && !showForm && <Empty text="Sin tareas creadas aún" />}
      <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
        {tareas.map((t, i) => {
          const dias = diasRestantes(t.fecha_entrega);
          const vencida = dias !== null && dias < 0;
          const urgente = dias !== null && dias >= 0 && dias <= 3;
          return (
            <div key={t.id} style={{ background:'var(--paper-dark)', borderRadius:'12px',
              border:'1px solid var(--line)', padding:'1.1rem 1.25rem',
              borderLeft:`4px solid ${vencida ? 'var(--crimson)' : urgente ? '#d97706' : 'var(--forest)'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.6rem', flexWrap:'wrap', marginBottom:'.3rem' }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:'.65rem', color:'var(--gold-dark)' }}>
                      {String(i+1).padStart(2,'0')}
                    </span>
                    <span style={{ fontFamily:'var(--serif)', fontSize:'1rem', fontWeight:600 }}>{t.titulo}</span>
                    {t.tipo_archivo && (
                      <span style={{ fontFamily:'var(--mono)', fontSize:'.65rem', padding:'.15rem .5rem',
                        borderRadius:'999px', background: t.tipo_archivo === 'pdf' ? '#fef2f2' : '#eff6ff',
                        color: t.tipo_archivo === 'pdf' ? '#b91c1c' : '#1d4ed8',
                        border: `1px solid ${t.tipo_archivo === 'pdf' ? '#fecaca' : '#bfdbfe'}` }}>
                        {t.tipo_archivo === 'pdf' ? 'PDF' : 'Word'}
                      </span>
                    )}
                  </div>
                  {t.descripcion && (
                    <p style={{ fontSize:'.83rem', color:'var(--ink-light)', margin:'0 0 .4rem', lineHeight:1.5 }}>
                      {t.descripcion}
                    </p>
                  )}
                  <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
                    {t.fecha_entrega && (
                      <span style={{ fontFamily:'var(--mono)', fontSize:'.72rem',
                        color: vencida ? 'var(--crimson)' : urgente ? '#d97706' : 'var(--ink-light)' }}>
                        {vencida ? '⚠ Vencida' : `⏱ ${dias === 0 ? 'Vence hoy' : `${dias}d restantes`}`}
                        {' — '}{new Date(t.fecha_entrega).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}
                      </span>
                    )}
                    <span style={{ fontFamily:'var(--mono)', fontSize:'.72rem', color:'var(--ink-light)' }}>
                      {t.total_entregas}/{t.total_inscritos} entregas
                    </span>
                    {parseInt(t.nuevas_entregas) > 0 && (
                      <span style={{ fontFamily:'var(--mono)', fontSize:'.68rem', padding:'.1rem .55rem',
                        borderRadius:'999px', background:'#fef2f2', color:'#b91c1c',
                        border:'1px solid #fecaca', fontWeight:700 }}>
                        {t.nuevas_entregas} nueva{t.nuevas_entregas > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display:'flex', gap:'.5rem', flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
                  {t.archivo_nombre && (
                    <button onClick={() => abrirVisorTarea(t)}
                      style={{ padding:'.4rem .85rem', borderRadius:'6px', border:'1px solid var(--line)',
                        background:'var(--paper-light)', cursor:'pointer', fontFamily:'var(--mono)',
                        fontSize:'.75rem', whiteSpace:'nowrap' }}>
                      📄 Material
                    </button>
                  )}
                  <button onClick={() => abrirEntregas(t)}
                    style={{ padding:'.4rem .85rem', borderRadius:'6px', border:'none',
                      background:'var(--ink)', color:'#fff', cursor:'pointer',
                      fontFamily:'var(--mono)', fontSize:'.75rem', whiteSpace:'nowrap' }}>
                    Ver entregas
                  </button>
                  <button onClick={() => eliminarTarea(t.id)}
                    style={{ padding:'.4rem .65rem', borderRadius:'6px',
                      border:'1px solid #fecaca', background:'#fef2f2',
                      color:'#dc2626', cursor:'pointer', fontSize:'.8rem' }}>
                    ×
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal entregas ── */}
      {entregasModal && (
        <div onClick={e => { if (e.target === e.currentTarget) { setEntregasModal(null); setCalificando(null); } }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', backdropFilter:'blur(4px)',
            zIndex:9990, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'var(--paper-light)', borderRadius:'14px', width:'100%', maxWidth:'720px',
            maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden',
            boxShadow:'0 24px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'1rem 1.5rem', borderBottom:'1px solid var(--line)', flexShrink:0 }}>
              <div>
                <div style={{ fontFamily:'var(--serif)', fontWeight:700, fontSize:'1rem' }}>
                  Entregas — {entregasModal.titulo}
                </div>
                <div style={{ fontFamily:'var(--mono)', fontSize:'.72rem', color:'var(--ink-light)', marginTop:'.15rem' }}>
                  {entregas.length} entrega{entregas.length !== 1 ? 's' : ''}
                </div>
              </div>
              <button onClick={() => { setEntregasModal(null); setCalificando(null); }}
                className="btn btn-secondary btn-sm">✕</button>
            </div>

            <div style={{ overflowY:'auto', flex:1, padding:'1rem 1.5rem',
              display:'flex', flexDirection:'column', gap:'.75rem' }}>
              {loadingEntr && <Spinner />}
              {!loadingEntr && !entregas.length && <Empty text="Sin entregas aún" />}
              {entregas.map(e => {
                const calificado = e.calificacion != null;
                const ext = e.archivo_nombre?.split('.').pop()?.toLowerCase();
                return (
                  <div key={e.id} style={{ background:'var(--paper-dark)', borderRadius:'10px',
                    border:'1px solid var(--line)',
                    borderLeft:`4px solid ${calificado ? 'var(--forest)' : '#d97706'}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      gap:'1rem', padding:'1rem 1.1rem' }}>
                      <div>
                        <div style={{ fontFamily:'var(--serif)', fontWeight:600, fontSize:'.95rem' }}>
                          {e.nombre} {e.apellido}
                        </div>
                        <div style={{ fontFamily:'var(--mono)', fontSize:'.7rem', color:'var(--ink-light)', marginTop:'.15rem' }}>
                          {e.codigo_estudiante}
                          {' · '}{new Date(e.fecha_entrega).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                        </div>
                        <div style={{ fontFamily:'var(--mono)', fontSize:'.72rem', marginTop:'.2rem',
                          color: calificado ? 'var(--forest)' : '#d97706', fontWeight:700 }}>
                          {calificado ? `✓ Calificado: ${parseFloat(e.calificacion).toFixed(1)}/100` : '⏳ Sin calificar'}
                        </div>
                        {calificado && e.comentario_calificacion && (
                          <div style={{ fontSize:'.78rem', color:'var(--ink-light)', marginTop:'.2rem',
                            fontStyle:'italic' }}>"{e.comentario_calificacion}"</div>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:'.45rem', flexShrink:0 }}>
                        <button onClick={() => abrirVisorEntrega(e)}
                          style={{ padding:'.35rem .8rem', borderRadius:'6px', border:'1px solid var(--line)',
                            background:'var(--paper-light)', cursor:'pointer',
                            fontFamily:'var(--mono)', fontSize:'.73rem' }}>
                          {ext === 'pdf' ? '📄' : '📝'} Ver
                        </button>
                        <a href={`${api.defaults.baseURL}/instructor/entregas-especiales/${e.id}/descargar?token=${localStorage.getItem('token')||''}`}
                          download={e.archivo_nombre}
                          style={{ padding:'.35rem .8rem', borderRadius:'6px', border:'1px solid var(--line)',
                            background:'var(--paper-light)', textDecoration:'none',
                            fontFamily:'var(--mono)', fontSize:'.73rem', color:'var(--ink)' }}>
                          ↓
                        </a>
                        <button
                          onClick={() => { setCalificando(e); setCalForm({ calificacion: e.calificacion != null ? String(e.calificacion) : '', comentario: e.comentario_calificacion || '' }); }}
                          style={{ padding:'.35rem .8rem', borderRadius:'6px',
                            background: calificado ? 'var(--paper-dark)' : 'var(--ink)',
                            color: calificado ? 'var(--ink)' : '#fff', cursor:'pointer',
                            fontFamily:'var(--mono)', fontSize:'.73rem',
                            border: calificado ? '1px solid var(--line)' : 'none' }}>
                          {calificado ? 'Editar nota' : 'Calificar'}
                        </button>
                      </div>
                    </div>

                    {/* Inline calificar */}
                    {calificando?.id === e.id && (
                      <div style={{ padding:'.85rem 1.1rem', borderTop:'1px solid var(--line)',
                        background:'var(--paper-light)', display:'flex', flexDirection:'column', gap:'.65rem' }}>
                        <div style={{ display:'flex', gap:'.75rem', alignItems:'center', flexWrap:'wrap' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                            <label style={{ fontFamily:'var(--mono)', fontSize:'.78rem' }}>Nota (0–100):</label>
                            <input type="number" min={0} max={100} step={0.1}
                              value={calForm.calificacion}
                              onChange={ev => setCalForm(f => ({...f, calificacion: ev.target.value}))}
                              style={{ width:'80px', padding:'.35rem .6rem', borderRadius:'6px',
                                border:'1px solid var(--line)', fontFamily:'var(--mono)',
                                fontSize:'.88rem', textAlign:'center' }} />
                          </div>
                          <input className="form-input" placeholder="Comentario (opcional)"
                            value={calForm.comentario}
                            onChange={ev => setCalForm(f => ({...f, comentario: ev.target.value}))}
                            style={{ flex:1, minWidth:'180px' }} />
                        </div>
                        <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end' }}>
                          <button onClick={() => setCalificando(null)} className="btn btn-secondary btn-sm">Cancelar</button>
                          <button onClick={guardarCalificacion} disabled={savingCal} className="btn btn-primary btn-sm">
                            {savingCal ? 'Guardando...' : 'Guardar nota'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Visores ── */}
      {visor && (
        <VisorArchivo url={visor.url} nombre={visor.nombre} tipo={visor.tipo}
          onClose={() => setVisor(null)} />
      )}
      {visorEntrega && (
        <VisorArchivo url={visorEntrega.url} nombre={visorEntrega.nombre} tipo={visorEntrega.tipo}
          onClose={() => setVisorEntrega(null)} />
      )}
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function InstructorMiCurso() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [curso, setCurso]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    api.get('/instructor/mis-cursos')
      .then(r => {
        const c = r.data.find(c => String(c.id) === String(id));
        if (!c) navigate('/instructor');
        else setCurso(c);
      })
      .catch(() => navigate('/instructor'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!curso)  return null;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'1.5rem' }}>
        <button onClick={() => navigate('/instructor')}
          style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'var(--mono)',
            fontSize:'.78rem', color:'var(--ink-light)', padding:0 }}>
          ← Mis cursos
        </button>
        <span style={{ color:'var(--line-strong)' }}>/</span>
        <span style={{ fontFamily:'var(--mono)', fontSize:'.78rem' }}>{curso.nombre}</span>
      </div>

      {/* Header */}
      <div style={{ padding:'1.5rem 2rem', background:'linear-gradient(135deg,#1e3a5f,#2d5986)',
        borderRadius:'12px', marginBottom:'1.75rem', color:'#fff' }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:'.62rem', letterSpacing:'.2em',
          textTransform:'uppercase', color:'rgba(147,197,253,.7)', marginBottom:'.4rem' }}>
          Curso especial
        </div>
        <h1 style={{ fontFamily:'var(--serif)', fontSize:'1.7rem', margin:'0 0 .5rem', lineHeight:1.2 }}>
          {curso.nombre}
        </h1>
        <div style={{ fontFamily:'var(--mono)', fontSize:'.78rem', color:'rgba(255,255,255,.65)' }}>
          {curso.aprobados} participantes aprobados · {curso.max_estudiantes} cupos
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'2px solid var(--line)', marginBottom:'1.75rem' }}>
        {TABS.map((tab, idx) => (
          <button key={tab} onClick={() => setActiveTab(idx)}
            style={{ padding:'.7rem 1.35rem', background:'none', border:'none', cursor:'pointer',
              fontFamily:'var(--mono)', fontSize:'.8rem', letterSpacing:'.08em',
              color: activeTab === idx ? 'var(--ink)' : 'var(--ink-light)',
              borderBottom: activeTab === idx ? '2px solid var(--ink)' : '2px solid transparent',
              marginBottom:'-2px', transition:'color .15s' }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <TabParticipantes cursoId={id} key={`p-${id}`} />}
      {activeTab === 1 && <TabAsistencia    cursoId={id} key={`a-${id}`} />}
      {activeTab === 2 && <TabMaterial      cursoId={id} key={`m-${id}`} />}
      {activeTab === 3 && <TabNotas         cursoId={id} key={`n-${id}`} />}
      {activeTab === 4 && <TabTareas        cursoId={id} key={`t-${id}`} />}
    </div>
  );
}
