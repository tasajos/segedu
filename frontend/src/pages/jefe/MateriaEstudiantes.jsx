import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

export default function JefeMateriaEstudiantes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [detalle, setDetalle] = useState(null);
  const [estudianteId, setEstudianteId] = useState('');
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    const { data } = await api.get(`/jefe/materias/${id}/estudiantes`);
    setDetalle(data);
    setEstudianteId(data.disponibles[0] ? String(data.disponibles[0].id) : '');
  };

  useEffect(() => {
    cargar();
  }, [id]);

  const agregar = async () => {
    if (!estudianteId) return;
    try {
      setLoading(true);
      await api.post('/jefe/inscripciones', { estudiante_id: estudianteId, materia_id: id });
      await cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al agregar estudiante');
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

  return (
    <>
      <PageHeader
        num="09"
        eyebrow="Gestion de carrera"
        title={<>Estudiantes de <span className="display-italic">materia</span></>}
        lead={`${materia.nombre} (${materia.codigo}) - Grupo ${materia.grupo}`}
      />

      <div className="card" style={{ padding: '1rem', display: 'grid', gap: '.75rem', marginBottom: '1.5rem' }}>
        <div className="text-mono" style={{ fontSize: '.72rem', letterSpacing: '.08em', color: 'var(--ink-light)', textTransform: 'uppercase' }}>
          Agregar estudiante
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: '.75rem' }}>
          <select
            className="form-input"
            value={estudianteId}
            onChange={(e) => setEstudianteId(e.target.value)}
            disabled={loading || disponibles.length === 0}
          >
            {disponibles.length === 0 && <option value="">No hay estudiantes disponibles</option>}
            {disponibles.map((e) => (
              <option key={e.id} value={e.id}>
                {e.apellido} {e.nombre} - {e.codigo_estudiante} - Sem. {e.semestre}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={agregar} disabled={loading || !estudianteId}>
            {loading ? 'Guardando...' : 'Agregar'}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/jefe/materias')}>
            Volver
          </button>
        </div>
      </div>

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
