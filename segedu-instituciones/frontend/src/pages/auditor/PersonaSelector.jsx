import { useDialog } from '../../components/dialog/DialogProvider';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

export default function PersonaSelector({ type }) {
  const dialog = useDialog();
  const navigate = useNavigate();
  const [data, setData] = useState({ personas: [], carrera: null, active_id: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isTeacher = type === 'docente';

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(`/auditor/${isTeacher ? 'docentes' : 'estudiantes'}`)
      .then(({ data: response }) => setData(response))
      .catch(err => setError(err.response?.data?.message || err.response?.data?.error || 'No se pudieron cargar las personas.'))
      .finally(() => setLoading(false));
  }, [isTeacher]);

  const enter = async (person) => {
    try {
      await api.post(`/auditor/${type}-activo`, { [`${type}_id`]: person.id });
      navigate(`/auditor/${type}/inicio`);

    } catch (err) {
      dialog.alert(err.response?.data?.message || err.response?.data?.error || 'No se pudo completar la acción. Intente nuevamente.', { tipo: 'error' });
    }
  };

  return (
    <>
      <PageHeader
        num={isTeacher ? '17' : '18'}
        eyebrow="Inspeccion de solo lectura"
        title={isTeacher ? 'Vista de docente' : 'Vista de estudiante'}
        lead={`Seleccione ${isTeacher ? 'un docente' : 'un estudiante'} de ${data.carrera?.nombre || 'la carrera activa'} para consultar su experiencia completa sin modificar información.`}
      />
      {loading ? <div className="loading-state" role="status">Cargando personas…</div> : error ? <div className="error-state" role="alert">{error}</div> : (
        <div className="auditor-person-grid">
          {data.personas.map((person) => (
            <article key={person.id} className={`auditor-person-card ${Number(data.active_id) === Number(person.id) ? 'active' : ''}`}>
              <div className="auditor-person-avatar">{person.nombre?.[0]}{person.apellido?.[0]}</div>
              <div className="auditor-person-info">
                <h3>{person.nombre} {person.apellido}</h3>
                <p>{person.email}</p>
                <span>{isTeacher ? `${person.especialidad || 'Sin especialidad'} · ${person.total_materias} materia(s)` : `${person.codigo_estudiante} · Semestre ${person.semestre}`}</span>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => enter(person)}>Ingresar en modo lectura</button>
            </article>
          ))}
          {!data.personas.length && <div className="card" style={{ padding: '2rem', color: 'var(--ink-light)' }}>No existen {isTeacher ? 'docentes con materias' : 'estudiantes'} en esta carrera.</div>}
        </div>
      )}
    </>
  );
}
