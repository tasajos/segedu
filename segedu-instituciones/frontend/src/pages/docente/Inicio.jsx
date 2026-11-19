import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';

export default function DocenteInicio() {
  const { user, auditPersona } = useAuth();
  const displayUser = user.rol === 'auditor' ? (auditPersona || user) : user;
  const [materias, setMaterias] = useState([]);
  const [pgo, setPgo] = useState([]);
  const [avance, setAvance] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [m, p, a] = await Promise.all([
          api.get('/docente/materias'),
          api.get('/docente/pgo'),
          api.get('/docente/avance')
        ]);
        setMaterias(m.data || []);
        setPgo(p.data || []);
        setAvance(a.data || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const totalEstudiantes = materias.reduce((s, m) => s + (+m.total_estudiantes || 0), 0);
  const avanceProm = avance.length ? Math.round(avance.reduce((s, a) => s + (+a.porcentaje_avance), 0) / avance.length) : 0;
  const pgoPendientes = pgo.filter(p => p.estado === 'enviado' || p.estado === 'revision').length;
  const docenteNombreCompleto = [displayUser.nombre, displayUser.apellido].filter(Boolean).join(' ');

  return (
    <div className="fade-up">
      <PageHeader
        eyebrow="Panel Docente"
        title={<>Bienvenido, <span className="display-italic">Prof. {docenteNombreCompleto}</span></>}
        lead={displayUser.especialidad ? `Especialidad: ${displayUser.especialidad}` : 'Espacio de trabajo docente para registro de asistencia, avances y gestión de aula.'}
        actions={
          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
            <Link to="/docente/asistencia" className="btn btn-primary btn-sm">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <span>Pasar lista</span>
            </Link>
            <Link to="/docente/avance" className="btn btn-secondary btn-sm">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              <span>Registrar avance</span>
            </Link>
          </div>
        }
      />

      <div className="grid-4 mb-8">
        <StatCard label="Materias Asignadas" value={materias.length} hint="en dictado actual" accent="ink"/>
        <StatCard label="Total Estudiantes" value={totalEstudiantes} hint="alumnos matriculados" accent="forest"/>
        <StatCard label="Avance Promedio" value={`${avanceProm}%`} hint="del programa oficial" accent="gold"/>
        <StatCard label="Planes Pendientes" value={pgoPendientes} hint="en revisión por jefatura" accent="crimson"/>
      </div>

      <div className="grid-2">
        {/* Mis Materias */}
        <div>
          <div className="section-head">
            <div>
              <h2>Mis Materias en Curso</h2>
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>Asignaturas bajo su responsabilidad</p>
            </div>
            <span className="count">{materias.length} asignadas</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {materias.map((m, i) => (
              <div key={m.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.3rem' }}>
                      <span className="text-mono" style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--blue-700)', background: 'var(--blue-50)', padding: '.15rem .5rem', borderRadius: '4px' }}>
                        {m.codigo}
                      </span>
                      <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                        Semestre {m.semestre} · {m.creditos} créditos
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 750, color: 'var(--text)', margin: 0 }}>
                      {m.nombre}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--blue-600)', lineHeight: 1 }}>
                      {m.total_estudiantes}
                    </div>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.05em', textTransform: 'uppercase', marginTop: '.2rem' }}>
                      Estudiantes
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimos Avances */}
        <div>
          <div className="section-head">
            <div>
              <h2>Últimos Avances Registrados</h2>
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>Historial de clases y contenido impartido</p>
            </div>
            <Link to="/docente/avance" style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--blue-600)' }}>
              Ver todos →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {avance.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.9rem' }}>
                Aún no ha registrado avances de clase.
              </div>
            ) : (
              avance.slice(0, 5).map(a => (
                <div key={a.id} className="card" style={{ padding: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                    <span className="text-mono" style={{ fontSize: '.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {a.fecha}
                    </span>
                    {a.validado ? (
                      <span className="chip chip-forest">Validado</span>
                    ) : (
                      <span className="chip chip-gold">En revisión</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                    {a.tema}
                  </h3>
                  <div style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>
                    {a.materia_nombre}
                  </div>

                  <div style={{ marginTop: '.85rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--gray-100)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${a.porcentaje_avance}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, var(--blue-600), var(--accent))',
                        borderRadius: '9999px'
                      }} />
                    </div>
                    <span className="text-mono" style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text-soft)' }}>
                      {a.porcentaje_avance}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
