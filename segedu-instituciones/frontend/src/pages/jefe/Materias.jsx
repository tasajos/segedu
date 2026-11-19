import PageState, { usePageLoad } from '../../components/PageState';
import { useDialog } from '../../components/dialog/DialogProvider';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const agruparMaterias = (materias) => {
  const map = new Map();

  materias.forEach((m) => {
    const key = `${m.nombre}__${m.codigo}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        nombre: m.nombre,
        codigo: m.codigo,
        grupos: []
      });
    }
    map.get(key).grupos.push(m);
  });

  return [...map.values()].map((group) => ({
    ...group,
    grupos: group.grupos.sort((a, b) => String(a.grupo).localeCompare(String(b.grupo)))
  }));
};

export default function JefeMaterias() {
  const pageLoad = usePageLoad();
  const dialog = useDialog();
  const navigate = useNavigate();
  const [materias, setMaterias] = useState([]);

  const cargar = async () => {
    return pageLoad.run(async () => {
      const { data } = await api.get('/jefe/materias');
      setMaterias(data);

    });
  };

  useEffect(() => {
    cargar();
  }, []);

  const eliminar = async (id) => {
    const materia = materias.find(item => item.id === id);
    if (!(await dialog.confirm(`¿Eliminar ${materia?.nombre || 'esta materia'} (grupo ${materia?.grupo || ''})? Se borrarán las inscripciones y registros asociados.`, { titulo: 'Eliminar materia', tipo: 'peligro', textoConfirmar: 'Eliminar' }))) return;
    try {
      await api.delete(`/jefe/materias/${id}`);

      cargar();
    } catch (err) {
      dialog.alert(err.response?.data?.message || err.response?.data?.error || 'Error al eliminar', { tipo: 'error' });
    }
  };

  const materiasAgrupadas = agruparMaterias(materias);

  return (
    <PageState state={pageLoad} onRetry={cargar}><>
      <PageHeader
        num="09"
        eyebrow="Gestion de carrera"
        title={<>Materias y <span className="display-italic">asignaturas</span></>}
        lead="Administre las materias de su carrera y asigne docentes."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={() => navigate('/jefe/materias/nueva')}>
          + Nueva materia
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {materiasAgrupadas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
            Sin materias registradas
          </div>
        )}

        {materiasAgrupadas.map((group, i) => (
          <div key={group.key} className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'baseline', marginBottom: '1rem' }}>
              <span className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 600 }}>{group.nombre}</div>
                <div className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                  {group.codigo} - {group.grupos.length} grupo{group.grupos.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {group.grupos.map((m) => (
                <div key={m.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '.9rem 1rem', background: 'var(--paper-dark)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.98rem' }}>Grupo {m.grupo}</div>
                      <div className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                        Sem. {m.semestre} - {m.creditos} creditos
                        {m.docente_nombre ? ` - ${m.docente_nombre} ${m.docente_apellido}` : ' - Sin docente'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        className="chip chip-forest"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/jefe/materias/${m.id}/estudiantes`)}
                      >
                        {m.total_estudiantes} est.
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/jefe/materias/${m.id}/estudiantes`)}
                      >
                        Ver inscritos
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/jefe/materias/${m.id}/editar`, { state: { materia: m } })}
                      >
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => eliminar(m.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </></PageState>
  );
}
