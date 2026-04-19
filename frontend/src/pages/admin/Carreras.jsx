import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const EMPTY = { nombre: '', codigo: '', jefe_id: '' };

export default function AdminCarreras() {
  const [carreras, setCarreras] = useState([]);
  const [jefes, setJefes] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const cargar = async () => {
    const [c, j] = await Promise.all([
      api.get('/admin/carreras'),
      api.get('/admin/jefes')
    ]);
    setCarreras(c.data);
    setJefes(j.data);
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const abrirEditar = (c) => {
    setForm({ nombre: c.nombre, codigo: c.codigo, jefe_id: c.jefe_id || '' });
    setEditId(c.id);
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.codigo) return;
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/carreras/${editId}`, form);
      } else {
        await api.post('/admin/carreras', form);
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
    await api.delete(`/admin/carreras/${id}`);
    setConfirmDel(null);
    cargar();
  };

  return (
    <>
      <PageHeader
        num="02"
        eyebrow="Gestión académica"
        title={<>Carreras y <span className="display-italic">programas</span></>}
        lead="Administre los programas académicos y la asignación de jefes de carrera."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Nueva carrera</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {carreras.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
            Sin carreras registradas
          </div>
        )}
        {carreras.map((c, i) => (
          <div key={c.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <span className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 600 }}>{c.nombre}</div>
                  <div className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                    {c.codigo}
                    {c.jefe_nombre && ` · Jefe: ${c.jefe_nombre} ${c.jefe_apellido}`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                <span className="chip chip-gold">{c.total_estudiantes} est.</span>
                <span className="chip chip-forest">{c.total_materias} mat.</span>
                <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(c)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(c)}>Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
             title={editId ? 'Editar carrera' : 'Nueva carrera'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Nombre *</label>
            <input className="form-input" value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Código *</label>
            <input className="form-input" value={form.codigo}
              onChange={e => setForm(p => ({ ...p, codigo: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <label className="form-label">Jefe de carrera</label>
            <select className="form-input" value={form.jefe_id}
              onChange={e => setForm(p => ({ ...p, jefe_id: e.target.value }))}>
              <option value="">— Sin asignar —</option>
              {jefes.map(j => (
                <option key={j.id} value={j.id}>{j.nombre} {j.apellido}</option>
              ))}
            </select>
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
          ¿Eliminar la carrera <strong>{confirmDel?.nombre}</strong>? Esta acción eliminará también las materias y estudiantes asociados.
        </p>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancelar</button>
          <button className="btn btn-danger" onClick={() => eliminar(confirmDel.id)}>Eliminar</button>
        </div>
      </Modal>
    </>
  );
}
