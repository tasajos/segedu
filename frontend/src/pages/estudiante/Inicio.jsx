import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';

export default function EstudianteInicio() {
  const { user } = useAuth();
  const [resumen, setResumen] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [materias, setMaterias] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [r, c, m] = await Promise.all([
          api.get('/estudiante/asistencias/resumen'),
          api.get('/estudiante/cursos'),
          api.get('/estudiante/materias')
        ]);
        setResumen(r.data);
        setCursos(c.data);
        setMaterias(m.data);
      } catch (e) { /* silent */ }
    })();
  }, []);

  const totalAsist = resumen.reduce((s, r) => s + (+r.presentes || 0), 0);
  const totalFaltas = resumen.reduce((s, r) => s + (+r.faltas || 0), 0);
  const totalPermisos = resumen.reduce((s, r) => s + (+r.permisos || 0), 0);

  return (
    <>
      <PageHeader
        num="01"
        eyebrow="Panel del estudiante"
        title={<>Buen día, <span className="display-italic">{user.nombre}</span>.</>}
        lead={`Código ${user.codigo_estudiante || '—'} · ${user.carrera || 'Sin carrera'} · Semestre ${user.semestre || '—'}`}
      />

      <div className="grid-4 mb-8">
        <StatCard num="01" label="Asistencias" value={totalAsist} hint="días presentes" accent="forest"/>
        <StatCard num="02" label="Faltas" value={totalFaltas} hint="ausencias registradas" accent="crimson"/>
        <StatCard num="03" label="Permisos" value={totalPermisos} hint="con justificación" accent="gold"/>
        <StatCard num="04" label="Cursos" value={cursos.length} hint="capacitaciones" accent="ink"/>
      </div>

      <div className="grid-2">
        <div>
          <div className="section-head">
            <h2>Materias inscritas</h2>
            <span className="count">{materias.length} registros</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {materias.length === 0 && <EmptyState text="Sin materias inscritas" />}
            {materias.map((m, i) => (
              <div key={m.id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold-dark)', letterSpacing: '.15em' }}>
                      {String(i + 1).padStart(2, '0')} · {m.codigo}
                    </div>
                    <h3 style={{ marginTop: '.25rem' }}>{m.nombre}</h3>
                    <div className="text-muted" style={{ fontSize: '.85rem', marginTop: '.25rem' }}>
                      {m.docente_nombre ? `Sr. Docente ${[m.docente_nombre, m.docente_apellido].filter(Boolean).join(' ')}` : 'Sin docente asignado'}
                    </div>
                  </div>
                  <span className="chip chip-ink">Sem. {m.semestre}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="section-head">
            <h2>Accesos rápidos</h2>
            <span className="count">04 acciones</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/estudiante/cursos" className="quick-link">
              <span className="ql-num">01</span>
              <div>
                <div className="ql-title">Capacitaciones</div>
                <div className="ql-desc">Subir certificados y cursos externos</div>
              </div>
              <span className="ql-arrow">→</span>
            </Link>
            <Link to="/estudiante/info" className="quick-link">
              <span className="ql-num">02</span>
              <div>
                <div className="ql-title">Información personal</div>
                <div className="ql-desc">Actualizar CI, teléfono y datos</div>
              </div>
              <span className="ql-arrow">→</span>
            </Link>
            <Link to="/estudiante/asistencias" className="quick-link">
              <span className="ql-num">03</span>
              <div>
                <div className="ql-title">Asistencias</div>
                <div className="ql-desc">Consultar asistencias y solicitar permiso</div>
              </div>
              <span className="ql-arrow">→</span>
            </Link>
            <Link to="/estudiante/tareas" className="quick-link">
              <span className="ql-num">04</span>
              <div>
                <div className="ql-title">Mis tareas</div>
                <div className="ql-desc">Ver materiales y entregar trabajos</div>
              </div>
              <span className="ql-arrow">→</span>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .quick-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: var(--paper-light);
          border: 1px solid var(--line);
          border-radius: 3px;
          transition: all .25s;
          text-decoration: none;
          color: inherit;
        }
        .quick-link:hover {
          border-color: var(--ink);
          transform: translateX(4px);
          background: var(--paper-dark);
        }
        .ql-num {
          font-family: var(--mono);
          font-size: .7rem;
          color: var(--gold-dark);
          letter-spacing: .15em;
          width: 30px;
        }
        .ql-title { font-family: var(--serif); font-size: 1.15rem; flex: 1; }
        .ql-desc { font-size: .82rem; color: var(--ink-light); margin-top: 2px; }
        .ql-arrow { font-family: var(--serif); font-size: 1.5rem; color: var(--ink-light); transition: transform .2s; }
        .quick-link:hover .ql-arrow { color: var(--crimson); transform: translateX(4px); }
      `}</style>
    </>
  );
}

const EmptyState = ({ text }) => (
  <div style={{
    padding: '2rem',
    textAlign: 'center',
    border: '1px dashed var(--line-strong)',
    borderRadius: '3px',
    color: 'var(--ink-light)',
    fontFamily: 'var(--serif)',
    fontStyle: 'italic'
  }}>
    {text}
  </div>
);
