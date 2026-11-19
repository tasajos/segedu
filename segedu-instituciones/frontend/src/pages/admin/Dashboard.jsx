import PageState, { usePageLoad } from '../../components/PageState';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';

const ROL_CONFIG = {
  estudiante: { label: 'Estudiantes', color: '#d97706', bg: '#fffbeb', bar: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
  docente:    { label: 'Docentes',    color: '#059669', bg: '#ecfdf5', bar: 'linear-gradient(90deg, #10b981, #34d399)' },
  jefe:       { label: 'Jefes / Coord.', color: '#0284c7', bg: '#f0f9ff', bar: 'linear-gradient(90deg, #0ea5e9, #38bdf8)' },
  admin:      { label: 'Administradores', color: 'var(--brand)', bg: 'var(--blue-50)', bar: 'linear-gradient(90deg, var(--brand), var(--blue-400))' },
  auditor:    { label: 'Auditores',   color: '#6366f1', bg: '#eef2ff', bar: 'linear-gradient(90deg, #6366f1, #818cf8)' }
};

export default function AdminDashboard() {
  const pageLoad = usePageLoad();
  const [data, setData] = useState(null);

  useEffect(() => {
    pageLoad.run(() => api.get('/admin/dashboard').then(r => setData(r.data)));
  }, []);

  if (!data) {
    return (
      <PageState state={pageLoad}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', gap: '1rem' }}>
        <div className="loading-dots"><span/><span/><span/></div>
        <span style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Cargando panel de administración...</span>
      </div></PageState>
    );
  }

  const { totales, porRol, carreras } = data;

  return (
    <PageState state={pageLoad}><div className="fade-up">
      <PageHeader
        eyebrow="Panel de Control General"
        title={<>Administración <span className="display-italic">del Sistema</span></>}
        lead="Supervisión global de usuarios, carreras académicas, asignaturas e infraestructura institucional."
        actions={
          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
            <Link to="/admin/usuarios" className="btn btn-primary btn-sm">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              <span>Gestionar usuarios</span>
            </Link>
            <Link to="/admin/institucion" className="btn btn-secondary btn-sm">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1"/></svg>
              <span>Mi institución</span>
            </Link>
          </div>
        }
      />

      <div className="grid-4 mb-8">
        <StatCard label="Usuarios Totales" value={totales.usuarios} hint="cuentas registradas" accent="ink" big/>
        <StatCard label="Estudiantes" value={totales.estudiantes} hint="alumnos matriculados" accent="gold"/>
        <StatCard label="Docentes" value={totales.docentes} hint="profesores en plantilla" accent="forest"/>
        <StatCard label="Carreras" value={totales.carreras} hint="programas activos" accent="crimson"/>
      </div>

      <div className="grid-2 mb-8">
        {/* Distribución por rol */}
        <div className="card">
          <div className="section-head">
            <div>
              <h2>Distribución de Usuarios</h2>
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>Composición de la comunidad institucional</p>
            </div>
            <span className="count">{totales.usuarios} totales</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginTop: '1.25rem' }}>
            {porRol.map((r) => {
              const conf = ROL_CONFIG[r.rol] || { label: r.rol, color: '#64748b', bg: '#f1f5f9', bar: '#64748b' };
              const pct = totales.usuarios > 0 ? Math.round((r.total / totales.usuarios) * 100) : 0;

              return (
                <div key={r.rol} style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <span style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        backgroundColor: conf.color, display: 'inline-block'
                      }}/>
                      <span style={{ fontSize: '.85rem', fontWeight: 650, color: 'var(--text)' }}>
                        {conf.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <span style={{ fontSize: '.85rem', fontWeight: 800, color: 'var(--text)' }}>{r.total}</span>
                      <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', minWidth: '32px', textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </div>

                  <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: conf.bar,
                      borderRadius: '9999px',
                      transition: 'width .6s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carreras y Materias */}
        <div className="card">
          <div className="section-head">
            <div>
              <h2>Carreras y Oferta Académica</h2>
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>{totales.materias} materias curriculares activas</p>
            </div>
            <Link to="/admin/carreras" style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--blue-600)' }}>
              Ver todas →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginTop: '1rem' }}>
            {carreras.slice(0, 5).map(c => (
              <div key={c.id} style={{
                padding: '0.9rem 1.1rem',
                background: 'var(--gray-50)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                transition: 'all .15s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 750, fontSize: '.92rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.nombre}
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.2rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <span className="text-mono" style={{ background: 'var(--gray-200)', padding: '.1rem .4rem', borderRadius: '4px', fontSize: '.7rem', fontWeight: 600 }}>
                      {c.codigo}
                    </span>
                    <span>· Coordinador: {c.jefe_nombre ? `${c.jefe_nombre} ${c.jefe_apellido}` : 'Sin asignar'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '.45rem', flexShrink: 0 }}>
                  <span className="chip chip-gold" title="Estudiantes matriculados">{c.total_estudiantes} est.</span>
                  <span className="chip chip-forest" title="Materias en malla">{c.total_materias} mat.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div></PageState>
  );
}
