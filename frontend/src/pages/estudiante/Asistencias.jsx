import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const ESTADOS = [
  { val: 'presente', label: 'Presente', color: 'forest' },
  { val: 'falta', label: 'Falta', color: 'crimson' },
  { val: 'permiso', label: 'Permiso', color: 'gold' },
  { val: 'tarde', label: 'Tarde', color: 'ink' }
];

export default function EstudianteAsistencias() {
  const [materias, setMaterias] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [resumen, setResumen] = useState([]);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ materia_id: '', fecha: new Date().toISOString().slice(0,10), estado: 'presente', justificacion: '' });

  const cargar = async () => {
    const [m, a, r] = await Promise.all([
      api.get('/estudiante/materias'),
      api.get('/estudiante/asistencias', { params: filter ? { materia_id: filter } : {} }),
      api.get('/estudiante/asistencias/resumen')
    ]);
    setMaterias(m.data);
    setAsistencias(a.data);
    setResumen(r.data);
  };

  useEffect(() => { cargar(); }, [filter]);

  const guardar = async (e) => {
    e.preventDefault();
    await api.post('/estudiante/asistencias', form);
    setOpen(false);
    setForm({ materia_id: '', fecha: new Date().toISOString().slice(0,10), estado: 'presente', justificacion: '' });
    cargar();
  };

  const estadoInfo = (v) => ESTADOS.find(e => e.val === v) || ESTADOS[0];

  return (
    <>
      <PageHeader
        num="04"
        eyebrow="Control académico"
        title={<>Registro de <span className="display-italic">asistencias</span></>}
        lead="Visualice sus asistencias, faltas, permisos y tardanzas por materia."
        actions={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Registrar</button>}
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

      {/* Historial */}
      <div className="section-head">
        <h2>Historial</h2>
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
          {asistencias.length === 0 && (
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic', color: 'var(--ink-light)' }}>Sin registros</td></tr>
          )}
          {asistencias.map((a, i) => {
            const info = estadoInfo(a.estado);
            return (
              <tr key={a.id}>
                <td className="num">{String(i + 1).padStart(3, '0')}</td>
                <td style={{ fontFamily: 'var(--serif)' }}>{a.fecha}</td>
                <td>{a.materia_nombre}</td>
                <td><span className={`chip chip-${info.color}`}>{info.label}</span></td>
                <td style={{ color: 'var(--ink-light)', fontSize: '.85rem' }}>{a.justificacion || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar asistencia">
        <form onSubmit={guardar}>
          <div className="form-field">
            <label>Materia *</label>
            <select value={form.materia_id} onChange={e => setForm({...form, materia_id: e.target.value})} required>
              <option value="">Seleccione una materia</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="form-field">
              <label>Fecha *</label>
              <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} required/>
            </div>
            <div className="form-field">
              <label>Estado *</label>
              <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} required>
                {ESTADOS.map(e => <option key={e.val} value={e.val}>{e.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-field">
            <label>Justificación (opcional)</label>
            <textarea value={form.justificacion} onChange={e => setForm({...form, justificacion: e.target.value})}/>
          </div>
          <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>

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
