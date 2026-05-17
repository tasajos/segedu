import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';

const TABS = ['Inscritos', 'Instructor', 'Material', 'Asistencia', 'Notas'];

const ESTADO_COLOR = {
  pendiente: { bg:'rgba(217,119,6,.1)', border:'rgba(217,119,6,.3)', color:'#d97706', label:'Pendiente' },
  aprobado:  { bg:'rgba(22,163,74,.1)',  border:'rgba(22,163,74,.3)',  color:'#16a34a', label:'Aprobado'  },
  rechazado: { bg:'rgba(220,38,38,.1)',  border:'rgba(220,38,38,.3)',  color:'#dc2626', label:'Rechazado' },
};

// ── TAB: INSCRITOS ────────────────────────────────────────────────────────────
function TabInscritos({ cursoId }) {
  const [inscritos, setInscritos] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtro, setFiltro]       = useState('todos');
  const [procesando, setProcesando] = useState(null);

  const cargar = () => api.get(`/jefe/cursos-especiales/${cursoId}/inscritos`)
    .then(r => setInscritos(r.data)).finally(() => setLoading(false));

  useEffect(() => { cargar(); }, [cursoId]);

  const cambiarEstado = async (inscripcionId, estado) => {
    setProcesando(inscripcionId);
    try {
      await api.put(`/jefe/cursos-especiales/${cursoId}/inscritos/${inscripcionId}`, { estado });
      cargar();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setProcesando(null); }
  };

  const FILTROS = [
    { key:'todos',     label:'Todos',     color:'var(--ink)',   bg:'var(--paper-dark)', border:'var(--line)' },
    { key:'pendiente', label:'Pendiente', color:'#d97706',      bg:'rgba(217,119,6,.08)', border:'rgba(217,119,6,.3)' },
    { key:'aprobado',  label:'Aprobado',  color:'#16a34a',      bg:'rgba(22,163,74,.08)', border:'rgba(22,163,74,.3)' },
    { key:'rechazado', label:'Rechazado', color:'#dc2626',      bg:'rgba(220,38,38,.08)', border:'rgba(220,38,38,.25)' },
  ];

  const conteo = (k) => k === 'todos' ? inscritos.length : inscritos.filter(i => i.estado === k).length;
  const visibles = filtro === 'todos' ? inscritos : inscritos.filter(i => i.estado === filtro);

  if (loading) return <Spinner />;
  if (inscritos.length === 0) return <Empty text="Aún no hay solicitudes de inscripción" />;

  return (
    <div>
      {/* ── Filtros / contadores ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.6rem', marginBottom:'1.5rem' }}>
        {FILTROS.map(f => {
          const activo = filtro === f.key;
          const cnt = conteo(f.key);
          return (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              style={{
                padding:'.75rem 1rem', borderRadius:'10px', border:`1px solid`,
                borderColor: activo ? f.color : f.border,
                background:  activo ? f.color : f.bg,
                color:       activo ? '#fff'  : f.color,
                cursor:'pointer', transition:'all .15s',
                display:'flex', flexDirection:'column', alignItems:'center', gap:'.2rem',
                boxShadow: activo ? `0 4px 14px ${f.color}33` : 'none'
              }}>
              <span style={{ fontFamily:'var(--serif)', fontSize:'1.6rem', fontWeight:700, lineHeight:1 }}>
                {cnt}
              </span>
              <span style={{ fontFamily:'var(--mono)', fontSize:'.68rem', letterSpacing:'.08em',
                textTransform:'uppercase', fontWeight:600 }}>
                {f.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Barra de búsqueda rápida ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
        <span style={{ fontFamily:'var(--mono)', fontSize:'.78rem', color:'var(--ink-light)' }}>
          {visibles.length} de {inscritos.length} estudiante{inscritos.length !== 1 ? 's' : ''}
          {filtro !== 'todos' && ` · filtrando por ${ESTADO_COLOR[filtro]?.label}`}
        </span>
        {filtro !== 'todos' && (
          <button onClick={() => setFiltro('todos')}
            style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'var(--mono)',
              fontSize:'.75rem', color:'var(--ink-light)', textDecoration:'underline' }}>
            Ver todos
          </button>
        )}
      </div>

      {/* ── Lista con scroll elegante ── */}
      {visibles.length === 0 ? (
        <Empty text={`Sin estudiantes con estado "${ESTADO_COLOR[filtro]?.label}"`} />
      ) : (
        <div style={{
          maxHeight:'60vh', overflowY:'auto', display:'flex', flexDirection:'column', gap:'.5rem',
          paddingRight:'.35rem',
          scrollbarWidth:'thin', scrollbarColor:'var(--line-strong) transparent'
        }}>
          {visibles.map((i, idx) => {
            const cfg = ESTADO_COLOR[i.estado];
            const enProceso = procesando === i.id;
            return (
              <div key={i.id}
                style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  gap:'1rem', padding:'1rem 1.25rem',
                  background:'var(--paper-dark)', borderRadius:'10px',
                  border:`1px solid var(--line)`,
                  borderLeft:`4px solid ${cfg.color}`,
                  transition:'box-shadow .15s',
                  opacity: enProceso ? .6 : 1
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
              >
                {/* Info estudiante */}
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', minWidth:0 }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'50%', flexShrink:0,
                    background:cfg.bg, border:`1px solid ${cfg.border}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:'var(--serif)', fontWeight:700, fontSize:'.85rem', color:cfg.color }}>
                    {i.nombre?.[0]}{i.apellido?.[0]}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:'.95rem',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {i.nombre} {i.apellido}
                    </div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:'.7rem', color:'var(--ink-light)', marginTop:'.15rem' }}>
                      Cód. {i.codigo_estudiante || '—'} · Sem. {i.semestre}
                      {' · '}{new Date(i.fecha_inscripcion).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display:'flex', gap:'.5rem', alignItems:'center', flexShrink:0 }}>
                  {/* Badge estado actual */}
                  <span style={{ padding:'.22rem .75rem', borderRadius:'999px', fontSize:'.7rem',
                    fontFamily:'var(--mono)', fontWeight:700,
                    background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.color }}>
                    {cfg.label}
                  </span>

                  {i.estado !== 'aprobado' && (
                    <button onClick={() => cambiarEstado(i.id, 'aprobado')} disabled={enProceso}
                      style={{ padding:'.35rem .85rem', borderRadius:'8px', cursor:'pointer',
                        background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0',
                        fontFamily:'var(--mono)', fontSize:'.78rem', fontWeight:700,
                        transition:'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#16a34a'; e.currentTarget.style.color='#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='#f0fdf4'; e.currentTarget.style.color='#16a34a'; }}>
                      ✓ Aprobar
                    </button>
                  )}
                  {i.estado !== 'pendiente' && (
                    <button onClick={() => cambiarEstado(i.id, 'pendiente')} disabled={enProceso}
                      style={{ padding:'.35rem .85rem', borderRadius:'8px', cursor:'pointer',
                        background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a',
                        fontFamily:'var(--mono)', fontSize:'.78rem', fontWeight:700,
                        transition:'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#d97706'; e.currentTarget.style.color='#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='#fffbeb'; e.currentTarget.style.color='#d97706'; }}>
                      ⏳ Pendiente
                    </button>
                  )}
                  {i.estado !== 'rechazado' && (
                    <button onClick={() => cambiarEstado(i.id, 'rechazado')} disabled={enProceso}
                      style={{ padding:'.35rem .85rem', borderRadius:'8px', cursor:'pointer',
                        background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca',
                        fontFamily:'var(--mono)', fontSize:'.78rem', fontWeight:700,
                        transition:'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#dc2626'; e.currentTarget.style.color='#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#dc2626'; }}>
                      ✕ Rechazar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── TAB: INSTRUCTOR ───────────────────────────────────────────────────────────
function TabInstructor({ cursoId, curso, onCursoUpdate }) {
  const [instructores, setInstructores] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modalCrear, setModalCrear]     = useState(false);
  const [form, setForm] = useState({ nombre:'', apellido:'', email:'', especialidad:'', password:'', password2:'' });
  const [formErr, setFormErr] = useState('');
  const [guardando, setGuardando]       = useState(false);
  const [selId, setSelId]               = useState(curso?.instructor_id || '');

  const cargar = () => api.get('/jefe/cursos-especiales/instructores')
    .then(r => { setInstructores(r.data); }).finally(() => setLoading(false));

  useEffect(() => { cargar(); }, []);

  const asignar = async (instructorId) => {
    try {
      await api.put(`/jefe/cursos-especiales/${cursoId}/instructor`, { instructor_id: instructorId || null });
      setSelId(instructorId);
      onCursoUpdate();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const crearInstructor = async () => {
    setFormErr('');
    if (!form.nombre.trim()) return setFormErr('El nombre es obligatorio');
    if (!form.email.trim())  return setFormErr('El email es obligatorio');
    if (!form.password || form.password.length < 6) return setFormErr('La contraseña debe tener al menos 6 caracteres');
    if (form.password !== form.password2) return setFormErr('Las contraseñas no coinciden');
    setGuardando(true);
    try {
      const { data } = await api.post('/jefe/cursos-especiales/instructores', {
        nombre: form.nombre, apellido: form.apellido, email: form.email,
        especialidad: form.especialidad, password: form.password
      });
      await cargar();
      setModalCrear(false);
      setForm({ nombre:'', apellido:'', email:'', especialidad:'', password:'', password2:'' });
      await asignar(data.id);
    } catch (err) { setFormErr(err.response?.data?.error || 'Error al crear instructor'); }
    finally { setGuardando(false); }
  };

  if (loading) return <Spinner />;

  const instructorActual = instructores.find(i => i.id === (selId || curso?.instructor_id));

  return (
    <div>
      {instructorActual && (
        <div style={{ marginBottom:'1.5rem', padding:'1.25rem', background:'rgba(22,163,74,.06)',
          border:'1px solid rgba(22,163,74,.25)', borderRadius:'10px' }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:'.68rem', color:'#16a34a',
            letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.5rem' }}>Instructor actual</div>
          <div style={{ fontWeight:700, fontSize:'1.05rem' }}>
            {instructorActual.nombre} {instructorActual.apellido || ''}
          </div>
          {instructorActual.especialidad && <div style={{ fontSize:'.85rem', color:'var(--ink-light)' }}>{instructorActual.especialidad}</div>}
          {instructorActual.email && <div style={{ fontFamily:'var(--mono)', fontSize:'.78rem', color:'var(--ink-light)', marginTop:'.2rem' }}>{instructorActual.email}</div>}
          <button onClick={() => asignar(null)}
            style={{ marginTop:'.75rem', background:'none', border:'none', color:'var(--crimson)',
              cursor:'pointer', fontFamily:'var(--mono)', fontSize:'.75rem', padding:0 }}>
            × Quitar instructor
          </button>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
        <div style={{ fontWeight:600, fontSize:'.95rem' }}>
          {instructores.length > 0 ? 'Seleccionar instructor' : 'No hay instructores registrados'}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModalCrear(true)}>+ Nuevo instructor</button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
        {instructores.map(inst => {
          const activo = inst.id === (selId || curso?.instructor_id);
          return (
            <div key={inst.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'1rem 1.25rem', background: activo ? 'var(--paper-dark)' : 'var(--paper-light)',
              borderRadius:'8px', border:`1px solid ${activo ? 'var(--ink)' : 'var(--line)'}` }}>
              <div>
                <div style={{ fontWeight:600 }}>{inst.nombre} {inst.apellido || ''}</div>
                {inst.especialidad && <div style={{ fontSize:'.82rem', color:'var(--ink-light)' }}>{inst.especialidad}</div>}
                {inst.email && <div style={{ fontFamily:'var(--mono)', fontSize:'.72rem', color:'var(--ink-light)' }}>{inst.email}</div>}
              </div>
              {!activo && (
                <button className="btn btn-secondary btn-sm" onClick={() => asignar(inst.id)}>Asignar</button>
              )}
              {activo && <span style={{ fontFamily:'var(--mono)', fontSize:'.72rem', color:'var(--forest)' }}>✓ Asignado</span>}
            </div>
          );
        })}
      </div>

      <Modal open={modalCrear} onClose={() => { setModalCrear(false); setFormErr(''); }} title="Nuevo instructor" maxWidth="500px">
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

          <div style={{ padding:'.75rem 1rem', background:'#eff6ff', border:'1px solid #bfdbfe',
            borderRadius:'8px', fontSize:'.83rem', color:'#1e40af', lineHeight:1.55 }}>
            El instructor podrá iniciar sesión con el email y contraseña que definas aquí.
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div>
              <label className="form-label">Nombre *</label>
              <input className="form-input" placeholder="Nombre" value={form.nombre}
                onChange={e => setForm({...form, nombre:e.target.value})} />
            </div>
            <div>
              <label className="form-label">Apellido</label>
              <input className="form-input" placeholder="Apellido" value={form.apellido}
                onChange={e => setForm({...form, apellido:e.target.value})} />
            </div>
          </div>

          <div>
            <label className="form-label">Email * (usado para iniciar sesión)</label>
            <input className="form-input" type="email" placeholder="correo@ejemplo.com"
              value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
          </div>

          <div>
            <label className="form-label">Especialidad</label>
            <input className="form-input" placeholder="Ej: Redes, Programación Web..."
              value={form.especialidad} onChange={e => setForm({...form, especialidad:e.target.value})} />
          </div>

          <div style={{ borderTop:'1px solid var(--line)', paddingTop:'1rem' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:'.7rem', color:'var(--ink-light)',
              letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.75rem' }}>
              Credenciales de acceso
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div>
                <label className="form-label">Contraseña *</label>
                <input className="form-input" type="password" placeholder="Mín. 6 caracteres"
                  value={form.password} onChange={e => setForm({...form, password:e.target.value})} />
              </div>
              <div>
                <label className="form-label">Confirmar contraseña *</label>
                <input className="form-input" type="password" placeholder="Repite la contraseña"
                  value={form.password2} onChange={e => setForm({...form, password2:e.target.value})} />
              </div>
            </div>
          </div>

          {formErr && (
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'6px',
              padding:'.65rem 1rem', fontSize:'.85rem', color:'#b91c1c' }}>
              {formErr}
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end', gap:'.75rem', paddingTop:'.25rem' }}>
            <button className="btn btn-secondary" onClick={() => { setModalCrear(false); setFormErr(''); }}>Cancelar</button>
            <button className="btn btn-primary" onClick={crearInstructor} disabled={guardando}>
              {guardando ? 'Creando...' : 'Crear instructor y asignar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── TAB: MATERIAL ─────────────────────────────────────────────────────────────
function TabMaterial({ cursoId }) {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [subiendo, setSubiendo]   = useState(false);
  const [titulo, setTitulo]       = useState('');
  const fileRef                   = useRef(null);

  const cargar = () => api.get(`/jefe/cursos-especiales/${cursoId}/material`)
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
      await api.post(`/jefe/cursos-especiales/${cursoId}/material`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTitulo('');
      fileRef.current.value = '';
      cargar();
    } catch (err) { alert(err.response?.data?.error || 'Error al subir'); }
    finally { setSubiendo(false); }
  };

  const eliminar = async (matId) => {
    if (!confirm('¿Eliminar este archivo?')) return;
    try {
      await api.delete(`/jefe/cursos-especiales/${cursoId}/material/${matId}`);
      cargar();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const extIcon = (t) => ({ pdf:'📄', doc:'📝', docx:'📝', pptx:'📊', xlsx:'📊', mp4:'🎬', mp3:'🎵', zip:'📦' }[t] || '📁');

  if (loading) return <Spinner />;

  return (
    <div>
      {/* Upload panel */}
      <div style={{ padding:'1.25rem', background:'var(--paper-dark)', borderRadius:'10px',
        border:'1px solid var(--line)', marginBottom:'1.5rem', display:'flex', flexDirection:'column', gap:'.75rem' }}>
        <div style={{ fontWeight:600, fontSize:'.92rem' }}>Subir nuevo material</div>
        <div>
          <label className="form-label">Título del archivo</label>
          <input className="form-input" placeholder="Nombre descriptivo (opcional)"
            value={titulo} onChange={e => setTitulo(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Archivo (PDF, PPTX, video, ZIP... hasta 50MB)</label>
          <input type="file" ref={fileRef} style={{ display:'block', marginTop:'.4rem' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={subir} disabled={subiendo}>
            {subiendo ? 'Subiendo...' : '↑ Subir archivo'}
          </button>
        </div>
      </div>

      {items.length === 0 && <Empty text="Sin material publicado aún" />}

      <div style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
        {items.map(m => (
          <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'1rem',
            padding:'1rem 1.25rem', background:'var(--paper-dark)',
            borderRadius:'8px', border:'1px solid var(--line)' }}>
            <span style={{ fontSize:'1.5rem', flexShrink:0 }}>{extIcon(m.tipo_archivo)}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:'.93rem' }}>{m.titulo}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:'.7rem', color:'var(--ink-light)', marginTop:'.2rem' }}>
                .{m.tipo_archivo || 'archivo'} · {new Date(m.created_at).toLocaleDateString('es-ES')}
              </div>
            </div>
            <a href={`/uploads/${m.archivo_path}`} target="_blank" rel="noreferrer"
              className="btn btn-secondary btn-sm">Ver</a>
            <button className="btn btn-danger btn-sm" onClick={() => eliminar(m.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Constantes de asistencia (misma lógica que asistencia regular) ────────────
const ASIST_ESTADOS = ['presente', 'falta', 'permiso'];
const ASIST_COLOR  = { presente: '#16a34a', falta: '#dc2626', permiso: '#d97706' };
const ASIST_BG     = { presente: '#f0fdf4', falta: '#fef2f2', permiso: '#fffbeb' };
const ASIST_BORDER = { presente: '#bbf7d0', falta: '#fecaca', permiso: '#fde68a' };
const ASIST_LABEL  = { presente: 'Presente', falta: 'Falta',    permiso: 'Permiso'  };

const getTodayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// ── TAB: ASISTENCIA ───────────────────────────────────────────────────────────
function TabAsistencia({ cursoId }) {
  const [fecha, setFecha]         = useState(getTodayLocal());
  const [estudiantes, setEst]     = useState([]);
  const [estados, setEstados]     = useState({});
  const [fechas, setFechas]       = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado]   = useState(false);
  const [loading, setLoading]     = useState(true);

  const cargarFechas = () =>
    api.get(`/jefe/cursos-especiales/${cursoId}/asistencia/fechas`).then(r => setFechas(r.data));

  const cargarAsistencia = async (f) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/jefe/cursos-especiales/${cursoId}/asistencia`, { params: { fecha: f } });
      setEst(data);
      const map = {};
      data.forEach(e => { map[e.estudiante_id] = e.estado || 'presente'; });
      setEstados(map);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargarFechas(); cargarAsistencia(fecha); }, [cursoId]);

  const cambiarFecha = (f) => { setFecha(f); cargarAsistencia(f); };

  const marcarTodos = (est) => {
    const next = {};
    estudiantes.forEach(e => { next[e.estudiante_id] = est; });
    setEstados(next);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const registros = Object.entries(estados).map(([estudiante_id, estado]) => ({
        estudiante_id: parseInt(estudiante_id), estado
      }));
      await api.post(`/jefe/cursos-especiales/${cursoId}/asistencia`, { fecha, registros });
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
      {/* Selector de fecha y sesiones */}
      <div style={{ display:'grid', gridTemplateColumns: fechas.length > 0 ? '1fr 1fr' : '1fr', gap:'1rem', marginBottom:'1.5rem', alignItems:'end' }}>
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

      {loading ? <Spinner /> : estudiantes.length === 0 ? (
        <Empty text="No hay estudiantes aprobados en este curso" />
      ) : (
        <>
          {/* Tarjetas de resumen — misma lógica que asistencia regular */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.75rem', marginBottom:'1.5rem' }}>
            {ASIST_ESTADOS.map(est => {
              const count = Object.values(estados).filter(v => v === est).length;
              return (
                <div
                  key={est}
                  onClick={() => marcarTodos(est)}
                  style={{ padding:'1rem 1.1rem', background:ASIST_BG[est], borderRadius:'12px',
                    border:`1px solid ${ASIST_BORDER[est]}`, cursor:'pointer',
                    boxShadow:'0 1px 4px rgba(0,0,0,.06)', transition:'transform .15s, box-shadow .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'; }}
                >
                  <div style={{ fontFamily:'var(--serif)', fontSize:'2.2rem', lineHeight:1, color:ASIST_COLOR[est], fontWeight:700 }}>
                    {count}
                  </div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:'.68rem', color:ASIST_COLOR[est],
                    textTransform:'uppercase', letterSpacing:'.1em', marginTop:'.35rem', fontWeight:700 }}>
                    {ASIST_LABEL[est]}
                  </div>
                  <div style={{ fontSize:'.72rem', color:'#64748b', marginTop:'.3rem' }}>
                    clic para marcar todos
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botones "Marcar todos" */}
          <div style={{ display:'flex', alignItems:'center', gap:'.6rem', flexWrap:'wrap', marginBottom:'1.25rem' }}>
            <span style={{ fontSize:'.82rem', color:'var(--ink-light)', fontFamily:'var(--mono)' }}>
              Marcar todos:
            </span>
            {ASIST_ESTADOS.map(est => (
              <button key={est} onClick={() => marcarTodos(est)}
                style={{ padding:'.45rem .95rem', borderRadius:'999px',
                  border:`1px solid ${ASIST_BORDER[est]}`, background:ASIST_BG[est],
                  color:ASIST_COLOR[est], fontWeight:700, fontSize:'.8rem', cursor:'pointer',
                  boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
                {ASIST_LABEL[est]}
              </button>
            ))}
          </div>

          {/* Lista de estudiantes */}
          <div style={{ display:'flex', flexDirection:'column', gap:'.5rem', marginBottom:'1.5rem' }}>
            {estudiantes.map((e, i) => {
              const estadoActual = estados[e.estudiante_id] || 'presente';
              return (
                <div key={e.estudiante_id}
                  style={{ padding:'1rem 1.1rem', background:ASIST_BG[estadoActual],
                    borderRadius:'12px', border:`1px solid ${ASIST_BORDER[estadoActual]}`,
                    borderLeft:`4px solid ${ASIST_COLOR[estadoActual]}`,
                    transition:'border-color .2s, background .2s',
                    boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'32px 1fr auto', gap:'1rem', alignItems:'center' }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:'.75rem', color:'#94a3b8' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div style={{ fontFamily:'var(--serif)', fontSize:'.95rem', fontWeight:600 }}>
                        {e.nombre} {e.apellido}
                      </div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:'.72rem', color:'#64748b', marginTop:'.1rem' }}>
                        {e.codigo_estudiante}
                      </div>
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
                              borderRadius:'999px', cursor:'pointer',
                              fontFamily:'var(--sans)', fontSize:'.78rem', fontWeight:700,
                              transition:'all .15s', minWidth:'84px',
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

          {/* Barra inferior de resumen y guardar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'1rem 1.25rem', background:'var(--ink)', color:'var(--paper)',
            borderRadius:'10px', gap:'1rem', flexWrap:'wrap' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:'.8rem', color:'rgba(255,255,255,.75)' }}>
              {new Date(fecha+'T00:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
              {' · '}{presentes} presentes · {faltas} faltas · {permisos} permisos
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
              {guardado && (
                <span style={{ color:'#4ade80', fontFamily:'var(--mono)', fontSize:'.8rem' }}>
                  ✓ Lista guardada
                </span>
              )}
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

// ── TAB: NOTAS ────────────────────────────────────────────────────────────────
function TabNotas({ cursoId }) {
  const [rows, setRows]           = useState([]);
  const [notas, setNotas]         = useState({});
  const [descrip, setDescrip]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get(`/jefe/cursos-especiales/${cursoId}/notas`)
      .then(r => {
        setRows(r.data);
        const nm = {}, dm = {};
        r.data.forEach(s => {
          nm[s.estudiante_id] = s.nota != null ? String(s.nota) : '';
          dm[s.estudiante_id] = s.descripcion || '';
        });
        setNotas(nm);
        setDescrip(dm);
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
      await api.post(`/jefe/cursos-especiales/${cursoId}/notas`, { notas: arr });
      alert('Notas guardadas correctamente');
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setGuardando(false); }
  };

  if (loading) return <Spinner />;
  if (rows.length === 0) return <Empty text="No hay estudiantes aprobados para calificar" />;

  return (
    <div>
      <div style={{ display:'flex', flexDirection:'column', gap:'.75rem', marginBottom:'1.25rem' }}>
        {rows.map(s => (
          <div key={s.estudiante_id} style={{ padding:'1rem 1.25rem', background:'var(--paper-dark)',
            borderRadius:'8px', border:'1px solid var(--line)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              gap:'1rem', marginBottom:'.6rem' }}>
              <div>
                <div style={{ fontWeight:600 }}>{s.nombre} {s.apellido}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:'.72rem', color:'var(--ink-light)' }}>
                  {s.codigo_estudiante}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                <label style={{ fontFamily:'var(--mono)', fontSize:'.75rem', color:'var(--ink-light)' }}>Nota:</label>
                <input
                  type="number" min={0} max={100} step={0.1}
                  value={notas[s.estudiante_id] ?? ''}
                  onChange={e => setNotas(n => ({...n, [s.estudiante_id]: e.target.value}))}
                  style={{ width:'80px', padding:'.4rem .6rem', borderRadius:'6px',
                    border:'1px solid var(--line)', fontFamily:'var(--mono)', fontSize:'.88rem',
                    background:'var(--paper-light)', textAlign:'center' }}
                  placeholder="0-100"
                />
              </div>
            </div>
            <input
              className="form-input"
              placeholder="Observaciones (opcional)"
              value={descrip[s.estudiante_id] || ''}
              onChange={e => setDescrip(d => ({...d, [s.estudiante_id]: e.target.value}))}
            />
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar notas'}
        </button>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ textAlign:'center', padding:'2.5rem', color:'var(--ink-light)' }}>Cargando...</div>
);
const Empty = ({ text }) => (
  <div style={{ textAlign:'center', padding:'2.5rem', border:'1px dashed var(--line-strong)',
    borderRadius:'8px', color:'var(--ink-light)', fontStyle:'italic' }}>{text}</div>
);

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function CursoEspecialDetalle() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const cargarCurso = () => api.get(`/jefe/cursos-especiales/${id}`)
    .then(r => setCurso(r.data)).catch(() => navigate('/jefe/cursos-especiales'))
    .finally(() => setLoading(false));

  useEffect(() => { cargarCurso(); }, [id]);

  if (loading) return <Spinner />;
  if (!curso)  return null;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'1.5rem' }}>
        <button onClick={() => navigate('/jefe/cursos-especiales')}
          style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'var(--mono)',
            fontSize:'.78rem', color:'var(--ink-light)', padding:0, display:'flex', alignItems:'center', gap:'.3rem' }}>
          ← Cursos especiales
        </button>
        <span style={{ color:'var(--line-strong)' }}>/</span>
        <span style={{ fontFamily:'var(--mono)', fontSize:'.78rem' }}>{curso.nombre}</span>
      </div>

      {/* Header */}
      <div style={{ padding:'1.5rem 2rem', background:'linear-gradient(135deg,#1e3a5f,#2d5986)',
        borderRadius:'12px', marginBottom:'1.75rem', color:'#fff' }}>
        <div style={{ fontFamily:'var(--mono)', fontSize:'.65rem', letterSpacing:'.2em',
          textTransform:'uppercase', color:'rgba(255,255,255,.5)', marginBottom:'.4rem' }}>
          Curso especial
        </div>
        <h1 style={{ fontFamily:'var(--serif)', fontSize:'1.8rem', margin:'0 0 .5rem', lineHeight:1.2 }}>
          {curso.nombre}
        </h1>
        <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
          <span style={{ fontFamily:'var(--mono)', fontSize:'.78rem', color:'rgba(255,255,255,.65)' }}>
            {curso.aprobados} aprobados · {curso.max_estudiantes} cupos
          </span>
          {curso.instructor_nombre && (
            <span style={{ fontFamily:'var(--mono)', fontSize:'.78rem', color:'rgba(255,255,255,.65)' }}>
              Instructor: {curso.instructor_nombre} {curso.instructor_apellido||''}
            </span>
          )}
          <span style={{ padding:'.15rem .6rem', borderRadius:'999px', fontSize:'.72rem',
            fontFamily:'var(--mono)', fontWeight:700,
            background: curso.activo ? 'rgba(22,163,74,.25)' : 'rgba(220,38,38,.25)',
            color: curso.activo ? '#6ee7b7' : '#fca5a5' }}>
            {curso.activo ? 'Habilitado' : 'Deshabilitado'}
          </span>
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

      {activeTab === 0 && <TabInscritos  cursoId={id} key={`ins-${id}`} />}
      {activeTab === 1 && <TabInstructor cursoId={id} curso={curso} onCursoUpdate={cargarCurso} key={`instr-${id}`} />}
      {activeTab === 2 && <TabMaterial   cursoId={id} key={`mat-${id}`} />}
      {activeTab === 3 && <TabAsistencia cursoId={id} key={`asi-${id}`} />}
      {activeTab === 4 && <TabNotas      cursoId={id} key={`not-${id}`} />}
    </div>
  );
}
