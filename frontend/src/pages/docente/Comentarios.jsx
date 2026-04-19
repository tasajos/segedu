import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const TIPOS = [
  { val: 'felicitacion', label: 'Felicitación', color: 'forest' },
  { val: 'positivo', label: 'Positivo', color: 'forest' },
  { val: 'observacion', label: 'Observación', color: 'gold' },
  { val: 'alerta', label: 'Alerta', color: 'crimson' }
];

export default function DocenteComentarios() {
  const [comentarios, setComentarios] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [estudiantesPorMateria, setEstudiantesPorMateria] = useState({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    estudiante_id: '', materia_id: '', tipo: 'observacion', comentario: ''
  });

  const cargar = async () => {
    const [c, m] = await Promise.all([
      api.get('/docente/comentarios'),
      api.get('/docente/materias')
    ]);
    setComentarios(c.data); setMaterias(m.data);
  };

  useEffect(() => { cargar(); }, []);

  const cargarEstudiantes = async (materiaId) => {
    if (!materiaId || estudiantesPorMateria[materiaId]) return;
    const { data } = await api.get(`/docente/materias/${materiaId}/estudiantes`);
    setEstudiantesPorMateria(prev => ({ ...prev, [materiaId]: data }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    await api.post('/docente/comentarios', form);
    setOpen(false);
    setForm({ estudiante_id: '', materia_id: '', tipo: 'observacion', comentario: '' });
    cargar();
  };

  const tipoInfo = (v) => TIPOS.find(t => t.val === v) || TIPOS[2];

  return (
    <>
      <PageHeader
        num="04"
        eyebrow="Observaciones académicas"
        title={<>Comentarios de <span className="display-italic">estudiantes</span></>}
        lead="Registre felicitaciones, observaciones y alertas sobre el desempeño de sus estudiantes."
        actions={<button className="btn btn-primary" onClick={() => setOpen(true)}>＋ Nuevo comentario</button>}
      />

      <div className="grid-2">
        {comentarios.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', padding: '3rem', textAlign: 'center',
            border: '1px dashed var(--line-strong)'
          }}>
            <p className="display-italic" style={{ fontSize: '1.1rem', color: 'var(--ink-light)' }}>
              No ha registrado comentarios aún
            </p>
          </div>
        )}
        {comentarios.map((c, i) => {
          const info = tipoInfo(c.tipo);
          return (
            <div key={c.id} className="card" style={{
              borderLeft: `4px solid ${
                info.color === 'forest' ? 'var(--forest)' :
                info.color === 'crimson' ? 'var(--crimson)' : 'var(--gold)'
              }`
            }}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold-dark)' }}>
                  №{String(i + 1).padStart(3, '0')}
                </span>
                <span className={`chip chip-${info.color}`}>{info.label}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'var(--ink)', color: 'var(--gold)',
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--serif)', fontSize: '1rem'
                }}>
                  {c.estudiante_nombre?.[0]}{c.estudiante_apellido?.[0]}
                </div>
                <div>
                  <div className="text-serif" style={{ fontSize: '1.05rem', fontWeight: 500 }}>
                    {c.estudiante_nombre} {c.estudiante_apellido}
                  </div>
                  {c.materia_nombre && (
                    <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', letterSpacing: '.08em' }}>
                      {c.materia_nombre}
                    </div>
                  )}
                </div>
              </div>

              <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '.95rem', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                «{c.comentario}»
              </p>

              <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)', marginTop: '.75rem', textAlign: 'right' }}>
                {new Date(c.created_at).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo comentario">
        <form onSubmit={guardar}>
          <div className="form-field">
            <label>Materia *</label>
            <select
              value={form.materia_id}
              onChange={e => {
                setForm({...form, materia_id: e.target.value, estudiante_id: ''});
                cargarEstudiantes(e.target.value);
              }}
              required
            >
              <option value="">Seleccione una materia</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label>Estudiante *</label>
            <select value={form.estudiante_id} onChange={e => setForm({...form, estudiante_id: e.target.value})} required disabled={!form.materia_id}>
              <option value="">Seleccione un estudiante</option>
              {(estudiantesPorMateria[form.materia_id] || []).map(s => (
                <option key={s.id} value={s.id}>{s.nombre} {s.apellido} · {s.codigo_estudiante}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Tipo de comentario *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.5rem', marginTop: '.25rem' }}>
              {TIPOS.map(t => (
                <label key={t.val} style={{
                  padding: '.6rem',
                  border: `1px solid ${form.tipo === t.val ? 'var(--ink)' : 'var(--line-strong)'}`,
                  background: form.tipo === t.val ? 'var(--paper-dark)' : 'transparent',
                  borderRadius: '2px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: '.8rem',
                  transition: 'all .2s'
                }}>
                  <input type="radio" name="tipo" value={t.val}
                    checked={form.tipo === t.val}
                    onChange={e => setForm({...form, tipo: e.target.value})}
                    style={{ display: 'none' }}/>
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Comentario *</label>
            <textarea value={form.comentario} onChange={e => setForm({...form, comentario: e.target.value})} required rows="4"/>
          </div>

          <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary">Registrar</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
