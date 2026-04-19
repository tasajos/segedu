import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

export default function JefeEstudiantes() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [semestre, setSemestre] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [search, setSearch] = useState('');

  const cargar = async () => {
    const { data } = await api.get('/jefe/estudiantes', { params: semestre ? { semestre } : {} });
    setEstudiantes(data);
  };

  useEffect(() => { cargar(); }, [semestre]);

  const verDetalle = async (id) => {
    const { data } = await api.get(`/jefe/estudiantes/${id}`);
    setDetalle(data);
  };

  const filtrados = estudiantes.filter(e => {
    const t = search.toLowerCase();
    return e.nombre.toLowerCase().includes(t) || e.apellido.toLowerCase().includes(t) || e.codigo_estudiante?.toLowerCase().includes(t);
  });

  const semestres = [...new Set(estudiantes.map(e => e.semestre))].sort((a, b) => a - b);

  return (
    <>
      <PageHeader
        num="05"
        eyebrow="Directorio académico"
        title={<>Ficha de <span className="display-italic">estudiantes</span></>}
        lead="Consulte el expediente completo de cada estudiante: asistencias, capacitaciones y observaciones docentes."
      />

      <div className="flex gap-4 mb-6" style={{ alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o código…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '.75rem 1rem', border: '1px solid var(--line-strong)',
            borderRadius: '2px', background: 'var(--paper-light)', fontFamily: 'var(--sans)'
          }}
        />
        <select value={semestre} onChange={e => setSemestre(e.target.value)} style={{
          padding: '.75rem 1rem', border: '1px solid var(--line-strong)',
          borderRadius: '2px', background: 'var(--paper-light)', fontFamily: 'var(--mono)', fontSize: '.85rem'
        }}>
          <option value="">Todos los semestres</option>
          {semestres.map(s => <option key={s} value={s}>Semestre {s}</option>)}
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Código</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Carrera</th>
            <th>Semestre</th>
            <th style={{ textAlign: 'right' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.length === 0 && (
            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>Sin resultados</td></tr>
          )}
          {filtrados.map((e, i) => (
            <tr key={e.id}>
              <td className="num">{String(i + 1).padStart(3, '0')}</td>
              <td className="text-mono" style={{ fontSize: '.8rem' }}>{e.codigo_estudiante}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--ink)', color: 'var(--gold)',
                    display: 'grid', placeItems: 'center',
                    fontFamily: 'var(--serif)', fontSize: '.8rem'
                  }}>
                    {e.nombre[0]}{e.apellido[0]}
                  </div>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '.95rem' }}>
                    {e.nombre} {e.apellido}
                  </span>
                </div>
              </td>
              <td style={{ fontSize: '.85rem', color: 'var(--ink-light)' }}>{e.email}</td>
              <td style={{ fontSize: '.85rem' }}>{e.carrera_nombre || '—'}</td>
              <td><span className="chip chip-ink">SEM {e.semestre}</span></td>
              <td style={{ textAlign: 'right' }}>
                <button className="btn btn-primary btn-sm" onClick={() => verDetalle(e.id)}>Ver ficha</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={!!detalle} onClose={() => setDetalle(null)} title="Expediente del estudiante" maxWidth="780px">
        {detalle && (
          <>
            <div style={{
              padding: '1.5rem', background: 'var(--ink)', color: 'var(--paper)', borderRadius: '2px',
              marginBottom: '1.5rem', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                background: 'repeating-linear-gradient(45deg, var(--gold) 0 6px, transparent 6px 12px)'
              }}/>
              <div className="flex items-center gap-4">
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'var(--gold)', color: 'var(--ink)',
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--serif)', fontSize: '1.5rem'
                }}>
                  {detalle.estudiante.nombre[0]}{detalle.estudiante.apellido[0]}
                </div>
                <div>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold)', letterSpacing: '.15em' }}>
                    {detalle.estudiante.codigo_estudiante}
                  </div>
                  <h2 style={{ color: 'var(--paper)', fontSize: '1.75rem', marginTop: '.25rem' }}>
                    {detalle.estudiante.nombre} {detalle.estudiante.apellido}
                  </h2>
                  <div style={{ fontSize: '.85rem', opacity: .8 }}>
                    {detalle.estudiante.carrera_nombre} · Semestre {detalle.estudiante.semestre}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.75rem', fontSize: '.8rem' }}>
                <div><div className="text-mono" style={{ fontSize: '.65rem', opacity: .6, letterSpacing: '.1em' }}>CI</div>{detalle.estudiante.ci || '—'}</div>
                <div><div className="text-mono" style={{ fontSize: '.65rem', opacity: .6, letterSpacing: '.1em' }}>TEL</div>{detalle.estudiante.telefono || '—'}</div>
                <div><div className="text-mono" style={{ fontSize: '.65rem', opacity: .6, letterSpacing: '.1em' }}>EMAIL</div>{detalle.estudiante.email}</div>
              </div>
            </div>

            {/* Asistencias */}
            <div className="section-head"><h2>Asistencias</h2></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.5rem', marginBottom: '1.5rem' }}>
              {['presente', 'falta', 'permiso', 'tarde'].map(est => {
                const v = detalle.asistencias.find(a => a.estado === est)?.total || 0;
                const color = est === 'presente' ? 'forest' : est === 'falta' ? 'crimson' : est === 'permiso' ? 'gold' : 'ink';
                return (
                  <div key={est} className="card" style={{ padding: '.75rem', textAlign: 'center' }}>
                    <div className="text-serif" style={{ fontSize: '1.75rem' }}>{v}</div>
                    <div className="text-mono" style={{ fontSize: '.6rem', color: 'var(--ink-light)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                      {est}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Materias */}
            <div className="section-head"><h2>Materias inscritas</h2><span className="count">{detalle.materias.length}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.5rem' }}>
              {detalle.materias.map(m => (
                <div key={m.id} style={{ padding: '.75rem 1rem', background: 'var(--paper-dark)', borderRadius: '2px', fontSize: '.9rem' }}>
                  <strong>{m.nombre}</strong> <span className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>· {m.codigo}</span>
                </div>
              ))}
            </div>

            {/* Cursos */}
            <div className="section-head"><h2>Capacitaciones</h2><span className="count">{detalle.cursos.length}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.5rem' }}>
              {detalle.cursos.length === 0 && <div style={{ color: 'var(--ink-light)', fontStyle: 'italic' }}>Sin cursos registrados</div>}
              {detalle.cursos.map(c => (
                <div key={c.id} style={{ padding: '.75rem 1rem', background: 'var(--paper-dark)', borderRadius: '2px', fontSize: '.9rem' }}>
                  <strong>{c.nombre_curso}</strong> <span style={{ color: 'var(--ink-light)' }}>· {c.institucion} · {c.horas}h</span>
                </div>
              ))}
            </div>

            {/* Comentarios */}
            <div className="section-head"><h2>Observaciones docentes</h2><span className="count">{detalle.comentarios.length}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {detalle.comentarios.length === 0 && <div style={{ color: 'var(--ink-light)', fontStyle: 'italic' }}>Sin comentarios registrados</div>}
              {detalle.comentarios.map(c => {
                const color = c.tipo === 'alerta' ? 'var(--crimson)' : c.tipo === 'felicitacion' || c.tipo === 'positivo' ? 'var(--forest)' : 'var(--gold)';
                return (
                  <div key={c.id} style={{ padding: '.75rem 1rem', borderLeft: `3px solid ${color}`, background: 'var(--paper-dark)' }}>
                    <div className="flex justify-between">
                      <span className="text-mono" style={{ fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color }}>
                        {c.tipo}
                      </span>
                      <span className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)' }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '.9rem', marginTop: '.35rem' }}>
                      «{c.comentario}»
                    </p>
                    <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)', marginTop: '.25rem' }}>
                      — {c.docente_nombre} {c.docente_apellido}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
