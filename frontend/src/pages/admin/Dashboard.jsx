import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data));
  }, []);

  if (!data) return <div className="loading-dots"><span/><span/><span/></div>;

  const { totales, porRol, carreras } = data;

  return (
    <>
      <PageHeader
        num="01"
        eyebrow="Panel de control"
        title={<>Administración <span className="display-italic">del sistema</span></>}
        lead="Gestión global de usuarios, carreras y configuración institucional."
      />

      <div className="grid-4 mb-8">
        <StatCard num="01" label="Usuarios" value={totales.usuarios} hint="registrados" accent="ink" big/>
        <StatCard num="02" label="Estudiantes" value={totales.estudiantes} hint="matriculados" accent="gold"/>
        <StatCard num="03" label="Docentes" value={totales.docentes} hint="activos" accent="forest"/>
        <StatCard num="04" label="Carreras" value={totales.carreras} hint="programas" accent="crimson"/>
      </div>

      <div className="grid-2 mb-8">
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-head">
            <h2>Usuarios por rol</h2>
            <span className="count">{porRol.length} roles</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginTop: '1rem' }}>
            {porRol.map((r) => {
              const colors = { estudiante: 'var(--gold)', docente: 'var(--forest)', jefe: 'var(--crimson)', admin: 'var(--ink)' };
              return (
                <div key={r.rol} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 40px', gap: '.75rem', alignItems: 'center' }}>
                  <span className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    {r.rol}
                  </span>
                  <div style={{ height: '28px', background: 'var(--paper-dark)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min((r.total / totales.usuarios) * 100, 100)}%`,
                      height: '100%',
                      background: colors[r.rol] || 'var(--gold)',
                      transition: 'width .5s'
                    }}/>
                  </div>
                  <span className="text-serif" style={{ fontSize: '1.2rem', textAlign: 'right' }}>{r.total}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-head">
            <h2>Materias y carreras</h2>
            <span className="count">{totales.materias} materias</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginTop: '1rem' }}>
            {carreras.map(c => (
              <div key={c.id} style={{
                padding: '.875rem 1rem', background: 'var(--paper-dark)',
                borderRadius: '2px', borderLeft: '3px solid var(--gold)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 600 }}>{c.nombre}</div>
                    <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                      {c.codigo} · Jefe: {c.jefe_nombre ? `${c.jefe_nombre} ${c.jefe_apellido}` : 'Sin asignar'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <span className="chip chip-gold">{c.total_estudiantes} est.</span>
                    <span className="chip chip-forest">{c.total_materias} mat.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
