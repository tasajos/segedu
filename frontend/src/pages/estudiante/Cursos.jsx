import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

export default function EstudianteCursos() {
  const [cursos, setCursos] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nombre_curso: '', institucion: '', fecha_inicio: '',
    fecha_fin: '', horas: '', descripcion: ''
  });
  const [archivo, setArchivo] = useState(null);

  const cargar = async () => {
    const { data } = await api.get('/estudiante/cursos');
    setCursos(data);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (archivo) fd.append('certificado', archivo);
    await api.post('/estudiante/cursos', fd, { headers: { 'Content-Type': 'multipart/form-data' }});
    setOpen(false);
    setForm({ nombre_curso: '', institucion: '', fecha_inicio: '', fecha_fin: '', horas: '', descripcion: '' });
    setArchivo(null);
    cargar();
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este curso?')) return;
    await api.delete(`/estudiante/cursos/${id}`);
    cargar();
  };

  const estadoChip = {
    pendiente: { cls: 'chip-gold', txt: 'Pendiente' },
    aprobado: { cls: 'chip-forest', txt: 'Aprobado' },
    rechazado: { cls: 'chip-crimson', txt: 'Rechazado' }
  };

  return (
    <>
      <PageHeader
        num="02"
        eyebrow="Formación complementaria"
        title={<>Cursos de <span className="display-italic">capacitación</span></>}
        lead="Registre aquí los cursos, talleres y certificaciones externas que enriquezcan su formación."
        actions={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Añadir curso</button>}
      />

      <div className="grid-3">
        {cursos.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '3rem',
            textAlign: 'center',
            border: '1px dashed var(--line-strong)',
            borderRadius: '3px'
          }}>
            <p className="display-italic" style={{ fontSize: '1.2rem', color: 'var(--ink-light)', marginBottom: '1rem' }}>
              Aún no ha registrado ningún curso.
            </p>
            <button className="btn btn-ghost" onClick={() => setOpen(true)}>Registrar el primero</button>
          </div>
        )}

        {cursos.map((c, i) => (
          <div key={c.id} className="card curso-card">
            <div className="flex justify-between items-center mb-4">
              <span className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold-dark)' }}>
                №{String(i + 1).padStart(3, '0')}
              </span>
              <span className={`chip ${estadoChip[c.estado].cls}`}>{estadoChip[c.estado].txt}</span>
            </div>
            <h3 style={{ marginBottom: '.5rem' }}>{c.nombre_curso}</h3>
            <div className="text-muted" style={{ fontSize: '.85rem', marginBottom: '.75rem' }}>{c.institucion || 'Sin institución'}</div>

            <div className="curso-meta">
              <div>
                <div className="meta-label">Inicio</div>
                <div className="meta-val">{c.fecha_inicio || '—'}</div>
              </div>
              <div>
                <div className="meta-label">Fin</div>
                <div className="meta-val">{c.fecha_fin || '—'}</div>
              </div>
              <div>
                <div className="meta-label">Horas</div>
                <div className="meta-val">{c.horas || '—'}</div>
              </div>
            </div>

            {c.descripcion && <p style={{ fontSize: '.85rem', color: 'var(--ink-soft)', marginTop: '.75rem' }}>{c.descripcion}</p>}

            <div className="flex gap-2" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
              {c.certificado_url && (
                <a href={c.certificado_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Ver certificado</a>
              )}
              <button className="btn btn-danger btn-sm" onClick={() => eliminar(c.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo curso de capacitación">
        <form onSubmit={guardar}>
          <div className="form-field">
            <label>Nombre del curso *</label>
            <input value={form.nombre_curso} onChange={e => setForm({...form, nombre_curso: e.target.value})} required/>
          </div>
          <div className="form-field">
            <label>Institución</label>
            <input value={form.institucion} onChange={e => setForm({...form, institucion: e.target.value})}/>
          </div>
          <div className="grid-2">
            <div className="form-field">
              <label>Fecha de inicio</label>
              <input type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})}/>
            </div>
            <div className="form-field">
              <label>Fecha de fin</label>
              <input type="date" value={form.fecha_fin} onChange={e => setForm({...form, fecha_fin: e.target.value})}/>
            </div>
          </div>
          <div className="form-field">
            <label>Horas totales</label>
            <input type="number" value={form.horas} onChange={e => setForm({...form, horas: e.target.value})}/>
          </div>
          <div className="form-field">
            <label>Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}/>
          </div>
          <div className="form-field">
            <label>Certificado (PDF/IMG)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setArchivo(e.target.files[0])}/>
          </div>
          <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary">Guardar curso</button>
          </div>
        </form>
      </Modal>

      <style>{`
        .curso-card { display: flex; flex-direction: column; }
        .curso-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--paper-dark);
          border-radius: 2px;
        }
        .meta-label {
          font-family: var(--mono);
          font-size: .6rem;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--ink-light);
        }
        .meta-val {
          font-family: var(--serif);
          font-size: .9rem;
          margin-top: 2px;
        }
      `}</style>
    </>
  );
}
