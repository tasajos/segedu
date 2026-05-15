import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

// ── Constantes de asistencia (misma lógica que asistencia regular) ─────────────
const ASIST_ESTADOS = ['presente', 'falta', 'permiso'];
const ASIST_COLOR  = { presente: '#16a34a', falta: '#dc2626', permiso: '#d97706' };
const ASIST_BG     = { presente: '#f0fdf4', falta: '#fef2f2', permiso: '#fffbeb' };
const ASIST_BORDER = { presente: '#bbf7d0', falta: '#fecaca', permiso: '#fde68a' };
const ASIST_LABEL  = { presente: 'Presente', falta: 'Falta',    permiso: 'Permiso'  };

const TABS = ['Participantes', 'Asistencia', 'Material', 'Notas'];

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
    </div>
  );
}
