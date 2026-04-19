import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const getTodayLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const groupTasksByMateria = (tasks) => {
  const grouped = new Map();

  tasks.forEach((task) => {
    const materiaKey = String(task.materia_id);
    if (!grouped.has(materiaKey)) {
      grouped.set(materiaKey, {
        materia_id: task.materia_id,
        materia_nombre: task.materia_nombre,
        materia_codigo: task.materia_codigo,
        materia_grupo: task.materia_grupo,
        periodo: task.periodo,
        tasks: []
      });
    }

    grouped.get(materiaKey).tasks.push(task);
  });

  return Array.from(grouped.values()).map((materia) => {
    const units = new Map();

    materia.tasks.forEach((task) => {
      const unitKey = `${task.unidad_codigo}-${task.unidad_nombre}`;
      if (!units.has(unitKey)) {
        units.set(unitKey, {
          unidad_codigo: task.unidad_codigo,
          unidad_nombre: task.unidad_nombre,
          tasks: []
        });
      }
      units.get(unitKey).tasks.push(task);
    });

    return {
      ...materia,
      total: materia.tasks.length,
      completadas: materia.tasks.filter((task) => task.estado === 'completado').length,
      units: Array.from(units.values())
    };
  });
};

export default function DocenteAvance() {
  const [avances, setAvances] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState(null);
  const [form, setForm] = useState({
    materia_id: '',
    tema: '',
    descripcion: '',
    porcentaje_avance: 0,
    fecha: getTodayLocal()
  });

  const cargar = async () => {
    const params = filter ? { materia_id: filter } : {};
    const [avanceRes, materiasRes, tareasRes] = await Promise.all([
      api.get('/docente/avance', { params }),
      api.get('/docente/materias'),
      api.get('/docente/pgo-tareas', { params })
    ]);

    setAvances(avanceRes.data);
    setMaterias(materiasRes.data);
    setTareas(tareasRes.data);
  };

  useEffect(() => {
    cargar();
  }, [filter]);

  const guardar = async (e) => {
    e.preventDefault();
    await api.post('/docente/avance', form);
    setOpen(false);
    setForm({ materia_id: '', tema: '', descripcion: '', porcentaje_avance: 0, fecha: getTodayLocal() });
    cargar();
  };

  const toggleTask = async (task) => {
    setSavingTaskId(task.id);
    try {
      await api.put(`/docente/pgo-tareas/${task.id}`, { completed: task.estado !== 'completado' });
      await cargar();
    } finally {
      setSavingTaskId(null);
    }
  };

  const tareasPorMateria = useMemo(() => groupTasksByMateria(tareas), [tareas]);

  const progresoMateria = useMemo(() => {
    const taskStats = new Map(
      tareasPorMateria.map((materia) => [
        String(materia.materia_id),
        {
          total: materia.total,
          completadas: materia.completadas,
          porcentaje: materia.total ? Math.round((materia.completadas * 100) / materia.total) : 0
        }
      ])
    );

    return materias.map((materia) => {
      const registros = avances.filter((item) => String(item.materia_id) === String(materia.id));
      const maxAvance = registros.length > 0 ? Math.max(...registros.map((item) => Number(item.porcentaje_avance || 0))) : 0;
      const taskMeta = taskStats.get(String(materia.id));
      const porcentaje = taskMeta ? taskMeta.porcentaje : maxAvance;
      const color = porcentaje >= 80 ? 'var(--forest)' : porcentaje >= 50 ? 'var(--gold-dark)' : 'var(--crimson)';

      return {
        ...materia,
        porcentaje,
        color,
        registros: registros.length,
        taskMeta
      };
    });
  }, [avances, materias, tareasPorMateria]);

  return (
    <>
      <PageHeader
        num="03"
        eyebrow="Seguimiento curricular"
        title={<>Avance de <span className="display-italic">materia</span></>}
        lead="Registre el avance tematico de cada materia. Cuando un PGO es aprobado, sus contenidos se convierten en tareas para seguir el cumplimiento del plan."
        actions={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Marcar avance</button>}
      />

      {progresoMateria.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {progresoMateria.map((materia) => (
            <div
              key={materia.id}
              style={{
                padding: '1.25rem',
                borderRadius: '18px',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(246,248,252,0.96) 100%)',
                border: '1px solid var(--line)',
                boxShadow: '0 18px 38px -34px rgba(15, 23, 42, 0.45)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.6rem', gap: '1rem' }}>
                <div>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 600 }}>{materia.nombre}</span>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                    {materia.codigo} - Grupo {materia.grupo}
                  </div>
                </div>
                <span className="text-mono" style={{ fontSize: '.9rem', color: materia.color, fontWeight: 700 }}>{materia.porcentaje}%</span>
              </div>
              <div style={{ height: '10px', background: 'var(--paper-dark)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${materia.porcentaje}%`, height: '100%', background: materia.color, transition: 'width .6s ease' }} />
              </div>
              <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)', marginTop: '.55rem', lineHeight: 1.7 }}>
                {materia.taskMeta
                  ? `${materia.taskMeta.completadas}/${materia.taskMeta.total} contenidos del PGO completados`
                  : `${materia.registros} registro${materia.registros !== 1 ? 's' : ''} manual${materia.registros !== 1 ? 'es' : ''} de avance`}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-head">
        <h2>Ruta del PGO</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: '.75rem',
            padding: '.4rem .75rem',
            background: 'var(--paper-light)',
            border: '1px solid var(--line-strong)',
            borderRadius: '2px'
          }}
        >
          <option value="">Todas las materias</option>
          {materias.map((materia) => (
            <option key={materia.id} value={materia.id}>
              {materia.nombre} - Grupo {materia.grupo}
            </option>
          ))}
        </select>
      </div>

      {tareasPorMateria.length === 0 ? (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1.2rem 1.25rem',
            borderRadius: '16px',
            border: '1px dashed var(--line-strong)',
            background: 'rgba(246,248,252,0.75)',
            color: 'var(--ink-light)'
          }}
        >
          Las tareas del PGO apareceran aqui cuando la jefatura apruebe un documento con bloques de "Contenido de unidad".
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          {tareasPorMateria.map((materia) => {
            const porcentaje = materia.total ? Math.round((materia.completadas * 100) / materia.total) : 0;

            return (
              <section
                key={materia.materia_id}
                className="card"
                style={{
                  padding: '1.25rem',
                  borderRadius: '22px',
                  border: '1px solid var(--line)',
                  boxShadow: '0 18px 40px -36px rgba(15, 23, 42, 0.42)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <div>
                    <div className="eyebrow">{materia.materia_codigo} - Grupo {materia.materia_grupo}</div>
                    <h3 style={{ marginTop: '.35rem' }}>{materia.materia_nombre}</h3>
                    <div className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginTop: '.25rem' }}>
                      {materia.completadas}/{materia.total} contenidos completados - Periodo {materia.periodo || '-'}
                    </div>
                  </div>
                  <div style={{ minWidth: '180px' }}>
                    <div className="flex justify-between" style={{ fontSize: '.75rem', marginBottom: '.35rem' }}>
                      <span className="text-mono text-muted">CUMPLIMIENTO DEL PGO</span>
                      <span className="text-mono" style={{ fontWeight: 700 }}>{porcentaje}%</span>
                    </div>
                    <div style={{ height: '10px', background: 'var(--paper-dark)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${porcentaje}%`, height: '100%', background: 'var(--forest)', transition: 'width .35s ease' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '.85rem' }}>
                  {materia.units.map((unit) => (
                    <div
                      key={`${materia.materia_id}-${unit.unidad_codigo}-${unit.unidad_nombre}`}
                      style={{
                        padding: '1rem',
                        borderRadius: '18px',
                        background: 'linear-gradient(180deg, rgba(246,248,252,0.92) 0%, rgba(255,255,255,0.98) 100%)',
                        border: '1px solid var(--line)'
                      }}
                    >
                      <div style={{ marginBottom: '.8rem' }}>
                        <div className="eyebrow">{unit.unidad_codigo}</div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', marginTop: '.2rem' }}>{unit.unidad_nombre}</div>
                      </div>

                      <div style={{ display: 'grid', gap: '.65rem' }}>
                        {unit.tasks.map((task) => {
                          const done = task.estado === 'completado';
                          return (
                            <div
                              key={task.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '1rem',
                                alignItems: 'center',
                                padding: '.85rem .95rem',
                                borderRadius: '14px',
                                border: `1px solid ${done ? 'rgba(24, 160, 88, 0.32)' : 'var(--line)'}`,
                                background: done ? 'rgba(24, 160, 88, 0.08)' : 'white'
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '.92rem', fontWeight: 600, color: done ? 'var(--forest)' : 'var(--ink)' }}>
                                  {task.titulo}
                                </div>
                                <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                                  {done ? `Completado el ${task.fecha_completado || '-'}` : 'Pendiente de desarrollo'}
                                </div>
                              </div>
                              <button
                                type="button"
                                className={done ? 'btn btn-ghost' : 'btn btn-primary'}
                                onClick={() => toggleTask(task)}
                                disabled={savingTaskId === task.id}
                                style={{
                                  minWidth: '142px',
                                  borderColor: done ? 'rgba(24, 160, 88, 0.32)' : undefined,
                                  color: done ? 'var(--forest)' : undefined
                                }}
                              >
                                {savingTaskId === task.id ? 'Guardando...' : done ? 'Marcar pendiente' : 'Marcar completado'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="section-head">
        <h2>Registros por fecha</h2>
      </div>

      <div className="timeline">
        {avances.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--line-strong)' }}>
            <p className="display-italic" style={{ fontSize: '1.1rem', color: 'var(--ink-light)' }}>Sin avances registrados</p>
          </div>
        )}
        {avances.map((avance, index) => (
          <div key={avance.id} className="timeline-item">
            <div className="timeline-dot">
              {avance.validado ? '✓' : String(index + 1).padStart(2, '0')}
            </div>
            <div className="timeline-content card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold-dark)', letterSpacing: '.12em' }}>
                    {avance.fecha} - {avance.materia_nombre} - Grupo {avance.materia_grupo || '-'}
                  </span>
                </div>
                {avance.validado
                  ? <span className="chip chip-forest">✓ Validado</span>
                  : <span className="chip chip-gold">Pendiente validacion</span>}
              </div>
              <h3>{avance.tema}</h3>
              {avance.descripcion && <p style={{ marginTop: '.5rem', color: 'var(--ink-soft)', fontSize: '.9rem' }}>{avance.descripcion}</p>}

              <div style={{ marginTop: '1rem' }}>
                <div className="flex justify-between" style={{ fontSize: '.75rem', marginBottom: '.35rem' }}>
                  <span className="text-mono text-muted">PROGRESO</span>
                  <span className="text-mono">{avance.porcentaje_avance}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--paper-dark)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${avance.porcentaje_avance}%`, height: '100%', background: 'var(--ink)', transition: 'width .5s' }} />
                </div>
              </div>

              {avance.observaciones && (
                <div
                  style={{
                    marginTop: '.75rem',
                    padding: '.75rem',
                    background: 'rgba(139,42,42,.06)',
                    borderLeft: '3px solid var(--crimson)',
                    fontSize: '.85rem',
                    fontStyle: 'italic'
                  }}
                >
                  <strong style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', letterSpacing: '.1em' }}>OBSERVACION:</strong> {avance.observaciones}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar avance">
        <form onSubmit={guardar}>
          <div className="form-field">
            <label>Materia *</label>
            <select value={form.materia_id} onChange={(e) => setForm({ ...form, materia_id: e.target.value })} required>
              <option value="">Seleccione una materia</option>
              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nombre} - Grupo {materia.grupo}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Tema *</label>
            <input value={form.tema} onChange={(e) => setForm({ ...form, tema: e.target.value })} required />
          </div>
          <div className="form-field">
            <label>Descripcion</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="form-field">
              <label>Fecha *</label>
              <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
            </div>
            <div className="form-field">
              <label>Porcentaje de avance *</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.porcentaje_avance}
                onChange={(e) => setForm({ ...form, porcentaje_avance: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary">Guardar avance</button>
          </div>
        </form>
      </Modal>

      <style>{`
        .timeline { position: relative; padding-left: 2rem; }
        .timeline::before {
          content: '';
          position: absolute;
          left: 20px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: var(--line-strong);
        }
        .timeline-item { position: relative; margin-bottom: 1.25rem; }
        .timeline-dot {
          position: absolute;
          left: -2rem;
          top: 1.25rem;
          width: 36px;
          height: 36px;
          background: var(--paper-light);
          border: 2px solid var(--ink);
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-family: var(--mono);
          font-size: .75rem;
          font-weight: 500;
          z-index: 2;
        }
        .timeline-content { margin-left: 1.5rem; }
      `}</style>
    </>
  );
}
