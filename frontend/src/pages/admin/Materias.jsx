import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const agruparMaterias = (materias) => {
  const map = new Map();

  materias.forEach((m) => {
    const key = `${m.carrera_nombre}__${m.nombre}__${m.codigo}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        nombre: m.nombre,
        codigo: m.codigo,
        carrera_nombre: m.carrera_nombre,
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

export default function AdminMaterias() {
  const navigate = useNavigate();
  const [materias, setMaterias] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [filtroCarrera, setFiltroCarrera] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const cargar = async () => {
    const params = filtroCarrera ? `?carrera_id=${filtroCarrera}` : '';
    const [m, c] = await Promise.all([
      api.get(`/admin/materias${params}`),
      api.get('/admin/carreras')
    ]);
    setMaterias(m.data);
    setCarreras(c.data);
  };

  useEffect(() => {
    cargar();
  }, [filtroCarrera]);

  const eliminar = async (id) => {
    try {
      await api.delete(`/admin/materias/${id}`);
      setConfirmDel(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const materiasAgrupadas = agruparMaterias(materias);

  return (
    <>
      <PageHeader
        num="04"
        eyebrow="Gestion academica"
        title={<>Materias y <span className="display-italic">asignaturas</span></>}
        lead="Administre las materias de cada carrera y asigne docentes."
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <select className="form-input" style={{ width: '260px' }} value={filtroCarrera} onChange={(e) => setFiltroCarrera(e.target.value)}>
          <option value="">Todas las carreras</option>
          {carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => navigate('/admin/materias/nueva')}>
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
                  {group.codigo} - {group.carrera_nombre} - {group.grupos.length} grupo{group.grupos.length === 1 ? '' : 's'}
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
                      <span className="chip chip-forest">{m.total_estudiantes} est.</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/admin/materias/${m.id}/editar`, { state: { materia: m } })}
                      >
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(m.id === confirmDel ? null : m.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {confirmDel === m.id && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '.9rem', color: '#b91c1c' }}>
                        Eliminar <strong>{m.nombre} Grupo {m.grupo}</strong>? Se borraran inscripciones y registros asociados.
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
          </div>
        ))}
      </div>
    </>
  );
}
