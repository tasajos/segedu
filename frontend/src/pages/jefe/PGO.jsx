import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const ESTADOS = {
  borrador: { cls: 'chip-ink', txt: 'Borrador' },
  enviado: { cls: 'chip-gold', txt: 'Enviado' },
  revision: { cls: 'chip-gold', txt: 'En revisión' },
  aprobado: { cls: 'chip-forest', txt: 'Aprobado' },
  rechazado: { cls: 'chip-crimson', txt: 'Rechazado' }
};

export default function JefePGO() {
  const [pgoList, setPgoList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ estado: 'aprobado', observaciones: '' });

  const cargar = async () => {
    const { data } = await api.get('/jefe/pgo');
    setPgoList(data);
  };

  useEffect(() => { cargar(); }, []);

  const abrirRevision = (p) => {
    setSelected(p);
    setForm({ estado: p.estado, observaciones: p.observaciones || '' });
  };

  const revisar = async (e) => {
    e.preventDefault();
    await api.put(`/jefe/pgo/${selected.id}`, form);
    setSelected(null);
    cargar();
  };

  return (
    <>
      <PageHeader
        num="02"
        eyebrow="Revisión documental"
        title={<>Planes <span className="display-italic">globales operativos</span></>}
        lead="Revise, apruebe o solicite correcciones de los PGO enviados por el cuerpo docente."
      />

      <div className="section-head">
        <h2>PGO recibidos</h2>
        <span className="count">{pgoList.length} documentos</span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Materia</th>
            <th>Docente</th>
            <th>Período</th>
            <th>Enviado</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pgoList.length === 0 && (
            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>Sin PGO pendientes</td></tr>
          )}
          {pgoList.map((p, i) => {
            const est = ESTADOS[p.estado] || ESTADOS.enviado;
            return (
              <tr key={p.id}>
                <td className="num">{String(i + 1).padStart(3, '0')}</td>
                <td>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem' }}>{p.materia_nombre}</div>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>{p.materia_codigo}</div>
                </td>
                <td>{p.docente_nombre} {p.docente_apellido}</td>
                <td className="text-mono" style={{ fontSize: '.8rem' }}>{p.periodo}</td>
                <td className="text-mono" style={{ fontSize: '.8rem', color: 'var(--ink-light)' }}>
                  {new Date(p.fecha_envio).toLocaleDateString()}
                </td>
                <td><span className={`chip ${est.cls}`}>{est.txt}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '.5rem' }}>
                    {p.archivo_url && (
                      <a href={p.archivo_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Ver</a>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={() => abrirRevision(p)}>Revisar</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Revisar PGO">
        {selected && (
          <>
            <div style={{
              padding: '1rem', background: 'var(--paper-dark)', borderRadius: '2px', marginBottom: '1.25rem',
              borderLeft: '3px solid var(--gold)'
            }}>
              <div className="eyebrow">{selected.materia_codigo} · {selected.periodo}</div>
              <h3 style={{ marginTop: '.25rem' }}>{selected.titulo}</h3>
              <div className="text-muted" style={{ fontSize: '.85rem' }}>
                Por {selected.docente_nombre} {selected.docente_apellido}
              </div>
              {selected.descripcion && <p style={{ marginTop: '.5rem', fontSize: '.85rem' }}>{selected.descripcion}</p>}
            </div>

            <form onSubmit={revisar}>
              <div className="form-field">
                <label>Decisión *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.5rem' }}>
                  {[
                    { val: 'aprobado', label: 'Aprobar', color: 'var(--forest)' },
                    { val: 'revision', label: 'Solicitar cambios', color: 'var(--gold-dark)' },
                    { val: 'rechazado', label: 'Rechazar', color: 'var(--crimson)' }
                  ].map(op => (
                    <label key={op.val} style={{
                      padding: '.75rem', border: `1.5px solid ${form.estado === op.val ? op.color : 'var(--line-strong)'}`,
                      background: form.estado === op.val ? `${op.color}15` : 'transparent',
                      borderRadius: '2px', textAlign: 'center', cursor: 'pointer',
                      fontSize: '.85rem', color: form.estado === op.val ? op.color : 'var(--ink)',
                      fontWeight: form.estado === op.val ? 500 : 400, transition: 'all .2s'
                    }}>
                      <input type="radio" value={op.val}
                        checked={form.estado === op.val}
                        onChange={e => setForm({...form, estado: e.target.value})}
                        style={{ display: 'none' }}/>
                      {op.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label>Observaciones</label>
                <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} rows="4"/>
              </div>
              <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>Cancelar</button>
                <button className="btn btn-primary">Guardar revisión</button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </>
  );
}
