import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from 'recharts';

const COLORS = ['#b8904a', '#8b2a2a', '#3a5a3f', '#1a1612', '#6b5f52'];

export default function JefeDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/jefe/dashboard');
      setData(data);
    })();
  }, []);

  if (!data) return <div className="loading-dots"><span/><span/><span/></div>;

  const { totales, porSemestre, avancePorMateria, asistenciaGlobal, estadoPGO } = data;

  return (
    <>
      <PageHeader
        num="01"
        eyebrow="Situación actual"
        title={<>Observatorio <span className="display-italic">académico</span></>}
        lead="Panorama general del desempeño institucional — estudiantes, materias, asistencias y avance curricular."
      />

      {/* Totales */}
      <div className="grid-4 mb-8">
        <StatCard num="01" label="Estudiantes" value={totales.estudiantes} hint="matriculados" accent="ink" big/>
        <StatCard num="02" label="Docentes" value={totales.docentes} hint="activos" accent="gold"/>
        <StatCard num="03" label="Materias" value={totales.materias} hint="este semestre" accent="forest"/>
        <StatCard num="04" label="Capacitaciones" value={totales.cursos} hint="registradas" accent="crimson"/>
      </div>

      <div className="grid-2 mb-8">
        {/* Avance por materia */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-head">
            <h2>Avance de programas</h2>
            <span className="count">por materia</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={avancePorMateria} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1a161220"/>
              <XAxis
                dataKey="codigo"
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#6b5f52' }}
                axisLine={{ stroke: '#1a1612' }}
              />
              <YAxis
                tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#6b5f52' }}
                axisLine={{ stroke: '#1a1612' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{ background: '#faf6ed', border: '1px solid #1a1612', borderRadius: '2px', fontFamily: 'DM Sans' }}
                formatter={(v) => [`${v}%`, 'Avance']}
              />
              <Bar dataKey="avance_actual" fill="#b8904a" radius={[2,2,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asistencia global */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-head">
            <h2>Asistencias globales</h2>
            <span className="count">distribución</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={asistenciaGlobal}
                dataKey="total"
                nameKey="estado"
                cx="50%" cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                label={({ estado, total }) => `${estado} (${total})`}
                labelLine={false}
              >
                {asistenciaGlobal.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#faf6ed" strokeWidth={2}/>
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#faf6ed', border: '1px solid #1a1612', borderRadius: '2px', fontFamily: 'DM Sans' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Estudiantes por semestre + Estado PGO */}
      <div className="grid-2">
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-head">
            <h2>Estudiantes por semestre</h2>
            <span className="count">{porSemestre.length} semestres</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginTop: '1rem' }}>
            {porSemestre.map((s) => {
              const max = Math.max(...porSemestre.map(x => x.total));
              const pct = (s.total * 100) / max;
              return (
                <div key={s.semestre} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 40px', gap: '.75rem', alignItems: 'center' }}>
                  <span className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>
                    SEM {String(s.semestre).padStart(2, '0')}
                  </span>
                  <div style={{ height: '24px', background: 'var(--paper-dark)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: 'linear-gradient(90deg, var(--ink), var(--gold))',
                      transition: 'width .5s'
                    }}/>
                  </div>
                  <span className="text-serif" style={{ fontSize: '1.1rem', textAlign: 'right' }}>{s.total}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-head">
            <h2>Estado de PGO</h2>
            <span className="count">{estadoPGO.reduce((s, x) => s + (+x.total), 0)} documentos</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '.75rem', marginTop: '1rem' }}>
            {estadoPGO.map((e, i) => (
              <div key={e.estado} className="pgo-stat" style={{
                padding: '1rem', border: '1px solid var(--line-strong)', borderRadius: '2px',
                borderTopWidth: '4px', borderTopColor: COLORS[i % COLORS.length]
              }}>
                <div className="text-serif" style={{ fontSize: '2rem', lineHeight: 1 }}>{e.total}</div>
                <div className="text-mono" style={{ fontSize: '.65rem', color: 'var(--ink-light)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: '.25rem' }}>
                  {e.estado}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
