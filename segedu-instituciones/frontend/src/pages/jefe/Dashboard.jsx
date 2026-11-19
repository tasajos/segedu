import PageState, { usePageLoad } from '../../components/PageState';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { useInstitucion } from '../../context/InstitucionContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const CHART_COLORS = ['var(--brand)', 'var(--danger)', 'var(--warning)', 'var(--teal)', 'var(--gray-500)'];

const PGO_STATES = {
  borrador:  { label: 'Borrador',  color: '#64748b', bg: '#f1f5f9' },
  enviado:   { label: 'Enviado',   color: '#0284c7', bg: '#f0f9ff' },
  revision:  { label: 'En Revisión', color: '#d97706', bg: '#fffbeb' },
  aprobado:  { label: 'Aprobado',  color: '#059669', bg: '#ecfdf5' },
  observado: { label: 'Observado', color: '#e11d48', bg: '#fff1f2' }
};

export default function JefeDashboard() {
  const pageLoad = usePageLoad();
  const [data, setData] = useState(null);
  const { t } = useInstitucion();

  useEffect(() => {
    pageLoad.run(() => (async () => {
      try {
        const { data } = await api.get('/jefe/dashboard');
        setData(data);
      } catch (e) {
        throw e;
      }
    })());
  }, []);

  if (!data) {
    return (
      <PageState state={pageLoad}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', gap: '1rem' }}>
        <div className="loading-dots"><span/><span/><span/></div>
        <span style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Cargando métricas institucionales...</span>
      </div></PageState>
    );
  }

  const { totales, porSemestre, avancePorMateria, asistenciaGlobal, estadoPGO } = data;

  return (
    <PageState state={pageLoad}><div className="fade-up">
      <PageHeader
        eyebrow="Supervisión Académica"
        title="Monitoreo Institucional Integral"
        lead="Estudiantes, control de asistencias, avance curricular y planes pedagógicos en tiempo real."
      />

      {/* Tarjetas KPI */}
      <div className="grid-4 mb-8">
        <StatCard label={t('estudiantes')} value={totales.estudiantes} hint="alumnos matriculados" accent="ink" big/>
        <StatCard label={t('docentes')} value={totales.docentes} hint="docentes activos" accent="gold"/>
        <StatCard label={t('asignaturas')} value={totales.materias} hint="en dictado actual" accent="forest"/>
        <StatCard label="Capacitaciones" value={totales.cursos} hint="cursos especiales" accent="crimson"/>
      </div>

      <div className="grid-2 mb-8">
        {/* Avance por materia */}
        <div className="card">
          <div className="section-head">
            <div>
              <h2>Avance Curricular por Asignatura</h2>
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>Porcentaje de contenido completado</p>
            </div>
            <span className="count">{avancePorMateria.length} materias</span>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={avancePorMateria} margin={{ top: 20, right: 15, left: -15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="codigo"
                tick={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '0.85rem'
                }}
                formatter={(v) => [`${v}%`, 'Avance temático']}
              />
              <Bar dataKey="avance_actual" fill="var(--blue-600)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asistencia global */}
        <div className="card">
          <div className="section-head">
            <div>
              <h2>Distribución de Asistencias</h2>
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>Proporción general de presentes, faltas y licencias</p>
            </div>
            <span className="count">Global</span>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={asistenciaGlobal}
                dataKey="total"
                nameKey="estado"
                cx="50%" cy="50%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={3}
                label={({ estado, total }) => `${estado} (${total})`}
                labelLine={false}
              >
                {asistenciaGlobal.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#ffffff" strokeWidth={2}/>
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '0.85rem'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Estudiantes por periodo + Estado PGO */}
      <div className="grid-2">
        <div className="card">
          <div className="section-head">
            <div>
              <h2>Matrícula por Periodo</h2>
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>Distribución de estudiantes por semestre / ciclo</p>
            </div>
            <span className="count">{porSemestre.length} periodos</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '1.2rem' }}>
            {porSemestre.map((s) => {
              const max = Math.max(...porSemestre.map(x => x.total)) || 1;
              const pct = Math.round((s.total * 100) / max);
              return (
                <div key={s.semestre} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 45px', gap: '.85rem', alignItems: 'center' }}>
                  <span className="text-mono" style={{ fontSize: '.78rem', fontWeight: 650, color: 'var(--text-muted)' }}>
                    SEM {String(s.semestre).padStart(2, '0')}
                  </span>
                  <div style={{ height: '10px', background: 'var(--gray-100)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--blue-600), var(--accent))',
                      borderRadius: '9999px',
                      transition: 'width .6s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}/>
                  </div>
                  <span style={{ fontSize: '.95rem', fontWeight: 750, color: 'var(--text)', textAlign: 'right' }}>
                    {s.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="section-head">
            <div>
              <h2>Estado de Planes de Aula (PGO)</h2>
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>Planificaciones pedagógicas presentadas</p>
            </div>
            <span className="count">{estadoPGO.reduce((s, x) => s + (+x.total), 0)} documentos</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '.85rem', marginTop: '1.2rem' }}>
            {estadoPGO.map((e) => {
              const conf = PGO_STATES[e.estado] || { label: e.estado, color: '#64748b', bg: '#f8fafc' };
              return (
                <div key={e.estado} style={{
                  padding: '1.1rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  background: conf.bg,
                  borderTop: `4px solid ${conf.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '.25rem'
                }}>
                  <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                    {e.total}
                  </div>
                  <div style={{
                    fontSize: '.72rem',
                    fontWeight: 750,
                    color: conf.color,
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                    marginTop: '.2rem'
                  }}>
                    {conf.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div></PageState>
  );
}
