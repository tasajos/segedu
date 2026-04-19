import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const EMPTY = { nombre: '', codigo: '', carrera_id: '', docente_id: '', semestre: '1', creditos: '4' };

export default function AdminMaterias() {
  const [materias, setMaterias] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [filtroCarrera, setFiltroCarrera] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const cargar = async () => {
    const params = filtroCarrera ? `?carrera_id=${filtroCarrera}` : '';
    const [m, c, d] = await Promise.all([
      api.get(`/admin/materias${params}`),
      api.get('/admin/carreras'),
      api.get('/admin/docentes')
    ]);
    setMaterias(m.data);
    setCarreras(c.data);
    setDocentes(d.data);
  };

  useEffect(() => { cargar(); }, [filtroCarrera]);

  const abrirNuevo = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const abrirEditar = (m) => {
    setForm({
      nombre: m.nombre,
      codigo: m.codigo,
      carrera_id: m.carrera_id || '',
      docente_id: m.docente_id_perfil || '',
      semestre: String(m.semestre),
      creditos: String(m.creditos)
    });
    setEditId(m.id);
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.codigo || !form.carrera_id || !form.semestre) return;
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/materias/${editId}`, form);
      } else {
        await api.post('/admin/materias', form);
      }
      setModal(false);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    await api.delete(`/admin/materias/${id}`);
    setConfirmDel(null);
    cargar();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <PageHeader
        num="04"
        eyebrow="Gestión académica"
        title={<>Materias y <span className="display-italic">asignaturas</span></>}
        lead="Administre las materias de cada carrera y asigne docentes."
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <select className="form-input" style={{ width: '260px' }}
          value={filtroCarrera} onChange={e => setFiltroCarrera(e.target.value)}>
          <option value="">Todas las carreras</option>
          {carreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Nueva materia</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {materias.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
            Sin materias registradas
          </div>
        )}
        {materias.map((m, i) => (
          <div key={m.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <span className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 600 }}>{m.nombre}</div>
                  <div className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                    {m.codigo} · {m.carrera_nombre} · Sem. {m.semestre} · {m.creditos} créditos
                    {m.docente_nombre && ` · ${m.docente_nombre} ${m.docente_apellido}`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                <span className="chip chip-forest">{m.total_estudiantes} est.</span>
                <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(m)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(m)}>Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
             title={editId ? 'Editar materia' : 'Nueva materia'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Nombre *</label>
            <input className="form-input" value={form.nombre}
              onChange={e => f('nombre', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Código *</label>
            <input className="form-input" value={form.codigo}
              onChange={e => f('codigo', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="form-label">Carrera *</label>
            <select className="form-input" value={form.carrera_id}
              onChange={e => f('carrera_id', e.target.value)}>
              <option value="">— Seleccione —</option>
              {carreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Docente</label>
            <select className="form-input" value={form.docente_id}
              onChange={e => f('docente_id', e.target.value)}>
              <option value="">— Sin asignar —</option>
              {docentes.map(d => (
                <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Semestre *</label>
              <input className="form-input" type="number" min="1" max="10" value={form.semestre}
                onChange={e => f('semestre', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Créditos</label>
              <input className="form-input" type="number" min="1" max="10" value={form.creditos}
                onChange={e => f('creditos', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Confirmar eliminación">
        <p style={{ marginBottom: '1.5rem' }}>
          ¿Eliminar la materia <strong>{confirmDel?.nombre}</strong>? Se eliminarán también inscripciones, asistencias y registros asociados.
        </p>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancelar</button>
          <button className="btn btn-danger" onClick={() => eliminar(confirmDel.id)}>Eliminar</button>
        </div>
      </Modal>
    </>
  );
}
