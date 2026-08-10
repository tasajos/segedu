import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import './MateriaEstudiantes.css';

export default function JefeMateriaEstudiantes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [detalle, setDetalle] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargar = async () => {
    const { data } = await api.get(`/jefe/materias/${id}/estudiantes`);
    setDetalle(data);
  };

  useEffect(() => {
    cargar();
  }, [id]);

  const agregar = async () => {
    if (!seleccionados.length) return;
    try {
      setLoading(true);
      setMensaje(null);
      const { data } = await api.post('/jefe/inscripciones', {
        estudiante_ids: seleccionados,
        materia_id: id
      });
      setSeleccionados([]);
      setBusqueda('');
      await cargar();
      setMensaje({ tipo: 'ok', texto: data.message });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'Error al agregar estudiantes' });
    } finally {
      setLoading(false);
    }
  };

  const quitar = async (studentId) => {
    try {
      setLoading(true);
      await api.delete(`/jefe/inscripciones/${studentId}/${id}`);
      await cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al quitar estudiante');
    } finally {
      setLoading(false);
    }
  };

  if (!detalle) return null;

  const { materia, inscritos, disponibles } = detalle;
  const textoBusqueda = busqueda.trim().toLocaleLowerCase('es');
  const disponiblesFiltrados = disponibles.filter((e) => (
    `${e.nombre} ${e.apellido} ${e.codigo_estudiante} ${e.email} ${e.semestre}`
      .toLocaleLowerCase('es')
      .includes(textoBusqueda)
  ));
  const idsDisponibles = disponibles.map((e) => e.id);
  const todosSeleccionados = idsDisponibles.length > 0
    && idsDisponibles.every((studentId) => seleccionados.includes(studentId));

  const alternarEstudiante = (studentId) => {
    setSeleccionados((actuales) => actuales.includes(studentId)
      ? actuales.filter((item) => item !== studentId)
      : [...actuales, studentId]);
  };

  const alternarTodos = () => {
    setSeleccionados(todosSeleccionados ? [] : idsDisponibles);
  };

  return (
    <>
      <PageHeader
        num="09"
        eyebrow="Gestion de carrera"
        title={<>Estudiantes de <span className="display-italic">materia</span></>}
        lead={`${materia.nombre} (${materia.codigo}) - Grupo ${materia.grupo}`}
      />

      <section className="enrollment-panel">
        <div className="enrollment-panel__head">
          <div>
            <span className="enrollment-panel__eyebrow">Nueva inscripción</span>
            <h2>Añadir estudiantes</h2>
            <p>Busca y marca uno o varios estudiantes para inscribirlos de una sola vez.</p>
          </div>
          <div className="enrollment-panel__counter" aria-live="polite">
            <strong>{seleccionados.length}</strong>
            <span>seleccionados</span>
          </div>
        </div>

        <div className="enrollment-toolbar">
          <label className="enrollment-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, código o correo..."
              disabled={loading || disponibles.length === 0}
            />
          </label>
          <button
            type="button"
            className="enrollment-select-all"
            onClick={alternarTodos}
            disabled={loading || idsDisponibles.length === 0}
            aria-pressed={todosSeleccionados}
          >
            {todosSeleccionados ? 'Quitar todos' : 'Todos'}
          </button>
        </div>

        <div className="enrollment-list">
          {disponiblesFiltrados.length === 0 ? (
            <div className="enrollment-empty">
              {disponibles.length === 0
                ? 'Todos los estudiantes de la carrera ya están inscritos.'
                : 'No encontramos estudiantes con esa búsqueda.'}
            </div>
          ) : disponiblesFiltrados.map((e) => {
            const checked = seleccionados.includes(e.id);
            const iniciales = `${e.nombre?.[0] || ''}${e.apellido?.[0] || ''}`.toUpperCase();
            return (
              <label key={e.id} className={`enrollment-student${checked ? ' is-selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => alternarEstudiante(e.id)}
                  disabled={loading}
                />
                <span className="enrollment-check" aria-hidden="true">✓</span>
                <span className="enrollment-avatar">{iniciales}</span>
                <span className="enrollment-student__info">
                  <strong>{e.apellido} {e.nombre}</strong>
                  <small>{e.codigo_estudiante} · {e.email}</small>
                </span>
                <span className="enrollment-semester">Semestre {e.semestre}</span>
              </label>
            );
          })}
        </div>

        {mensaje && (
          <div className={`enrollment-message ${mensaje.tipo}`} role="status">{mensaje.texto}</div>
        )}

        <div className="enrollment-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/jefe/materias')} disabled={loading}>
            Volver
          </button>
          <button className="btn btn-primary" onClick={agregar} disabled={loading || !seleccionados.length}>
            {loading
              ? 'Inscribiendo...'
              : `Inscribir ${seleccionados.length || ''} estudiante${seleccionados.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </section>

      <div className="section-head" style={{ marginBottom: '1rem' }}>
        <h2>Inscritos</h2>
        <span className="count">{inscritos.length} estudiantes</span>
      </div>

      {inscritos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
          Sin estudiantes inscritos en esta materia
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {inscritos.map((e, i) => (
            <div key={e.id} className="card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 600 }}>
                      {e.nombre} {e.apellido}
                    </div>
                    <div className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                      {e.codigo_estudiante} - Sem. {e.semestre} - {e.email}
                    </div>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => quitar(e.id)} disabled={loading}>
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
