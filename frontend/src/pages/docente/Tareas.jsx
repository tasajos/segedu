import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import mammoth from 'mammoth';

const TIPO_CHIP = { pdf: 'chip-crimson', pptx: 'chip-gold', word: 'chip-ink' };

const formatFecha = (val) => {
  if (!val) return '—';
  const [y, m, d] = String(val).split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

// ── Visor de archivo de tarea (PDF o PPTX) ───────────────────────────────────
function VisorArchivo({ tareaId, tipoArchivo, apiBase }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [slides, setSlides] = useState(null);
  const [wordHtml, setWordHtml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setPdfUrl(null); setSlides(null); setWordHtml(null); setLoading(true); setError('');
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
    } else if (tipoArchivo === 'word') {
      api.get(`${apiBase}/tareas/${tareaId}/ver`, { responseType: 'arraybuffer' })
        .then(r => mammoth.convertToHtml({ arrayBuffer: r.data }))
        .then(result => setWordHtml(result.value))
        .catch(() => setError('No se pudo cargar el documento Word.'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false); setError('Tipo de archivo no soportado.');
    }
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [tareaId, tipoArchivo]);

  if (loading) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--ink-light)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
      Cargando archivo...
    </div>
  );
  if (error) return <div style={{ padding: '2rem', color: 'var(--crimson)' }}>{error}</div>;

  if (tipoArchivo === 'word' && wordHtml) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: wordHtml }}
        onContextMenu={e => e.preventDefault()}
        style={{ maxHeight: '72vh', overflowY: 'auto', padding: '1.5rem 2rem', background: '#fff', borderRadius: '4px', lineHeight: 1.8, color: '#111' }}
      />
    );
  }

  if (tipoArchivo === 'pdf' && pdfUrl) {
    return (
      <div style={{ position: 'relative', height: '72vh', userSelect: 'none', borderRadius: '4px', overflow: 'hidden' }}>
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Visor PDF"
        />
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }} onContextMenu={e => e.preventDefault()} />
      </div>
    );
  }

  if (tipoArchivo === 'pptx' && slides) {
    if (!slides.length) return <p style={{ color: 'var(--ink-light)' }}>No se encontraron diapositivas.</p>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '72vh', overflowY: 'auto', padding: '.25rem' }}>
        {slides.map(s => (
          <div key={s.numero} style={{ background: '#1e1e2e', color: '#e8e8f0', borderRadius: '6px', padding: '1.5rem 2rem', minHeight: '140px' }}>
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

// ── Visor de entrega Word ─────────────────────────────────────────────────────
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

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)' }}>Cargando documento...</div>;
  if (error) return <div style={{ color: 'var(--crimson)', padding: '1rem' }}>{error}</div>;
  return (
    <div
      className="word-preview"
      dangerouslySetInnerHTML={{ __html: html }}
      onContextMenu={e => e.preventDefault()}
      style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1.5rem', background: '#fff', borderRadius: '4px', lineHeight: 1.8, color: '#111' }}
    />
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DocenteTareas() {
  const [materias, setMaterias] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [filtroMateria, setFiltroMateria] = useState('');
  const [entregas, setEntregas] = useState([]);

  const [errorCarga, setErrorCarga] = useState('');
  const [modalNueva, setModalNueva] = useState(false);
  const [modalVisor, setModalVisor] = useState(null);
  const [modalEntregas, setModalEntregas] = useState(null);
  const [modalCalificar, setModalCalificar] = useState(null);
  const [modalVerEntrega, setModalVerEntrega] = useState(null);

  const [form, setForm] = useState({ materia_id: '', titulo: '', descripcion: '', fecha_entrega: '' });
  const [archivo, setArchivo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [calForm, setCalForm] = useState({ calificacion: '', comentario_calificacion: '' });

  const cargar = async () => {
    setErrorCarga('');
    const [resM, resT] = await Promise.allSettled([
      api.get('/docente/materias'),
      api.get('/docente/tareas', { params: filtroMateria ? { materia_id: filtroMateria } : {} })
    ]);
    if (resM.status === 'fulfilled') setMaterias(resM.value.data);
    if (resT.status === 'fulfilled') setTareas(resT.value.data);
    const errores = [resM, resT]
      .filter(r => r.status === 'rejected')
      .map(r => r.reason?.response?.data?.error || r.reason?.message)
      .filter(Boolean);
    if (errores.length) setErrorCarga(errores.join(' · '));
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
    } finally { setSaving(false); }
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
        lead="Asigne tareas a todo el curso. Adjunte materiales en PDF o PPTX para que los estudiantes los consulten directamente en el sistema."
        actions={<button className="btn btn-primary" onClick={() => setModalNueva(true)}>+ Nueva tarea</button>}
      />

      {errorCarga && (
        <div style={{ padding: '.85rem 1.1rem', background: '#fff0f0', border: '1px solid #fca5a5', borderLeft: '3px solid var(--crimson)', borderRadius: '4px', color: 'var(--crimson)', fontSize: '.88rem', marginBottom: '1.5rem' }}>
          {errorCarga}
        </div>
      )}

      {/* Filtro */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <select
          className="form-input"
          value={filtroMateria}
          onChange={e => setFiltroMateria(e.target.value)}
          style={{ maxWidth: '340px' }}
        >
          <option value="">Todas las materias</option>
          {materias.map(m => (
            <option key={m.id} value={m.id}>{m.nombre} — Grupo {m.grupo}</option>
          ))}
        </select>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', color: 'var(--ink-light)', letterSpacing: '.06em' }}>
          {tareasFiltradas.length} {tareasFiltradas.length === 1 ? 'tarea' : 'tareas'}
        </span>
      </div>

      {/* Estado vacío */}
      {tareasFiltradas.length === 0 && (
        <div style={{
          padding: '5rem 2rem',
          textAlign: 'center',
          border: '1px dashed var(--line-strong)',
          borderRadius: '4px',
          background: 'var(--paper-light)'
        }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--ink-xlight)', marginBottom: '.5rem' }}>
            Sin tareas registradas
          </div>
          <div style={{ fontSize: '.85rem', color: 'var(--ink-light)' }}>
            Use el botón <strong>+ Nueva tarea</strong> para crear la primera.
          </div>
        </div>
      )}

      {/* Lista de tareas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tareasFiltradas.map((t, i) => {
          const pct = t.total_inscritos > 0
            ? Math.round((t.total_entregas / t.total_inscritos) * 100)
            : 0;
          const hayNuevas = t.total_nuevas > 0;

          return (
            <div key={t.id} className="card" style={{
              display: 'grid',
              gridTemplateColumns: '52px 1fr auto',
              gap: '1.5rem',
              alignItems: 'start',
              padding: '1.5rem 1.75rem'
            }}>
              {/* Número */}
              <div style={{
                fontFamily: 'var(--serif)',
                fontSize: '1.75rem',
                color: 'var(--ink-xlight)',
                fontStyle: 'italic',
                lineHeight: 1,
                paddingTop: '.15rem'
              }}>
                {String(i + 1).padStart(2, '0')}
              </div>

              {/* Contenido */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '.68rem',
                  color: 'var(--gold-dark)',
                  letterSpacing: '.09em',
                  textTransform: 'uppercase',
                  marginBottom: '.4rem'
                }}>
                  {t.materia_codigo} · {t.materia_nombre} — Grupo {t.materia_grupo}
                </div>

                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '.35rem' }}>
                  {t.titulo}
                </div>

                {t.descripcion && (
                  <p style={{ fontSize: '.875rem', color: 'var(--ink-light)', marginBottom: '.75rem', lineHeight: 1.55 }}>
                    {t.descripcion}
                  </p>
                )}

                {/* Meta row */}
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '.9rem' }}>
                  {t.fecha_entrega && (
                    <span style={{ fontSize: '.8rem', color: 'var(--ink-light)' }}>
                      Entrega: <strong style={{ color: 'var(--ink)' }}>{formatFecha(t.fecha_entrega)}</strong>
                    </span>
                  )}
                  {t.tipo_archivo && (
                    <span className={`chip ${TIPO_CHIP[t.tipo_archivo] || 'chip-ink'}`}>
                      {t.tipo_archivo.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Barra de progreso entregas */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.35rem' }}>
                    <span style={{ fontSize: '.75rem', color: 'var(--ink-light)', fontFamily: 'var(--mono)' }}>
                      Entregas
                    </span>
                    <span style={{ fontSize: '.75rem', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                      {t.total_entregas} / {t.total_inscritos}
                    </span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--line)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: pct === 100 ? 'var(--forest)' : 'var(--blue-500)',
                      borderRadius: '999px',
                      transition: 'width .4s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'flex-end', paddingTop: '.1rem' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => abrirEntregas(t)}
                  style={{ whiteSpace: 'nowrap', position: 'relative' }}
                >
                  Entregas ({t.total_entregas})
                  {hayNuevas && (
                    <span style={{
                      position: 'absolute', top: '-7px', right: '-7px',
                      background: 'var(--crimson)', color: '#fff',
                      borderRadius: '999px', fontSize: '.62rem', fontWeight: 700,
                      minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px', lineHeight: 1
                    }}>
                      {t.total_nuevas}
                    </span>
                  )}
                </button>
                {t.archivo_path && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setModalVisor({ tareaId: t.id, tipo: t.tipo_archivo, titulo: t.titulo })}
                  >
                    Ver material
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--crimson)', borderColor: 'var(--crimson)' }}
                  onClick={() => eliminarTarea(t.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal: nueva tarea ─────────────────────────────────────────────── */}
      <Modal open={modalNueva} onClose={() => setModalNueva(false)} title="Nueva tarea" maxWidth="640px">
        <form onSubmit={guardarTarea}>
          <div style={{ display: 'grid', gap: '1.1rem' }}>

            <div>
              <label className="form-label">Materia *</label>
              <select
                className="form-input"
                value={form.materia_id}
                onChange={e => setForm(f => ({ ...f, materia_id: e.target.value }))}
                required
              >
                <option value="">Seleccione una materia</option>
                {materias.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre} — Grupo {m.grupo}</option>
                ))}
              </select>
              {materias.length === 0 && (
                <div style={{ fontSize: '.78rem', color: 'var(--crimson)', marginTop: '.4rem' }}>
                  No tiene materias asignadas. El administrador debe asignarle materias desde el panel de Materias.
                </div>
              )}
            </div>

            <div>
              <label className="form-label">Título *</label>
              <input
                className="form-input"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                required
                placeholder="Ej: Tarea 1 — Fundamentos de redes"
              />
            </div>

            <div>
              <label className="form-label">Descripción / instrucciones</label>
              <textarea
                className="form-input"
                rows={3}
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Detalle lo que deben hacer los estudiantes..."
                style={{ resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            <div>
              <label className="form-label">Fecha de entrega</label>
              <input
                type="date"
                className="form-input"
                value={form.fecha_entrega}
                onChange={e => setForm(f => ({ ...f, fecha_entrega: e.target.value }))}
              />
            </div>

            <div>
              <label className="form-label">Material de apoyo <span style={{ fontWeight: 400, color: 'var(--ink-light)' }}>(PDF o PPTX, opcional)</span></label>
              <div style={{
                border: '1.5px dashed var(--line-strong)',
                borderRadius: '4px',
                padding: '1.1rem 1.25rem',
                background: 'var(--paper-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <label style={{ cursor: 'pointer' }}>
                  <span className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none' }}>
                    Seleccionar archivo
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.pptx,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={e => setArchivo(e.target.files[0] || null)}
                  />
                </label>
                <span style={{ fontSize: '.83rem', color: archivo ? 'var(--ink)' : 'var(--ink-light)' }}>
                  {archivo ? archivo.name : 'Ningún archivo seleccionado'}
                </span>
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--ink-light)', marginTop: '.4rem', fontFamily: 'var(--mono)' }}>
                PDF, PPTX o Word (DOC/DOCX) · Los estudiantes podrán verlo pero no descargarlo
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--line)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalNueva(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: visor de material ───────────────────────────────────────── */}
      <Modal open={!!modalVisor} onClose={() => setModalVisor(null)} title={modalVisor?.titulo || 'Material de tarea'} maxWidth="900px">
        {modalVisor && (
          <VisorArchivo tareaId={modalVisor.tareaId} tipoArchivo={modalVisor.tipo} apiBase="/docente" />
        )}
      </Modal>

      {/* ── Modal: entregas de estudiantes ────────────────────────────────── */}
      <Modal open={!!modalEntregas} onClose={() => setModalEntregas(null)} title={`Entregas — ${modalEntregas?.titulo || ''}`} maxWidth="820px">
        {modalEntregas && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', maxHeight: '65vh', overflowY: 'auto' }}>
            {entregas.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)', fontStyle: 'italic' }}>
                Sin entregas aún.
              </div>
            )}
            {entregas.map(e => (
              <div key={e.id} style={{
                padding: '1rem 1.25rem',
                background: 'var(--paper-dark)',
                borderRadius: '4px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '1rem',
                alignItems: 'center',
                borderLeft: `3px solid ${e.calificacion !== null ? 'var(--forest)' : 'var(--line-strong)'}`
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--serif)', fontSize: '.98rem', marginBottom: '.2rem' }}>
                    {e.nombre} {e.apellido}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', color: 'var(--ink-light)', marginBottom: '.5rem' }}>
                    {e.codigo_estudiante} · {formatFecha(e.fecha_entrega?.split('T')[0])}
                    {e.nombre_grupo && <> · Grupo: <strong>{e.nombre_grupo}</strong></>}
                  </div>
                  {e.calificacion !== null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <span className="chip chip-forest">{e.calificacion} pts</span>
                      {e.comentario_calificacion && (
                        <span style={{ fontSize: '.82rem', color: 'var(--ink-light)' }}>{e.comentario_calificacion}</span>
                      )}
                    </div>
                  ) : (
                    <span className="chip chip-gold">Sin calificar</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '.5rem', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setModalVerEntrega(e.id)}>
                      Ver
                    </button>
                    <button className="btn btn-secondary btn-sm"
                      onClick={async () => {
                        const r = await api.get(`/docente/entregas/${e.id}/descargar`, { responseType: 'blob' });
                        const url = URL.createObjectURL(r.data);
                        const a = document.createElement('a');
                        a.href = url; a.download = e.archivo_nombre || 'entrega.docx';
                        a.click(); URL.revokeObjectURL(url);
                      }}
                      title="Descargar documento Word"
                    >
                      ↓ Descargar
                    </button>
                  </div>
                  <button className="btn btn-primary btn-sm"
                    onClick={() => { setModalCalificar(e); setCalForm({ calificacion: e.calificacion || '', comentario_calificacion: e.comentario_calificacion || '' }); }}>
                    {e.calificacion !== null ? 'Editar nota' : 'Calificar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Modal: ver documento Word ──────────────────────────────────────── */}
      <Modal open={!!modalVerEntrega} onClose={() => setModalVerEntrega(null)} title="Documento del estudiante" maxWidth="820px">
        {modalVerEntrega && <VisorEntrega entregaId={modalVerEntrega} />}
      </Modal>

      {/* ── Modal: calificar entrega ───────────────────────────────────────── */}
      <Modal open={!!modalCalificar} onClose={() => setModalCalificar(null)} title="Calificar entrega" maxWidth="480px">
        {modalCalificar && (
          <form onSubmit={guardarCalificacion}>
            <div style={{ padding: '.9rem 1.1rem', background: 'var(--paper-dark)', borderRadius: '4px', marginBottom: '1.25rem', borderLeft: '3px solid var(--blue-500)' }}>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1rem' }}>
                {modalCalificar.nombre} {modalCalificar.apellido}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                {modalCalificar.codigo_estudiante}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label className="form-label">Calificación (0 – 100) *</label>
                <input
                  type="number"
                  className="form-input"
                  min="0" max="100" step="0.01"
                  value={calForm.calificacion}
                  onChange={e => setCalForm(f => ({ ...f, calificacion: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="form-label">Comentario <span style={{ fontWeight: 400, color: 'var(--ink-light)' }}>(opcional)</span></label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={calForm.comentario_calificacion}
                  onChange={e => setCalForm(f => ({ ...f, comentario_calificacion: e.target.value }))}
                  placeholder="Observaciones sobre la entrega..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', marginTop: '1.5rem', paddingTop: '1.1rem', borderTop: '1px solid var(--line)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalCalificar(null)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar calificación</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
