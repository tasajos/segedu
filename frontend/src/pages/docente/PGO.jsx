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

export default function DocentePGO() {
  const [pgoList, setPgoList] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ materia_id: '', titulo: '', descripcion: '', periodo: '2026-I' });
  const [archivo, setArchivo] = useState(null);

  const cargar = async () => {
    const [p, m] = await Promise.all([
      api.get('/docente/pgo'),
      api.get('/docente/materias')
    ]);
    setPgoList(p.data); setMaterias(m.data);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (archivo) fd.append('archivo', archivo);
    await api.post('/docente/pgo', fd, { headers: { 'Content-Type': 'multipart/form-data' }});
    setOpen(false);
    setForm({ materia_id: '', titulo: '', descripcion: '', periodo: '2026-I' });
    setArchivo(null);
    cargar();
  };

  return (
    <>
      <PageHeader
        num="02"
        eyebrow="Plan global operativo"
        title={<>Documento <span className="display-italic">PGO</span></>}
        lead="Envíe el Plan Global Operativo de cada materia a la jefatura para revisión y aprobación."
        actions={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Nuevo PGO</button>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {pgoList.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--line-strong)' }}>
            <p className="display-italic" style={{ fontSize: '1.1rem', color: 'var(--ink-light)' }}>Sin PGO registrados</p>
          </div>
        )}
        {pgoList.map((p, i) => {
          const est = ESTADOS[p.estado] || ESTADOS.enviado;
          return (
            <div key={p.id} className="card pgo-card">
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: '1.5rem', alignItems: 'center' }}>
                <div className="pgo-num">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold-dark)', letterSpacing: '.1em' }}>
                    {p.materia_codigo} · {p.periodo}
                  </div>
                  <h3 style={{ marginTop: '.25rem' }}>{p.titulo}</h3>
                  <div className="text-muted" style={{ fontSize: '.85rem', marginTop: '.25rem' }}>{p.materia_nombre}</div>
                  {p.observaciones && (
                    <div style={{
                      marginTop: '.75rem', padding: '.75rem', background: 'var(--paper-dark)',
                      borderLeft: '3px solid var(--crimson)', fontSize: '.85rem', fontStyle: 'italic'
                    }}>
                      Observación: {p.observaciones}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'flex-end' }}>
                  <span className={`chip ${est.cls}`}>{est.txt}</span>
                  <span className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>
                    {new Date(p.fecha_envio).toLocaleDateString()}
                  </span>
                  {p.archivo_url && (
                    <a href={p.archivo_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                      Ver archivo
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Subir PGO">
        <form onSubmit={guardar}>
          <div className="form-field">
            <label>Materia *</label>
            <select value={form.materia_id} onChange={e => setForm({...form, materia_id: e.target.value})} required>
              <option value="">Seleccione una materia</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.codigo} — {m.nombre}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Título del PGO *</label>
            <input value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} required/>
          </div>
          <div className="form-field">
            <label>Período *</label>
            <input value={form.periodo} onChange={e => setForm({...form, periodo: e.target.value})} placeholder="2026-I" required/>
          </div>
          <div className="form-field">
            <label>Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}/>
          </div>
          <div className="form-field">
            <label>Archivo PDF/DOC</label>
            <input type="file" accept=".pdf,.doc,.docx" onChange={e => setArchivo(e.target.files[0])}/>
          </div>
          <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary">Enviar PGO</button>
          </div>
        </form>
      </Modal>

      <style>{`
        .pgo-num {
          font-family: var(--serif);
          font-size: 2.5rem;
          color: var(--gold);
          font-weight: 300;
          line-height: 1;
        }
      `}</style>
    </>
  );
}
