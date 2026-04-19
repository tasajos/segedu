import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const ESTADOS = ['presente', 'falta', 'permiso', 'tarde'];
const ESTADO_COLOR = { presente: 'var(--forest)', falta: 'var(--crimson)', permiso: 'var(--gold)', tarde: '#7b6d3f' };

export default function DocenteAsistencia() {
  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [estudiantes, setEstudiantes] = useState([]);
  const [estados, setEstados] = useState({});
  const [justificaciones, setJustificaciones] = useState({});
  const [sesiones, setSesiones] = useState([]);
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [vista, setVista] = useState('llamar');

  useEffect(() => {
    api.get('/docente/materias').then(r => {
      setMaterias(r.data);
      if (r.data.length > 0) setMateriaId(String(r.data[0].id));
    });
  }, []);

  useEffect(() => {
    if (!materiaId) return;
    api.get(`/docente/materias/${materiaId}/estudiantes`).then(r => {
      setEstudiantes(r.data);
      const init = {};
      r.data.forEach(e => { init[e.id] = 'presente'; });
      setEstados(init);
      setJustificaciones({});
    });
    api.get('/docente/asistencia/sesiones', { params: { materia_id: materiaId } }).then(r => setSesiones(r.data));
  }, [materiaId]);

  const setEstado = (estId, val) => setEstados(p => ({ ...p, [estId]: val }));
  const setJustif = (estId, val) => setJustificaciones(p => ({ ...p, [estId]: val }));

  const marcarTodos = (estado) => {
    const next = {};
    estudiantes.forEach(e => { next[e.id] = estado; });
    setEstados(next);
  };

  const guardar = async () => {
    if (!materiaId || !fecha || estudiantes.length === 0) return;
    setSaving(true);
    setGuardado(false);
    try {
      const registros = estudiantes.map(e => ({
        estudiante_id: e.id,
        estado: estados[e.id] || 'presente',
        justificacion: justificaciones[e.id] || null
      }));
      await api.post('/docente/asistencia/lista', { materia_id: materiaId, fecha, registros });
      setGuardado(true);
      api.get('/docente/asistencia/sesiones', { params: { materia_id: materiaId } }).then(r => setSesiones(r.data));
      setTimeout(() => setGuardado(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const materia = materias.find(m => String(m.id) === materiaId);
  const presentes = Object.values(estados).filter(v => v === 'presente').length;
  const faltas = Object.values(estados).filter(v => v === 'falta').length;

  return (
    <>
      <PageHeader
        num="05"
        eyebrow="Control de asistencia"
        title={<>Lista de <span className="display-italic">asistencia</span></>}
        lead="Llame la lista de asistencia para cada sesión de clase y registre el estado de cada estudiante."
      />

      {/* Selector materia + fecha */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginBottom: '1.5rem', alignItems: 'end' }}>
        <div>
          <label className="form-label">Materia</label>
          <select className="form-input" value={materiaId} onChange={e => setMateriaId(e.target.value)}>
            {materias.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Fecha de la sesión</label>
          <input className="form-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button
            className={`btn ${vista === 'llamar' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setVista('llamar')}
          >Llamar lista</button>
          <button
            className={`btn ${vista === 'historial' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setVista('historial')}
          >Historial</button>
        </div>
      </div>

      {vista === 'llamar' && (
        <>
          {/* Resumen rápido */}
          {estudiantes.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.75rem', marginBottom: '1.5rem' }}>
              {ESTADOS.map(est => {
                const count = Object.values(estados).filter(v => v === est).length;
                return (
                  <div key={est} style={{
                    padding: '.75rem 1rem', background: 'var(--paper-dark)', borderRadius: '2px',
                    borderTop: `3px solid ${ESTADO_COLOR[est]}`, cursor: 'pointer'
                  }} onClick={() => marcarTodos(est)}>
                    <div className="text-serif" style={{ fontSize: '1.5rem', lineHeight: 1 }}>{count}</div>
                    <div className="text-mono" style={{ fontSize: '.65rem', color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: '.2rem' }}>
                      {est}
                    </div>
                    <div style={{ fontSize: '.65rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                      clic = marcar todos
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botones rápidos */}
          <div className="flex gap-3 mb-4" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: '.85rem', color: 'var(--ink-light)' }}>Marcar todos como:</span>
            {ESTADOS.map(est => (
              <button key={est} className="btn btn-secondary btn-sm" onClick={() => marcarTodos(est)}>
                {est}
              </button>
            ))}
          </div>

          {/* Lista de estudiantes */}
          {estudiantes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
              Sin estudiantes inscritos en esta materia
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.5rem' }}>
              {estudiantes.map((est, i) => (
                <div key={est.id} style={{
                  padding: '.875rem 1rem', background: 'var(--paper-dark)', borderRadius: '2px',
                  borderLeft: `4px solid ${ESTADO_COLOR[estados[est.id] || 'presente']}`,
                  transition: 'border-color .2s'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: '1rem', alignItems: 'center' }}>
                    <span className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem' }}>{est.nombre} {est.apellido}</div>
                      <div className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>{est.codigo_estudiante}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '.35rem' }}>
                      {ESTADOS.map(e => (
                        <button key={e} onClick={() => setEstado(est.id, e)} style={{
                          padding: '.3rem .6rem', border: '1px solid',
                          borderColor: estados[est.id] === e ? ESTADO_COLOR[e] : 'var(--line-strong)',
                          background: estados[est.id] === e ? ESTADO_COLOR[e] : 'transparent',
                          color: estados[est.id] === e ? '#fff' : 'var(--ink-light)',
                          borderRadius: '2px', cursor: 'pointer',
                          fontFamily: 'var(--mono)', fontSize: '.68rem',
                          textTransform: 'uppercase', letterSpacing: '.06em',
                          transition: 'all .15s'
                        }}>
                          {e.slice(0, 4)}
                        </button>
                      ))}
                    </div>
                    <div style={{ width: '160px' }}>
                      {(estados[est.id] === 'permiso' || estados[est.id] === 'falta') && (
                        <input
                          type="text"
                          placeholder="Justificación…"
                          value={justificaciones[est.id] || ''}
                          onChange={e => setJustif(est.id, e.target.value)}
                          style={{
                            width: '100%', padding: '.3rem .5rem', fontSize: '.78rem',
                            border: '1px solid var(--line-strong)', borderRadius: '2px',
                            background: 'var(--paper-light)', fontFamily: 'var(--sans)'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {estudiantes.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--ink)', color: 'var(--paper)', borderRadius: '2px' }}>
              <div className="text-mono" style={{ fontSize: '.8rem' }}>
                {materia?.nombre} · {fecha} · {presentes} presentes, {faltas} faltas
              </div>
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                {guardado && (
                  <span style={{ color: '#7ecb87', fontFamily: 'var(--mono)', fontSize: '.8rem' }}>
                    ✓ Lista guardada
                  </span>
                )}
                <button className="btn btn-primary" onClick={guardar} disabled={saving}>
                  {saving ? 'Guardando…' : 'Registrar lista'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {vista === 'historial' && (
        <>
          <div className="section-head" style={{ marginBottom: '1rem' }}>
            <h2>Sesiones registradas</h2>
            <span className="count">{sesiones.length} sesiones</span>
          </div>
          {sesiones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
              Sin sesiones registradas para esta materia
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Materia</th>
                  <th>Total</th>
                  <th>Presentes</th>
                  <th>Faltas</th>
                  <th>Permisos</th>
                  <th>Tardes</th>
                </tr>
              </thead>
              <tbody>
                {sesiones.map((s, i) => (
                  <tr key={i}>
                    <td className="text-mono" style={{ fontSize: '.85rem' }}>
                      {new Date(s.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </td>
                    <td style={{ fontSize: '.9rem' }}>{s.materia_nombre}</td>
                    <td className="text-mono">{s.total_registros}</td>
                    <td><span className="chip chip-forest">{s.presentes}</span></td>
                    <td><span className="chip chip-crimson">{s.faltas}</span></td>
                    <td><span className="chip chip-gold">{s.permisos}</span></td>
                    <td><span className="chip chip-ink">{s.tardes}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </>
  );
}
