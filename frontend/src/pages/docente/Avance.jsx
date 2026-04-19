import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

export default function DocenteAvance() {
  const [avances, setAvances] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    materia_id: '', tema: '', descripcion: '', porcentaje_avance: 0,
    fecha: new Date().toISOString().slice(0, 10)
  });

  const cargar = async () => {
    const [a, m] = await Promise.all([
      api.get('/docente/avance', { params: filter ? { materia_id: filter } : {} }),
      api.get('/docente/materias')
    ]);
    setAvances(a.data); setMaterias(m.data);
  };

  useEffect(() => { cargar(); }, [filter]);

  const guardar = async (e) => {
    e.preventDefault();
    await api.post('/docente/avance', form);
    setOpen(false);
    setForm({ materia_id: '', tema: '', descripcion: '', porcentaje_avance: 0, fecha: new Date().toISOString().slice(0, 10) });
    cargar();
  };

  return (
    <>
      <PageHeader
        num="03"
        eyebrow="Seguimiento curricular"
        title={<>Avance de <span className="display-italic">materia</span></>}
        lead="Registre el avance temático de cada materia. La jefatura revisará y validará cada registro."
        actions={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Marcar avance</button>}
      />

      <div className="section-head">
        <h2>Registros</h2>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{
          fontFamily: 'var(--mono)', fontSize: '.75rem', padding: '.4rem .75rem',
          background: 'var(--paper-light)', border: '1px solid var(--line-strong)', borderRadius: '2px'
        }}>
          <option value="">Todas las materias</option>
          {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </div>

      {/* Timeline vertical */}
      <div className="timeline">
        {avances.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--line-strong)' }}>
            <p className="display-italic" style={{ fontSize: '1.1rem', color: 'var(--ink-light)' }}>Sin avances registrados</p>
          </div>
        )}
        {avances.map((a, i) => (
          <div key={a.id} className="timeline-item">
            <div className="timeline-dot">
              {a.validado ? '✓' : String(i + 1).padStart(2, '0')}
            </div>
            <div className="timeline-content card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold-dark)', letterSpacing: '.12em' }}>
                    {a.fecha} · {a.materia_nombre}
                  </span>
                </div>
                {a.validado
                  ? <span className="chip chip-forest">✓ Validado</span>
                  : <span className="chip chip-gold">Pendiente validación</span>}
              </div>
              <h3>{a.tema}</h3>
              {a.descripcion && <p style={{ marginTop: '.5rem', color: 'var(--ink-soft)', fontSize: '.9rem' }}>{a.descripcion}</p>}

              <div style={{ marginTop: '1rem' }}>
                <div className="flex justify-between" style={{ fontSize: '.75rem', marginBottom: '.35rem' }}>
                  <span className="text-mono text-muted">PROGRESO</span>
                  <span className="text-mono">{a.porcentaje_avance}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--paper-dark)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${a.porcentaje_avance}%`, height: '100%', background: 'var(--ink)', transition: 'width .5s' }} />
                </div>
              </div>

              {a.observaciones && (
                <div style={{
                  marginTop: '.75rem', padding: '.75rem', background: 'rgba(139,42,42,.06)',
                  borderLeft: '3px solid var(--crimson)', fontSize: '.85rem', fontStyle: 'italic'
                }}>
                  <strong style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', letterSpacing: '.1em' }}>OBSERVACIÓN:</strong> {a.observaciones}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar avance">
        <form onSubmit={guardar}>
          <div className="form-field">
            <label>Materia *</label>
            <select value={form.materia_id} onChange={e => setForm({...form, materia_id: e.target.value})} required>
              <option value="">Seleccione una materia</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Tema *</label>
            <input value={form.tema} onChange={e => setForm({...form, tema: e.target.value})} required/>
          </div>
          <div className="form-field">
            <label>Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}/>
          </div>
          <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="form-field">
              <label>Fecha *</label>
              <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} required/>
            </div>
            <div className="form-field">
              <label>Porcentaje de avance *</label>
              <input type="number" min="0" max="100" value={form.porcentaje_avance}
                onChange={e => setForm({...form, porcentaje_avance: e.target.value})} required/>
            </div>
          </div>
          <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary">Guardar avance</button>
          </div>
        </form>
      </Modal>

      <style>{`
        .timeline { position: relative; padding-left: 2rem; }
        .timeline::before {
          content: ''; position: absolute;
          left: 20px; top: 0; bottom: 0;
          width: 1px; background: var(--line-strong);
        }
        .timeline-item { position: relative; margin-bottom: 1.25rem; }
        .timeline-dot {
          position: absolute;
          left: -2rem; top: 1.25rem;
          width: 36px; height: 36px;
          background: var(--paper-light);
          border: 2px solid var(--ink);
          border-radius: 50%;
          display: grid; place-items: center;
          font-family: var(--mono);
          font-size: .75rem;
          font-weight: 500;
          z-index: 2;
        }
        .timeline-content { margin-left: 1.5rem; }
      `}</style>
    </>
  );
}
