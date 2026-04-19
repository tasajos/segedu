import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TIPO_COLOR = {
  felicitacion: 'forest',
  positivo: 'forest',
  observacion: 'gold',
  alerta: 'crimson'
};

const TIPO_LABEL = {
  felicitacion: 'Felicitación',
  positivo: 'Positivo',
  observacion: 'Observación',
  alerta: 'Alerta'
};

export default function JefeComportamiento() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await api.get('/jefe/comportamiento');
      setData(res.data);
    })();
  }, []);

  if (!data) return <div className="loading-dots"><span/><span/><span/></div>;

  const { faltas, comentariosTipo, alertas } = data;

  return (
    <>
      <PageHeader
        num="04"
        eyebrow="Análisis conductual"
        title={<>Comportamientos <span className="display-italic">& alertas</span></>}
        lead="Identifique tendencias de inasistencia y recopile alertas emitidas por el cuerpo docente."
      />

      <div className="grid-2 mb-8">
        {/* Ranking de faltas */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-head">
            <h2>Ranking de faltas</h2>
            <span className="count">top 10</span>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={faltas.slice(0, 10)} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#1a161220"/>
              <XAxis type="number" tick={{ fontFamily: 'JetBrains Mono', fontSize: 11, fill: '#6b5f52' }}/>
              <YAxis
                type="category"
                dataKey="apellido"
                tick={{ fontFamily: 'DM Sans', fontSize: 12, fill: '#1a1612' }}
                width={80}
              />
              <Tooltip
                contentStyle={{ background: '#faf6ed', border: '1px solid #1a1612', borderRadius: '2px' }}
                formatter={(v) => [`${v} faltas`, 'Total']}
                labelFormatter={(l, p) => p[0] ? `${p[0].payload.nombre} ${p[0].payload.apellido}` : l}
              />
              <Bar dataKey="total_faltas" fill="#8b2a2a" radius={[0, 2, 2, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución de comentarios */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="section-head">
            <h2>Tipología de comentarios</h2>
            <span className="count">distribución</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            {comentariosTipo.map(c => {
              const max = Math.max(...comentariosTipo.map(x => +x.total));
              const pct = (c.total * 100) / max;
              const color = TIPO_COLOR[c.tipo] || 'ink';
              const colorVar = color === 'forest' ? 'var(--forest)' : color === 'crimson' ? 'var(--crimson)' : color === 'gold' ? 'var(--gold)' : 'var(--ink)';
              return (
                <div key={c.tipo}>
                  <div className="flex justify-between items-center mb-2" style={{ marginBottom: '.35rem' }}>
                    <span className={`chip chip-${color}`}>{TIPO_LABEL[c.tipo] || c.tipo}</span>
                    <span className="text-serif" style={{ fontSize: '1.5rem' }}>{c.total}</span>
                  </div>
                  <div style={{ height: '10px', background: 'var(--paper-dark)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: colorVar, transition: 'width .5s' }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alertas recientes */}
      <div className="section-head">
        <h2>Alertas y observaciones recientes</h2>
        <span className="count">{alertas.length} eventos</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {alertas.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--line-strong)' }}>
            <p className="display-italic" style={{ color: 'var(--ink-light)' }}>Sin alertas recientes</p>
          </div>
        )}
        {alertas.map((a, i) => {
          const color = TIPO_COLOR[a.tipo] || 'ink';
          const colorVar = color === 'crimson' ? 'var(--crimson)' : color === 'gold' ? 'var(--gold)' : 'var(--forest)';
          return (
            <div key={a.id} className="card" style={{ borderLeft: `4px solid ${colorVar}`, padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr auto', gap: '1rem', alignItems: 'center' }}>
                <div className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>
                  №{String(i + 1).padStart(3, '0')}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`chip chip-${color}`}>{TIPO_LABEL[a.tipo] || a.tipo}</span>
                    <span className="text-serif" style={{ fontSize: '1.05rem', fontWeight: 500 }}>
                      {a.estudiante_nombre} {a.estudiante_apellido}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: '.92rem' }}>
                    «{a.comentario}»
                  </p>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', marginTop: '.5rem', letterSpacing: '.05em' }}>
                    Por {a.docente_nombre} {a.materia_nombre ? `· ${a.materia_nombre}` : ''}
                  </div>
                </div>
                <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', textAlign: 'right' }}>
                  {new Date(a.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
