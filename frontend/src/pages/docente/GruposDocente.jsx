import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const formatFecha = (val) => {
  if (!val) return '—';
  const [y, m, d] = String(val).split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

export default function DocenteGruposTrabajo() {
  const [materias, setMaterias] = useState([]);
  const [tareasPorMateria, setTareasPorMateria] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [filtroMateria, setFiltroMateria] = useState('');
  const [estudiantesPorMateria, setEstudiantesPorMateria] = useState([]);
  const [loading, setLoading] = useState(false);

  // modal crear grupo
  const [modalCrear, setModalCrear] = useState(false);
  const [formGrupo, setFormGrupo] = useState({ materia_id: '', nombre: '', descripcion: '' });
  const [saving, setSaving] = useState(false);

  // modal gestionar grupo
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [modalGestion, setModalGestion] = useState(false);
  const [tabGestion, setTabGestion] = useState('miembros'); // 'miembros' | 'tareas'
  const [miembrosSeleccionados, setMiembrosSeleccionados] = useState([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState('');
  const [savingGestion, setSavingGestion] = useState(false);

  const cargar = async (materia_id) => {
    setLoading(true);
    try {
      const params = materia_id ? { materia_id } : {};
      const r = await api.get('/docente/grupos-trabajo', { params });
      setGrupos(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/docente/materias').then(r => setMaterias(r.data));
    cargar('');
  }, []);

  useEffect(() => {
    cargar(filtroMateria);
    if (filtroMateria) {
      api.get(`/docente/materias/${filtroMateria}/estudiantes`)
        .then(r => setEstudiantesPorMateria(r.data))
        .catch(() => setEstudiantesPorMateria([]));
      api.get('/docente/tareas', { params: { materia_id: filtroMateria } })
        .then(r => setTareasPorMateria(r.data))
        .catch(() => setTareasPorMateria([]));
    } else {
      setEstudiantesPorMateria([]);
      setTareasPorMateria([]);
    }
  }, [filtroMateria]);

  const abrirModalCrear = () => {
    setFormGrupo({ materia_id: filtroMateria, nombre: '', descripcion: '' });
    setModalCrear(true);
  };

  const guardarGrupo = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/docente/grupos-trabajo', formGrupo);
      setModalCrear(false);
      cargar(filtroMateria);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear el grupo');
    } finally {
      setSaving(false);
    }
  };

  const eliminarGrupo = async (id) => {
    if (!window.confirm('¿Eliminar este grupo? Se perderán los miembros y tareas asignadas.')) return;
    try {
      await api.delete(`/docente/grupos-trabajo/${id}`);
      cargar(filtroMateria);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const abrirGestion = async (grupo) => {
    setGrupoActivo(grupo);
    setTabGestion('miembros');
    setMiembrosSeleccionados([]);
    setTareaSeleccionada('');
    // cargar estudiantes y tareas de la materia del grupo
    const [estRes, tarRes] = await Promise.allSettled([
      api.get(`/docente/materias/${grupo.materia_id}/estudiantes`),
      api.get('/docente/tareas', { params: { materia_id: grupo.materia_id } })
    ]);
    if (estRes.status === 'fulfilled') setEstudiantesPorMateria(estRes.value.data);
    if (tarRes.status === 'fulfilled') setTareasPorMateria(tarRes.value.data);
    setModalGestion(true);
  };

  const toggleMiembro = (id) => {
    setMiembrosSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const agregarMiembros = async () => {
    if (!miembrosSeleccionados.length) return;
    setSavingGestion(true);
    try {
      await api.post(`/docente/grupos-trabajo/${grupoActivo.id}/miembros`, {
        estudiante_ids: miembrosSeleccionados
      });
      setMiembrosSeleccionados([]);
      const r = await api.get('/docente/grupos-trabajo', { params: filtroMateria ? { materia_id: filtroMateria } : {} });
      setGrupos(r.data);
      setGrupoActivo(r.data.find(g => g.id === grupoActivo.id) || null);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al agregar miembros');
    } finally {
      setSavingGestion(false);
    }
  };

  const removerMiembro = async (estudianteId) => {
    try {
      await api.delete(`/docente/grupos-trabajo/${grupoActivo.id}/miembros/${estudianteId}`);
      const r = await api.get('/docente/grupos-trabajo', { params: filtroMateria ? { materia_id: filtroMateria } : {} });
      setGrupos(r.data);
      setGrupoActivo(r.data.find(g => g.id === grupoActivo.id) || null);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al remover miembro');
    }
  };

  const asignarTarea = async () => {
    if (!tareaSeleccionada) return;
    setSavingGestion(true);
    try {
      await api.post(`/docente/grupos-trabajo/${grupoActivo.id}/tareas`, { tarea_id: tareaSeleccionada });
      setTareaSeleccionada('');
      const r = await api.get('/docente/grupos-trabajo', { params: filtroMateria ? { materia_id: filtroMateria } : {} });
      setGrupos(r.data);
      setGrupoActivo(r.data.find(g => g.id === grupoActivo.id) || null);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al asignar tarea');
    } finally {
      setSavingGestion(false);
    }
  };

  const removerTarea = async (tareaId) => {
    try {
      await api.delete(`/docente/grupos-trabajo/${grupoActivo.id}/tareas/${tareaId}`);
      const r = await api.get('/docente/grupos-trabajo', { params: filtroMateria ? { materia_id: filtroMateria } : {} });
      setGrupos(r.data);
      setGrupoActivo(r.data.find(g => g.id === grupoActivo.id) || null);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al remover tarea');
    }
  };

  const gruposFiltrados = filtroMateria
    ? grupos.filter(g => String(g.materia_id) === filtroMateria)
    : grupos;

  // Estudiantes que no están en el grupo activo
  const estudiantesDisponibles = grupoActivo
    ? estudiantesPorMateria.filter(e => !grupoActivo.miembros.some(m => m.estudiante_id === e.id))
    : estudiantesPorMateria;

  // Tareas que no están asignadas al grupo activo
  const tareasDisponibles = grupoActivo
    ? tareasPorMateria.filter(t => !grupoActivo.tareas.some(ta => ta.id === t.id))
    : tareasPorMateria;

  return (
    <>
      <PageHeader
        num="09"
        eyebrow="Gestión académica"
        title={<>Grupos de <span className="display-italic">trabajo</span></>}
        lead="Cree grupos por materia, asigne estudiantes y defina qué tareas corresponden a cada grupo."
        actions={
          <button className="btn btn-primary" onClick={abrirModalCrear}>
            + Nuevo grupo
          </button>
        }
      />

      {/* Filtro materia */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <select
          className="form-input"
          value={filtroMateria}
          onChange={e => setFiltroMateria(e.target.value)}
          style={{ maxWidth: '360px' }}
        >
          <option value="">Todas las materias</option>
          {materias.map(m => (
            <option key={m.id} value={m.id}>{m.nombre} — Grupo {m.grupo}</option>
          ))}
        </select>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', color: 'var(--ink-light)', letterSpacing: '.06em' }}>
          {gruposFiltrados.length} {gruposFiltrados.length === 1 ? 'grupo' : 'grupos'}
        </span>
      </div>

      {/* Estado vacío */}
      {!loading && gruposFiltrados.length === 0 && (
        <div style={{ padding: '5rem 2rem', textAlign: 'center', border: '1px dashed var(--line-strong)', borderRadius: '4px', background: 'var(--paper-light)' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--ink-xlight)', marginBottom: '.5rem' }}>
            Sin grupos creados
          </div>
          <div style={{ fontSize: '.85rem', color: 'var(--ink-light)' }}>
            Use <strong>+ Nuevo grupo</strong> para crear el primero.
          </div>
        </div>
      )}

      {loading && (
        <p style={{ color: 'var(--ink-light)', fontStyle: 'italic' }}>Cargando grupos...</p>
      )}

      {/* Lista de grupos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {gruposFiltrados.map((g, i) => (
          <div key={g.id} className="card" style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: '1.5rem', alignItems: 'start', padding: '1.5rem 1.75rem' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.75rem', color: 'var(--ink-xlight)', fontStyle: 'italic', lineHeight: 1 }}>
              {String(i + 1).padStart(2, '0')}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', color: 'var(--gold-dark)', letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: '.4rem' }}>
                {g.materia_codigo} · {g.materia_nombre} — Grupo {g.materia_grupo}
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '.3rem' }}>
                {g.nombre}
              </div>
              {g.descripcion && (
                <p style={{ fontSize: '.875rem', color: 'var(--ink-light)', marginBottom: '.75rem', lineHeight: 1.55 }}>
                  {g.descripcion}
                </p>
              )}

              {/* Miembros */}
              <div style={{ marginBottom: '.75rem' }}>
                <div style={{ fontSize: '.72rem', fontFamily: 'var(--mono)', color: 'var(--ink-light)', letterSpacing: '.06em', marginBottom: '.4rem' }}>
                  MIEMBROS ({g.miembros.length})
                </div>
                {g.miembros.length === 0 ? (
                  <span style={{ fontSize: '.8rem', color: 'var(--ink-xlight)', fontStyle: 'italic' }}>Sin miembros asignados</span>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                    {g.miembros.map(m => (
                      <span key={m.estudiante_id} style={{ padding: '.25rem .65rem', background: 'var(--paper-dark)', borderRadius: '20px', fontSize: '.78rem', border: '1px solid var(--line)' }}>
                        {m.nombre} {m.apellido}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tareas */}
              <div>
                <div style={{ fontSize: '.72rem', fontFamily: 'var(--mono)', color: 'var(--ink-light)', letterSpacing: '.06em', marginBottom: '.4rem' }}>
                  TAREAS ASIGNADAS ({g.tareas.length})
                </div>
                {g.tareas.length === 0 ? (
                  <span style={{ fontSize: '.8rem', color: 'var(--ink-xlight)', fontStyle: 'italic' }}>Sin tareas asignadas</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                    {g.tareas.map(t => (
                      <div key={t.id} style={{ fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue-500)', flexShrink: 0 }} />
                        <span>{t.titulo}</span>
                        {t.fecha_entrega && (
                          <span style={{ fontSize: '.72rem', color: 'var(--ink-light)', fontFamily: 'var(--mono)' }}>
                            · {formatFecha(t.fecha_entrega)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={() => abrirGestion(g)}>
                Gestionar
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--crimson)', borderColor: 'var(--crimson)' }}
                onClick={() => eliminarGrupo(g.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal: crear grupo ─────────────────────────────────────────────── */}
      <Modal open={modalCrear} onClose={() => setModalCrear(false)} title="Nuevo grupo de trabajo" maxWidth="560px">
        <form onSubmit={guardarGrupo}>
          <div style={{ display: 'grid', gap: '1.1rem' }}>
            <div>
              <label className="form-label">Materia *</label>
              <select
                className="form-input"
                value={formGrupo.materia_id}
                onChange={e => setFormGrupo(f => ({ ...f, materia_id: e.target.value }))}
                required
              >
                <option value="">Seleccione una materia</option>
                {materias.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre} — Grupo {m.grupo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Nombre del grupo *</label>
              <input
                className="form-input"
                value={formGrupo.nombre}
                onChange={e => setFormGrupo(f => ({ ...f, nombre: e.target.value }))}
                required
                placeholder="Ej: Grupo Alpha"
              />
            </div>
            <div>
              <label className="form-label">Descripción <span style={{ fontWeight: 400, color: 'var(--ink-light)' }}>(opcional)</span></label>
              <textarea
                className="form-input"
                rows={2}
                value={formGrupo.descripcion}
                onChange={e => setFormGrupo(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Tema o descripción del grupo..."
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', marginTop: '1.5rem', paddingTop: '1.1rem', borderTop: '1px solid var(--line)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalCrear(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear grupo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: gestionar grupo ─────────────────────────────────────────── */}
      <Modal open={modalGestion && !!grupoActivo} onClose={() => setModalGestion(false)} title={`Gestionar — ${grupoActivo?.nombre || ''}`} maxWidth="640px">
        {grupoActivo && (
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--line)', marginBottom: '1.25rem' }}>
              {['miembros', 'tareas'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setTabGestion(tab)}
                  style={{
                    padding: '.6rem 1.2rem',
                    background: 'none',
                    border: 'none',
                    borderBottom: tabGestion === tab ? '2px solid var(--ink)' : '2px solid transparent',
                    fontFamily: 'var(--mono)',
                    fontSize: '.8rem',
                    letterSpacing: '.07em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    color: tabGestion === tab ? 'var(--ink)' : 'var(--ink-light)',
                    fontWeight: tabGestion === tab ? 700 : 400,
                    marginBottom: '-1px'
                  }}
                >
                  {tab === 'miembros' ? `Miembros (${grupoActivo.miembros.length})` : `Tareas (${grupoActivo.tareas.length})`}
                </button>
              ))}
            </div>

            {/* Tab: Miembros */}
            {tabGestion === 'miembros' && (
              <div>
                {/* Miembros actuales */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '.72rem', fontFamily: 'var(--mono)', color: 'var(--ink-light)', letterSpacing: '.06em', marginBottom: '.6rem' }}>
                    MIEMBROS ACTUALES
                  </div>
                  {grupoActivo.miembros.length === 0 ? (
                    <p style={{ fontSize: '.85rem', color: 'var(--ink-xlight)', fontStyle: 'italic' }}>Sin miembros aún.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                      {grupoActivo.miembros.map(m => (
                        <div key={m.estudiante_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.5rem .75rem', background: 'var(--paper-dark)', borderRadius: '2px' }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{m.nombre} {m.apellido}</span>
                            <span className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)', marginLeft: '.5rem' }}>{m.codigo_estudiante}</span>
                          </div>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: '.75rem', color: 'var(--crimson)', padding: '.2rem .5rem' }}
                            onClick={() => removerMiembro(m.estudiante_id)}
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Agregar miembros */}
                {estudiantesDisponibles.length > 0 && (
                  <div>
                    <div style={{ fontSize: '.72rem', fontFamily: 'var(--mono)', color: 'var(--ink-light)', letterSpacing: '.06em', marginBottom: '.6rem' }}>
                      AGREGAR ESTUDIANTES
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--line)', borderRadius: '2px', padding: '.25rem' }}>
                      {estudiantesDisponibles.map(e => (
                        <label
                          key={e.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.5rem .75rem', cursor: 'pointer', borderRadius: '2px', background: miembrosSeleccionados.includes(e.id) ? 'var(--paper-dark)' : 'transparent' }}
                        >
                          <input
                            type="checkbox"
                            checked={miembrosSeleccionados.includes(e.id)}
                            onChange={() => toggleMiembro(e.id)}
                            style={{ accentColor: 'var(--ink)' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '.87rem' }}>{e.nombre} {e.apellido}</div>
                            <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)' }}>{e.codigo_estudiante}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '.75rem' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={!miembrosSeleccionados.length || savingGestion}
                        onClick={agregarMiembros}
                      >
                        {savingGestion ? 'Agregando...' : `Agregar ${miembrosSeleccionados.length || ''} seleccionado(s)`}
                      </button>
                    </div>
                  </div>
                )}
                {estudiantesDisponibles.length === 0 && grupoActivo.miembros.length > 0 && (
                  <p style={{ fontSize: '.82rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>Todos los estudiantes de la materia ya están en el grupo.</p>
                )}
              </div>
            )}

            {/* Tab: Tareas */}
            {tabGestion === 'tareas' && (
              <div>
                {/* Tareas asignadas */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '.72rem', fontFamily: 'var(--mono)', color: 'var(--ink-light)', letterSpacing: '.06em', marginBottom: '.6rem' }}>
                    TAREAS ASIGNADAS
                  </div>
                  {grupoActivo.tareas.length === 0 ? (
                    <p style={{ fontSize: '.85rem', color: 'var(--ink-xlight)', fontStyle: 'italic' }}>Sin tareas asignadas aún.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                      {grupoActivo.tareas.map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.5rem .75rem', background: 'var(--paper-dark)', borderRadius: '2px' }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{t.titulo}</span>
                            {t.fecha_entrega && (
                              <span className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)', marginLeft: '.5rem' }}>
                                Entrega: {formatFecha(t.fecha_entrega)}
                              </span>
                            )}
                          </div>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: '.75rem', color: 'var(--crimson)', padding: '.2rem .5rem' }}
                            onClick={() => removerTarea(t.id)}
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Asignar tarea */}
                {tareasDisponibles.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '.72rem', fontFamily: 'var(--mono)', color: 'var(--ink-light)', letterSpacing: '.06em', marginBottom: '.6rem' }}>
                      ASIGNAR TAREA
                    </div>
                    <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                      <select
                        className="form-input"
                        value={tareaSeleccionada}
                        onChange={e => setTareaSeleccionada(e.target.value)}
                        style={{ flex: 1 }}
                      >
                        <option value="">Seleccione una tarea...</option>
                        {tareasDisponibles.map(t => (
                          <option key={t.id} value={t.id}>{t.titulo}</option>
                        ))}
                      </select>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={!tareaSeleccionada || savingGestion}
                        onClick={asignarTarea}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {savingGestion ? '...' : 'Asignar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '.82rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
                    {tareasPorMateria.length === 0
                      ? 'No hay tareas creadas para esta materia. Créelas desde "Tareas del curso".'
                      : 'Todas las tareas de la materia ya están asignadas a este grupo.'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
