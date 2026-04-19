import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';

const ESTADOS = ['presente', 'falta', 'permiso', 'tarde'];
const ESTADO_COLOR = {
  presente: '#16a34a',
  falta: '#dc2626',
  permiso: '#d97706',
  tarde: '#2563eb'
};
const ESTADO_BG = {
  presente: '#f0fdf4',
  falta: '#fef2f2',
  permiso: '#fffbeb',
  tarde: '#eff6ff'
};
const ESTADO_BORDER = {
  presente: '#bbf7d0',
  falta: '#fecaca',
  permiso: '#fde68a',
  tarde: '#bfdbfe'
};
const ESTADO_LABEL = {
  presente: 'Presente',
  falta: 'Falta',
  permiso: 'Permiso',
  tarde: 'Tarde'
};

const getTodayLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateEs = (value, withWeekday = false) => {
  if (!value) return '';
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', withWeekday
    ? { weekday: 'short', day: 'numeric', month: 'short' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function DocenteAsistencia() {
  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState('');
  const [fecha, setFecha] = useState(getTodayLocal());
  const [estudiantes, setEstudiantes] = useState([]);
  const [estados, setEstados] = useState({});
  const [justificaciones, setJustificaciones] = useState({});
  const [sesiones, setSesiones] = useState([]);
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [vista, setVista] = useState('llamar');

  useEffect(() => {
    api.get('/docente/materias').then((r) => {
      setMaterias(r.data);
      if (r.data.length > 0) setMateriaId(String(r.data[0].id));
    });
  }, []);

  useEffect(() => {
    if (!materiaId) return;
    api.get(`/docente/materias/${materiaId}/estudiantes`).then((r) => {
      setEstudiantes(r.data);
      const init = {};
      r.data.forEach((e) => {
        init[e.id] = 'presente';
      });
      setEstados(init);
      setJustificaciones({});
    });
    api.get('/docente/asistencia/sesiones', { params: { materia_id: materiaId } }).then((r) => setSesiones(r.data));
  }, [materiaId]);

  const setEstado = (estId, val) => setEstados((p) => ({ ...p, [estId]: val }));
  const setJustif = (estId, val) => setJustificaciones((p) => ({ ...p, [estId]: val }));

  const marcarTodos = (estado) => {
    const next = {};
    estudiantes.forEach((e) => {
      next[e.id] = estado;
    });
    setEstados(next);
  };

  const guardar = async () => {
    if (!materiaId || !fecha || estudiantes.length === 0) return;
    setSaving(true);
    setGuardado(false);
    try {
      const registros = estudiantes.map((e) => ({
        estudiante_id: e.id,
        estado: estados[e.id] || 'presente',
        justificacion: justificaciones[e.id] || null
      }));
      await api.post('/docente/asistencia/lista', { materia_id: materiaId, fecha, registros });
      setGuardado(true);
      api.get('/docente/asistencia/sesiones', { params: { materia_id: materiaId } }).then((r) => setSesiones(r.data));
      setTimeout(() => setGuardado(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const materia = materias.find((m) => String(m.id) === materiaId);
  const presentes = Object.values(estados).filter((v) => v === 'presente').length;
  const faltas = Object.values(estados).filter((v) => v === 'falta').length;

  return (
    <>
      <PageHeader
        num="05"
        eyebrow="Control de asistencia"
        title={<>Lista de <span className="display-italic">asistencia</span></>}
        lead="Llame la lista de asistencia para cada sesion de clase y registre el estado de cada estudiante."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginBottom: '1.5rem', alignItems: 'end' }}>
        <div>
          <label className="form-label">Materia</label>
          <select className="form-input" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.codigo}) - Grupo {m.grupo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Fecha de la sesion</label>
          <input className="form-input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button
            className={`btn ${vista === 'llamar' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setVista('llamar')}
          >
            Llamar lista
          </button>
          <button
            className={`btn ${vista === 'historial' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setVista('historial')}
          >
            Historial
          </button>
        </div>
      </div>

      {vista === 'llamar' && (
        <>
          {estudiantes.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.75rem', marginBottom: '1.5rem' }}>
              {ESTADOS.map((est) => {
                const count = Object.values(estados).filter((v) => v === est).length;
                return (
                  <div
                    key={est}
                    style={{
                      padding: '1rem 1.1rem',
                      background: ESTADO_BG[est],
                      borderRadius: '10px',
                      border: `1px solid ${ESTADO_BORDER[est]}`,
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer'
                    }}
                    onClick={() => marcarTodos(est)}
                  >
                    <div className="text-serif" style={{ fontSize: '2rem', lineHeight: 1, color: ESTADO_COLOR[est] }}>{count}</div>
                    <div className="text-mono" style={{ fontSize: '.68rem', color: ESTADO_COLOR[est], textTransform: 'uppercase', letterSpacing: '.1em', marginTop: '.35rem', fontWeight: 700 }}>
                      {ESTADO_LABEL[est]}
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.35rem' }}>
                      clic para marcar todos
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 mb-4" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: '.85rem', color: 'var(--ink-light)' }}>Marcar todos como:</span>
            {ESTADOS.map((est) => (
              <button
                key={est}
                onClick={() => marcarTodos(est)}
                style={{
                  padding: '.5rem .95rem',
                  borderRadius: '999px',
                  border: `1px solid ${ESTADO_BORDER[est]}`,
                  background: ESTADO_BG[est],
                  color: ESTADO_COLOR[est],
                  fontWeight: 700,
                  fontSize: '.8rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {ESTADO_LABEL[est]}
              </button>
            ))}
          </div>

          {estudiantes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
              Sin estudiantes inscritos en esta materia
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.5rem' }}>
              {estudiantes.map((est, i) => (
                <div
                  key={est.id}
                  style={{
                    padding: '1rem 1.1rem',
                    background: ESTADO_BG[estados[est.id] || 'presente'],
                    borderRadius: '12px',
                    border: `1px solid ${ESTADO_BORDER[estados[est.id] || 'presente']}`,
                    borderLeft: `4px solid ${ESTADO_COLOR[estados[est.id] || 'presente']}`,
                    transition: 'border-color .2s, background .2s',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: '1rem', alignItems: 'center' }}>
                    <span className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem' }}>{est.nombre} {est.apellido}</div>
                      <div className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>{est.codigo_estudiante}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '.35rem' }}>
                      {ESTADOS.map((e) => (
                        <button
                          key={e}
                          onClick={() => setEstado(est.id, e)}
                          style={{
                            padding: '.45rem .8rem',
                            border: '1px solid',
                            borderColor: estados[est.id] === e ? ESTADO_COLOR[e] : ESTADO_BORDER[e],
                            background: estados[est.id] === e ? ESTADO_COLOR[e] : '#fff',
                            color: estados[est.id] === e ? '#fff' : ESTADO_COLOR[e],
                            borderRadius: '999px',
                            cursor: 'pointer',
                            fontFamily: 'var(--sans)',
                            fontSize: '.75rem',
                            fontWeight: 700,
                            transition: 'all .15s',
                            minWidth: '88px',
                            boxShadow: estados[est.id] === e ? 'var(--shadow-sm)' : 'none'
                          }}
                        >
                          {ESTADO_LABEL[e]}
                        </button>
                      ))}
                    </div>
                    <div style={{ width: '160px' }}>
                      {(estados[est.id] === 'permiso' || estados[est.id] === 'falta') && (
                        <input
                          type="text"
                          placeholder="Justificacion..."
                          value={justificaciones[est.id] || ''}
                          onChange={(e) => setJustif(est.id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '.3rem .5rem',
                            fontSize: '.78rem',
                            border: '1px solid var(--line-strong)',
                            borderRadius: '2px',
                            background: 'var(--paper-light)',
                            fontFamily: 'var(--sans)'
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
                {materia?.nombre} - Grupo {materia?.grupo} - {fecha} - {presentes} presentes, {faltas} faltas
              </div>
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                {guardado && (
                  <span style={{ color: '#7ecb87', fontFamily: 'var(--mono)', fontSize: '.8rem' }}>
                    Lista guardada
                  </span>
                )}
                <button className="btn btn-primary" onClick={guardar} disabled={saving}>
                  {saving ? 'Guardando...' : 'Registrar lista'}
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
                      {formatDateEs(s.fecha, true)}
                    </td>
                    <td style={{ fontSize: '.9rem' }}>
                      {s.materia_nombre}{s.grupo ? ` - Grupo ${s.grupo}` : ''}
                    </td>
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
