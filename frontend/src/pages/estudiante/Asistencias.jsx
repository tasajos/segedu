import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const ESTADOS = [
  { val: 'presente', label: 'Presente', color: 'forest' },
  { val: 'falta', label: 'Falta', color: 'crimson' },
  { val: 'permiso', label: 'Permiso', color: 'gold' },
  { val: 'tarde', label: 'Tarde', color: 'ink' }
];
const TIPO_COLOR = { falta: 'var(--crimson)', sancion: '#7b2d8b', permiso: 'var(--gold)' };
const TIPO_CHIP = { falta: 'chip-crimson', sancion: 'chip-ink', permiso: 'chip-gold' };
const COMENTARIO_COLOR = { alerta: 'var(--crimson)', felicitacion: 'var(--forest)', positivo: 'var(--forest)', observacion: 'var(--gold)' };

export default function EstudianteAsistencias() {
  const [materias, setMaterias] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [expediente, setExpediente] = useState(null);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState('asistencias');

  const cargar = async () => {
    const [m, r, e] = await Promise.all([
      api.get('/estudiante/materias'),
      api.get('/estudiante/asistencias/resumen'),
      api.get('/estudiante/expediente')
    ]);
    setMaterias(m.data);
    setResumen(r.data);
    setExpediente(e.data);
  };

  useEffect(() => { cargar(); }, []);

  const asistenciasFiltradas = (expediente?.asistencias || []).filter(a =>
    !filter || String(a.materia_id) === filter
  );

  const estadoInfo = (v) => ESTADOS.find(e => e.val === v) || ESTADOS[0];

  return (
    <>
      <PageHeader
        num="04"
        eyebrow="Mi expediente académico"
        title={<>Asistencias y <span className="display-italic">registros</span></>}
        lead="Consulte todas sus asistencias, disciplina, observaciones y permisos registrados por docentes y jefe de carrera."
      />

      {/* Resumen por materia */}
      <div className="section-head">
        <h2>Resumen por materia</h2>
        <span className="count">{resumen.length} materias</span>
      </div>
      <div className="grid-2 mb-8">
        {resumen.map((r, i) => {
          const total = (+r.presentes) + (+r.faltas) + (+r.permisos) + (+r.tardes);
          const pct = total ? Math.round((+r.presentes * 100) / total) : 0;
          return (
            <div key={r.id} className="card">
              <div className="flex justify-between items-center mb-4">
                <span className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold-dark)' }}>
                  {String(i + 1).padStart(2, '0')} · {r.nombre}
                </span>
                <span className="chip chip-ink">{pct}%</span>
              </div>
              <div className="res-bar">
                <div style={{ width: `${pct}%`, background: pct >= 80 ? 'var(--forest)' : pct >= 60 ? 'var(--gold)' : 'var(--crimson)' }} />
              </div>
              <div className="res-grid">
                <div><span className="rlabel">Presentes</span><span className="rval" style={{ color: 'var(--forest)' }}>{r.presentes}</span></div>
                <div><span className="rlabel">Faltas</span><span className="rval" style={{ color: 'var(--crimson)' }}>{r.faltas}</span></div>
                <div><span className="rlabel">Permisos</span><span className="rval" style={{ color: 'var(--gold-dark)' }}>{r.permisos}</span></div>
                <div><span className="rlabel">Tardes</span><span className="rval">{r.tardes}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs de detalle */}
      <div style={{ display: 'flex', gap: '.25rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--line)' }}>
        {[
          { key: 'asistencias', label: 'Asistencias' },
          { key: 'disciplina', label: 'Disciplina' },
          { key: 'comentarios', label: 'Observaciones' }
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '.5rem 1rem', border: 'none', background: 'transparent',
            fontFamily: 'var(--mono)', fontSize: '.78rem', cursor: 'pointer',
            letterSpacing: '.06em', textTransform: 'uppercase',
            borderBottom: tab === t.key ? '2px solid var(--ink)' : '2px solid transparent',
            marginBottom: '-2px',
            color: tab === t.key ? 'var(--ink)' : 'var(--ink-light)'
          }}>
            {t.label}
            {t.key === 'disciplina' && expediente?.disciplina?.length > 0 && (
              <span style={{
                marginLeft: '.4rem', background: 'var(--crimson)', color: '#fff',
                borderRadius: '999px', padding: '1px 6px', fontSize: '.6rem'
              }}>{expediente.disciplina.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'asistencias' && (
        <>
          <div className="section-head">
            <h2>Historial de asistencias</h2>
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{
              fontFamily: 'var(--mono)', fontSize: '.75rem', padding: '.4rem .75rem',
              background: 'var(--paper-light)', border: '1px solid var(--line-strong)', borderRadius: '2px'
            }}>
              <option value="">Todas las materias</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Fecha</th>
                <th>Materia</th>
                <th>Estado</th>
                <th>Justificación</th>
              </tr>
            </thead>
            <tbody>
              {asistenciasFiltradas.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic', color: 'var(--ink-light)' }}>Sin registros</td></tr>
              )}
              {asistenciasFiltradas.map((a, i) => {
                const info = estadoInfo(a.estado);
                return (
                  <tr key={a.id}>
                    <td className="num">{String(i + 1).padStart(3, '0')}</td>
                    <td style={{ fontFamily: 'var(--serif)' }}>{new Date(a.fecha).toLocaleDateString('es-ES')}</td>
                    <td>{a.materia_nombre}</td>
                    <td><span className={`chip chip-${info.color}`}>{info.label}</span></td>
                    <td style={{ color: 'var(--ink-light)', fontSize: '.85rem' }}>{a.justificacion || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {tab === 'disciplina' && (
        <>
          <div className="section-head">
            <h2>Registros disciplinarios</h2>
            <span className="count">{expediente?.disciplina?.length || 0} registros</span>
          </div>
          {expediente?.disciplina?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
              Sin registros disciplinarios
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {expediente?.disciplina?.map(d => (
                <div key={d.id} style={{
                  padding: '.875rem 1rem', borderLeft: `4px solid ${TIPO_COLOR[d.tipo] || 'var(--gold)'}`,
                  background: 'var(--paper-dark)', borderRadius: '0 2px 2px 0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className={`chip ${TIPO_CHIP[d.tipo]}`}>{d.tipo}</span>
                    <span className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>
                      {new Date(d.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '.9rem', marginTop: '.5rem', marginBottom: '.4rem' }}>{d.descripcion}</p>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>
                    {d.materia_nombre && `${d.materia_nombre} · `}
                    Registrado por: {d.registrado_nombre} {d.registrado_apellido} ({d.registrado_rol})
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'comentarios' && (
        <>
          <div className="section-head">
            <h2>Observaciones y comentarios</h2>
            <span className="count">{expediente?.comentarios?.length || 0} registros</span>
          </div>
          {expediente?.comentarios?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
              Sin observaciones registradas
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {expediente?.comentarios?.map(c => {
                const color = COMENTARIO_COLOR[c.tipo] || 'var(--gold)';
                return (
                  <div key={c.id} style={{
                    padding: '.875rem 1rem', borderLeft: `4px solid ${color}`,
                    background: 'var(--paper-dark)', borderRadius: '0 2px 2px 0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="text-mono" style={{ fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color }}>
                        {c.tipo}
                      </span>
                      <span className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>
                        {new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '.95rem', marginTop: '.4rem' }}>
                      «{c.comentario}»
                    </p>
                    <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', marginTop: '.3rem' }}>
                      — {c.docente_nombre} {c.docente_apellido}
                      {c.materia_nombre && ` · ${c.materia_nombre}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <style>{`
        .res-bar { height: 6px; background: var(--paper-dark); border-radius: 2px; overflow: hidden; margin-bottom: 1rem; }
        .res-bar div { height: 100%; transition: width .5s ease; }
        .res-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; }
        .res-grid > div { display: flex; flex-direction: column; padding: .5rem; background: var(--paper-dark); border-radius: 2px; }
        .rlabel { font-family: var(--mono); font-size: .62rem; color: var(--ink-light); letter-spacing: .1em; text-transform: uppercase; }
        .rval { font-family: var(--serif); font-size: 1.25rem; font-weight: 500; margin-top: 2px; }
      `}</style>
    </>
  );
}
