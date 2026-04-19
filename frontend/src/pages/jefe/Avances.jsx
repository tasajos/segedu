import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

export default function JefeAvances() {
  const [avances, setAvances] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ validado: true, observaciones: '' });

  const cargar = async () => {
    const { data } = await api.get('/jefe/avances');
    setAvances(data);
  };

  useEffect(() => { cargar(); }, []);

  const abrir = (a) => {
    setSelected(a);
    setForm({ validado: a.validado, observaciones: a.observaciones || '' });
  };

  const guardar = async (e) => {
    e.preventDefault();
    await api.put(`/jefe/avances/${selected.id}`, form);
    setSelected(null);
    cargar();
  };

  const pendientes = avances.filter(a => !a.validado).length;
  const validados = avances.filter(a => a.validado).length;

  return (
    <>
      <PageHeader
        num="03"
        eyebrow="Supervisión curricular"
        title={<>Validar <span className="display-italic">avances</span></>}
        lead="Valide el avance de materias reportado por docentes. Verifique coherencia con el PGO aprobado."
      />

      <div className="grid-4 mb-8">
        <div className="card"><div className="eyebrow">Total</div><div className="text-serif" style={{ fontSize: '2.5rem' }}>{avances.length}</div></div>
        <div className="card" style={{ borderLeft: '4px solid var(--gold)' }}>
          <div className="eyebrow">Pendientes</div>
          <div className="text-serif" style={{ fontSize: '2.5rem', color: 'var(--gold-dark)' }}>{pendientes}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--forest)' }}>
          <div className="eyebrow">Validados</div>
          <div className="text-serif" style={{ fontSize: '2.5rem', color: 'var(--forest)' }}>{validados}</div>
        </div>
        <div className="card">
          <div className="eyebrow">% Validación</div>
          <div className="text-serif" style={{ fontSize: '2.5rem' }}>
            {avances.length ? Math.round(validados*100/avances.length) : 0}%
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>Avances registrados</h2>
        <span className="count">{avances.length} registros</span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Fecha</th>
            <th>Materia</th>
            <th>Docente</th>
            <th>Tema</th>
            <th>Avance</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {avances.map((a, i) => (
            <tr key={a.id}>
              <td className="num">{String(i + 1).padStart(3, '0')}</td>
              <td className="text-mono" style={{ fontSize: '.8rem' }}>{a.fecha}</td>
              <td>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem' }}>{a.materia_nombre}</div>
                <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)' }}>{a.materia_codigo}</div>
              </td>
              <td style={{ fontSize: '.85rem' }}>{a.docente_nombre} {a.docente_apellido}</td>
              <td>{a.tema}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', minWidth: '120px' }}>
                  <div style={{ flex: 1, height: '6px', background: 'var(--paper-dark)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${a.porcentaje_avance}%`, height: '100%', background: 'var(--ink)' }}/>
                  </div>
                  <span className="text-mono" style={{ fontSize: '.75rem' }}>{a.porcentaje_avance}%</span>
                </div>
              </td>
              <td>
                {a.validado
                  ? <span className="chip chip-forest">✓ Validado</span>
                  : <span className="chip chip-gold">Pendiente</span>}
              </td>
              <td style={{ textAlign: 'right' }}>
                <button className="btn btn-primary btn-sm" onClick={() => abrir(a)}>
                  {a.validado ? 'Revisar' : 'Validar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Validar avance">
        {selected && (
          <>
            <div style={{
              padding: '1rem', background: 'var(--paper-dark)', borderRadius: '2px', marginBottom: '1.25rem'
            }}>
              <div className="eyebrow">{selected.materia_codigo} · {selected.fecha}</div>
              <h3 style={{ marginTop: '.25rem' }}>{selected.tema}</h3>
              <div style={{ marginTop: '.5rem', fontSize: '.85rem' }}>
                Docente: <strong>{selected.docente_nombre} {selected.docente_apellido}</strong>
              </div>
              {selected.descripcion && <p style={{ marginTop: '.5rem', fontSize: '.85rem' }}>{selected.descripcion}</p>}
              <div style={{ marginTop: '.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginBottom: '.25rem' }}>
                  <span className="text-mono text-muted">AVANCE REPORTADO</span>
                  <span className="text-mono"><strong>{selected.porcentaje_avance}%</strong></span>
                </div>
                <div style={{ height: '6px', background: 'var(--paper)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${selected.porcentaje_avance}%`, height: '100%', background: 'var(--ink)' }}/>
                </div>
              </div>
            </div>

            <form onSubmit={guardar}>
              <div className="form-field">
                <label>Decisión *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.5rem' }}>
                  <label style={{
                    padding: '.85rem', border: `1.5px solid ${form.validado ? 'var(--forest)' : 'var(--line-strong)'}`,
                    background: form.validado ? 'rgba(58,90,63,.08)' : 'transparent',
                    borderRadius: '2px', textAlign: 'center', cursor: 'pointer'
                  }}>
                    <input type="radio" checked={form.validado} onChange={() => setForm({...form, validado: true})} style={{ display: 'none' }}/>
                    ✓ Validar
                  </label>
                  <label style={{
                    padding: '.85rem', border: `1.5px solid ${!form.validado ? 'var(--crimson)' : 'var(--line-strong)'}`,
                    background: !form.validado ? 'rgba(139,42,42,.08)' : 'transparent',
                    borderRadius: '2px', textAlign: 'center', cursor: 'pointer'
                  }}>
                    <input type="radio" checked={!form.validado} onChange={() => setForm({...form, validado: false})} style={{ display: 'none' }}/>
                    Rechazar
                  </label>
                </div>
              </div>
              <div className="form-field">
                <label>Observaciones</label>
                <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} rows="3"/>
              </div>
              <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>Cancelar</button>
                <button className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </>
  );
}
