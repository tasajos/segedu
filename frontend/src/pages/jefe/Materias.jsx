import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

export default function JefeMaterias() {
  const navigate = useNavigate();
  const [materias, setMaterias] = useState([]);
  const [confirmDel, setConfirmDel] = useState(null);

  const cargar = async () => {
    const { data } = await api.get('/jefe/materias');
    setMaterias(data);
  };

  useEffect(() => { cargar(); }, []);

  const eliminar = async (id) => {
    try {
      await api.delete(`/jefe/materias/${id}`);
      setConfirmDel(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <>
      <PageHeader
        num="09"
        eyebrow="Gestión de carrera"
        title={<>Materias y <span className="display-italic">asignaturas</span></>}
        lead="Administre las materias de su carrera y asigne docentes."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={() => navigate('/jefe/materias/nueva')}>
          + Nueva materia
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {materias.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
            Sin materias registradas
          </div>
        )}
        {materias.map((m, i) => (
          <div key={m.id}>
            <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <span className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 600 }}>{m.nombre}</div>
                    <div className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                      {m.codigo} · Grupo {m.grupo} · Sem. {m.semestre} · {m.creditos} créditos
                      {m.docente_nombre ? ` · ${m.docente_nombre} ${m.docente_apellido}` : ' · Sin docente'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                  <span className="chip chip-forest">{m.total_estudiantes} est.</span>
                  <button className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/jefe/materias/${m.id}/editar`, { state: { materia: m } })}>
                    Editar
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(m.id === confirmDel ? null : m.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
            {confirmDel === m.id && (
              <div style={{ background: 'var(--red-50, #fef2f2)', border: '1px solid var(--red-200, #fecaca)', borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.9rem', color: 'var(--red-700, #b91c1c)' }}>
                  ¿Eliminar <strong>{m.nombre} Grupo {m.grupo}</strong>? Se borrarán inscripciones y registros asociados.
                </span>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDel(null)}>Cancelar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => eliminar(m.id)}>Confirmar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
