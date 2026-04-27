import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import mammoth from 'mammoth';

const TIPO_CHIP = { pdf: 'chip-crimson', pptx: 'chip-gold' };

const formatFecha = (val) => {
  if (!val) return '—';
  const [y, m, d] = String(val).split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

// ── Visor de archivo de tarea (PDF o PPTX con extracción de slides) ──────────
function VisorArchivo({ tareaId, tipoArchivo, apiBase }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [slides, setSlides] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setPdfUrl(null);
    setSlides(null);
    setLoading(true);
    setError('');

    if (tipoArchivo === 'pdf') {
      api.get(`${apiBase}/tareas/${tareaId}/ver`, { responseType: 'blob' })
        .then(r => setPdfUrl(URL.createObjectURL(r.data)))
        .catch(() => setError('No se pudo cargar el archivo PDF.'))
        .finally(() => setLoading(false));
    } else if (tipoArchivo === 'pptx') {
      api.get(`${apiBase}/tareas/${tareaId}/slides`)
        .then(r => setSlides(r.data.slides))
        .catch(() => setError('No se pudieron extraer las diapositivas.'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setError('Tipo de archivo no soportado.');
    }

    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [tareaId, tipoArchivo]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando archivo...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--crimson)' }}>{error}</div>;

  if (tipoArchivo === 'pdf' && pdfUrl) {
    return (
      <div style={{ position: 'relative', height: '72vh', userSelect: 'none' }}>
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: '2px' }}
          title="Visor PDF"
        />
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 10 }}
          onContextMenu={e => e.preventDefault()}
        />
      </div>
    );
  }

  if (tipoArchivo === 'pptx' && slides) {
    if (!slides.length) return <p style={{ color: 'var(--ink-light)' }}>No se encontraron diapositivas.</p>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '72vh', overflowY: 'auto', padding: '.25rem' }}>
        {slides.map(s => (
          <div key={s.numero} style={{ background: '#1e1e2e', color: '#e8e8f0', borderRadius: '4px', padding: '1.5rem 2rem', minHeight: '140px' }}>
            <div style={{ fontSize: '.65rem', letterSpacing: '.12em', color: 'rgba(220,220,255,.45)', marginBottom: '1rem', fontFamily: 'var(--mono)' }}>
              DIAPOSITIVA {String(s.numero).padStart(2, '0')}
            </div>
            {s.textos.length === 0
              ? <p style={{ color: 'rgba(220,220,255,.4)', fontStyle: 'italic' }}>— Sin texto —</p>
              : s.textos.map((t, i) => (
                <p key={i} style={{ margin: '.3rem 0', fontSize: i === 0 ? '1.05rem' : '.9rem', fontWeight: i === 0 ? 600 : 400 }}>{t}</p>
              ))
            }
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ── Visor de entrega Word (docente lee el DOCX del estudiante) ───────────────
function VisorEntrega({ entregaId }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/docente/entregas/${entregaId}/ver`, { responseType: 'arraybuffer' })
      .then(r => mammoth.convertToHtml({ arrayBuffer: r.data }))
      .then(result => setHtml(result.value))
      .catch(() => setError('No se pudo cargar el documento.'))
      .finally(() => setLoading(false));
  }, [entregaId]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando documento...</div>;
  if (error) return <div style={{ color: 'var(--crimson)', padding: '1rem' }}>{error}</div>;
  return (
    <div
      className="word-preview"
      dangerouslySetInnerHTML={{ __html: html }}
      onContextMenu={e => e.preventDefault()}
      style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1rem', background: '#fff', borderRadius: '2px', lineHeight: 1.7, color: '#111' }}
    />
  );
}

export default function DocenteTareas() {
  const [materias, setMaterias] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [filtroMateria, setFiltroMateria] = useState('');
  const [entregas, setEntregas] = useState([]);

  // Modals
  const [modalNueva, setModalNueva] = useState(false);
  const [modalVisor, setModalVisor] = useState(null);  // { tareaId, tipo }
  const [modalEntregas, setModalEntregas] = useState(null); // tarea
  const [modalCalificar, setModalCalificar] = useState(null); // entrega
  const [modalVerEntrega, setModalVerEntrega] = useState(null); // entregaId

  // Form
  const [form, setForm] = useState({ materia_id: '', titulo: '', descripcion: '', fecha_entrega: '' });
  const [archivo, setArchivo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [calForm, setCalForm] = useState({ calificacion: '', comentario_calificacion: '' });

  const cargar = async () => {
    const [m, t] = await Promise.all([
      api.get('/docente/materias'),
      api.get('/docente/tareas', { params: filtroMateria ? { materia_id: filtroMateria } : {} })
    ]);
    setMaterias(m.data);
    setTareas(t.data);
  };

  useEffect(() => { cargar(); }, [filtroMateria]);

  const guardarTarea = async (e) => {
    e.preventDefault();
    if (!form.materia_id || !form.titulo) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (archivo) fd.append('archivo', archivo);
      await api.post('/docente/tareas', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setModalNueva(false);
      setForm({ materia_id: '', titulo: '', descripcion: '', fecha_entrega: '' });
      setArchivo(null);
      cargar();
    } finally {
      setSaving(false);
    }
  };

  const eliminarTarea = async (id) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    await api.delete(`/docente/tareas/${id}`);
    cargar();
  };

  const abrirEntregas = async (tarea) => {
    setModalEntregas(tarea);
    const r = await api.get(`/docente/tareas/${tarea.id}/entregas`);
    setEntregas(r.data);
  };

  const guardarCalificacion = async (e) => {
    e.preventDefault();
    await api.put(`/docente/entregas/${modalCalificar.id}/calificar`, calForm);
    setModalCalificar(null);
    if (modalEntregas) {
      const r = await api.get(`/docente/tareas/${modalEntregas.id}/entregas`);
      setEntregas(r.data);
    }
  };

  const tareasFiltradas = filtroMateria
    ? tareas.filter(t => String(t.materia_id) === filtroMateria)
    : tareas;

  return (
    <>
      <PageHeader
        num="07"
        eyebrow="Gestión académica"
        title={<>Tareas del <span className="display-italic">curso</span></>}
        lead="Asigne tareas a todo el curso. Adjunte materiales en PDF o presentaciones PPTX para que los estudiantes los consulten directamente en el sistema."
        actions={<button className="btn btn-primary" onClick={() => setModalNueva(true)}>＋ Nueva tarea</button>}
      />

      {/* Filtro por materia */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <select
          className="input"
          value={filtroMateria}
          onChange={e => setFiltroMateria(e.target.value)}
          style={{ maxWidth: '320px' }}
        >
          <option value="">Todas las materias</option>
          {materias.map(m => (
            <option key={m.id} value={m.id}>{m.nombre} — Grupo {m.grupo}</option>
          ))}
        </select>
        <span className="count">{tareasFiltradas.length} tareas</span>
      </div>

      {/* Lista de tareas */}
      {tareasFiltradas.length === 0 && (
        <div style={{ padding: '4rem', textAlign: 'center', border: '1px dashed var(--line-strong)' }}>
          <p className="display-italic" style={{ fontSize: '1.1rem', color: 'var(--ink-light)' }}>Sin tareas registradas</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tareasFiltradas.map((t, i) => (
          <div key={t.id} className="card" style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: '1.25rem', alignItems: 'start' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', color: 'var(--ink-xlight)', fontStyle: 'italic', paddingTop: '.2rem' }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div>
              <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--gold-dark)', letterSpacing: '.09em', marginBottom: '.3rem' }}>
                {t.materia_codigo} · {t.materia_nombre} — Grupo {t.materia_grupo}
              </div>
              <h3 style={{ marginBottom: '.3rem' }}>{t.titulo}</h3>
              {t.descripcion && <p style={{ fontSize: '.88rem', color: 'var(--ink-light)', marginBottom: '.5rem' }}>{t.descripcion}</p>}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '.8rem', color: 'var(--ink-light)' }}>
                {t.fecha_entrega && <span>Entrega: <strong>{formatFecha(t.fecha_entrega)}</strong></span>}
                <span>{t.total_entregas} / {t.total_inscritos} entregas</span>
                {t.tipo_archivo && <span className={`chip ${TIPO_CHIP[t.tipo_archivo] || 'chip-ink'}`}>{t.tipo_archivo.toUpperCase()}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'flex-end' }}>
              {t.archivo_path && (
                <button className="btn btn-outline" style={{ fontSize: '.78rem' }}
                  onClick={() => setModalVisor({ tareaId: t.id, tipo: t.tipo_archivo, titulo: t.titulo })}>
                  Ver material
                </button>
              )}
              <button className="btn btn-primary" style={{ fontSize: '.78rem' }} onClick={() => abrirEntregas(t)}>
                Entregas ({t.total_entregas})
              </button>
              <button className="btn btn-ghost" style={{ fontSize: '.78rem', color: 'var(--crimson)' }} onClick={() => eliminarTarea(t.id)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: nueva tarea */}
      <Modal open={modalNueva} onClose={() => setModalNueva(false)} title="Nueva tarea" maxWidth="600px">
        <form onSubmit={guardarTarea} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Materia *</label>
            <select className="input" value={form.materia_id} onChange={e => setForm(f => ({ ...f, materia_id: e.target.value }))} required>
              <option value="">Seleccione una materia</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nombre} — Grupo {m.grupo}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Título *</label>
            <input className="input" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} required placeholder="Ej: Tarea 1 — Fundamentos" />
          </div>
          <div>
            <label className="label">Descripción / instrucciones</label>
            <textarea className="input" rows={3} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Detalle lo que deben hacer los estudiantes..." />
          </div>
          <div>
            <label className="label">Fecha de entrega</label>
            <input type="date" className="input" value={form.fecha_entrega} onChange={e => setForm(f => ({ ...f, fecha_entrega: e.target.value }))} />
          </div>
          <div>
            <label className="label">Material de apoyo (PDF o PPTX, opcional)</label>
            <input type="file" accept=".pdf,.pptx" onChange={e => setArchivo(e.target.files[0])} style={{ fontSize: '.85rem' }} />
            <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', marginTop: '.4rem' }}>
              Solo PDF y PPTX. Los estudiantes podrán verlo pero no descargarlo.
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', paddingTop: '.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setModalNueva(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Crear tarea'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal: visor de material */}
      <Modal open={!!modalVisor} onClose={() => setModalVisor(null)} title={modalVisor?.titulo || 'Material de tarea'} maxWidth="900px">
        {modalVisor && (
          <VisorArchivo tareaId={modalVisor.tareaId} tipoArchivo={modalVisor.tipo} apiBase="/docente" />
        )}
      </Modal>

      {/* Modal: entregas de estudiantes */}
      <Modal open={!!modalEntregas} onClose={() => setModalEntregas(null)} title={`Entregas — ${modalEntregas?.titulo || ''}`} maxWidth="820px">
        {modalEntregas && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', maxHeight: '65vh', overflowY: 'auto' }}>
            {entregas.length === 0 && (
              <p style={{ color: 'var(--ink-light)', padding: '1.5rem', textAlign: 'center' }}>Sin entregas aún.</p>
            )}
            {entregas.map(e => (
              <div key={e.id} style={{ padding: '1rem 1.1rem', background: 'var(--paper-dark)', borderRadius: '2px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontFamily: 'var(--serif)' }}>{e.nombre} {e.apellido}</div>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>
                    {e.codigo_estudiante} · Entregado: {formatFecha(e.fecha_entrega?.split('T')[0])}
                    {e.nombre_grupo && <> · Grupo: <strong>{e.nombre_grupo}</strong></>}
                  </div>
                  {e.calificacion !== null
                    ? <div style={{ marginTop: '.4rem', fontSize: '.85rem' }}>
                        <span className="chip chip-forest" style={{ marginRight: '.5rem' }}>{e.calificacion}</span>
                        {e.comentario_calificacion && <span style={{ color: 'var(--ink-light)' }}>{e.comentario_calificacion}</span>}
                      </div>
                    : <div style={{ marginTop: '.4rem' }}><span className="chip chip-gold">Sin calificar</span></div>
                  }
                </div>
                <div style={{ display: 'flex', gap: '.5rem', flexDirection: 'column' }}>
                  <button className="btn btn-outline" style={{ fontSize: '.76rem' }}
                    onClick={() => setModalVerEntrega(e.id)}>
                    Ver documento
                  </button>
                  <button className="btn btn-primary" style={{ fontSize: '.76rem' }}
                    onClick={() => { setModalCalificar(e); setCalForm({ calificacion: e.calificacion || '', comentario_calificacion: e.comentario_calificacion || '' }); }}>
                    {e.calificacion !== null ? 'Editar nota' : 'Calificar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal: ver documento Word del estudiante */}
      <Modal open={!!modalVerEntrega} onClose={() => setModalVerEntrega(null)} title="Documento del estudiante" maxWidth="820px">
        {modalVerEntrega && <VisorEntrega entregaId={modalVerEntrega} />}
      </Modal>

      {/* Modal: calificar entrega */}
      <Modal open={!!modalCalificar} onClose={() => setModalCalificar(null)} title="Calificar entrega" maxWidth="480px">
        {modalCalificar && (
          <form onSubmit={guardarCalificacion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '.75rem 1rem', background: 'var(--paper-dark)', borderRadius: '2px', fontSize: '.88rem' }}>
              <strong>{modalCalificar.nombre} {modalCalificar.apellido}</strong>
            </div>
            <div>
              <label className="label">Calificación (0 – 100) *</label>
              <input type="number" className="input" min="0" max="100" step="0.01"
                value={calForm.calificacion}
                onChange={e => setCalForm(f => ({ ...f, calificacion: e.target.value }))}
                required />
            </div>
            <div>
              <label className="label">Comentario (opcional)</label>
              <textarea className="input" rows={3} value={calForm.comentario_calificacion}
                onChange={e => setCalForm(f => ({ ...f, comentario_calificacion: e.target.value }))}
                placeholder="Observaciones sobre la entrega..." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setModalCalificar(null)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar calificación</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
