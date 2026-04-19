import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const EMPTY_USER = {
  nombre: '', apellido: '', email: '', password: 'password123', rol: 'estudiante',
  ci: '', telefono: '',
  especialidad: '', titulo: '',
  carrera_id: '', semestre: '1', codigo_estudiante: '', fecha_ingreso: ''
};

const rolLabel = { estudiante: 'Estudiante', docente: 'Docente', jefe: 'Jefe de carrera' };
const rolChip = { estudiante: 'chip-gold', docente: 'chip-forest', jefe: 'chip-ink' };

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [filtroRol, setFiltroRol] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [modalReset, setModalReset] = useState(null);
  const [form, setForm] = useState(EMPTY_USER);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [newPass, setNewPass] = useState('password123');

  const cargar = async () => {
    const [u, c] = await Promise.all([
      api.get('/admin/usuarios', { params: filtroRol ? { rol: filtroRol } : {} }),
      api.get('/admin/carreras')
    ]);
    setUsuarios(u.data);
    setCarreras(c.data);
  };

  useEffect(() => { cargar(); }, [filtroRol]);

  const abrirNuevo = () => { setForm(EMPTY_USER); setEditId(null); setModal(true); };
  const abrirEditar = (u) => {
    setForm({
      nombre: u.nombre, apellido: u.apellido, email: u.email, password: '', rol: u.rol,
      ci: u.ci || '', telefono: u.telefono || '',
      especialidad: u.perfil?.especialidad || '',
      titulo: u.perfil?.titulo || '',
      carrera_id: u.perfil?.carrera_id || '',
      semestre: u.perfil?.semestre || '1',
      codigo_estudiante: u.perfil?.codigo || '',
      fecha_ingreso: ''
    });
    setEditId(u.id);
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.apellido || !form.email) return;
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/usuarios/${editId}`, form);
      } else {
        await api.post('/admin/usuarios', form);
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
    await api.delete(`/admin/usuarios/${id}`);
    setConfirmDel(null);
    cargar();
  };

  const resetPass = async () => {
    await api.put(`/admin/usuarios/${modalReset.id}/reset-password`, { password: newPass });
    setModalReset(null);
    setNewPass('password123');
  };

  const filtrados = usuarios.filter(u => {
    const t = search.toLowerCase();
    return !t || u.nombre.toLowerCase().includes(t) || u.apellido.toLowerCase().includes(t) || u.email.toLowerCase().includes(t);
  });

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <PageHeader
        num="03"
        eyebrow="Gestión de usuarios"
        title={<>Estudiantes, docentes <span className="display-italic">y jefes</span></>}
        lead="Cree y administre todos los usuarios del sistema académico."
      />

      <div className="flex gap-4 mb-6" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Buscar por nombre o correo…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '.75rem 1rem', border: '1px solid var(--line-strong)', borderRadius: '2px', background: 'var(--paper-light)', fontFamily: 'var(--sans)' }}
        />
        <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)} style={{
          padding: '.75rem 1rem', border: '1px solid var(--line-strong)',
          borderRadius: '2px', background: 'var(--paper-light)', fontFamily: 'var(--mono)', fontSize: '.85rem'
        }}>
          <option value="">Todos los roles</option>
          <option value="estudiante">Estudiantes</option>
          <option value="docente">Docentes</option>
          <option value="jefe">Jefes de carrera</option>
        </select>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo usuario</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>CI</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.length === 0 && (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>Sin resultados</td></tr>
          )}
          {filtrados.map((u, i) => (
            <tr key={u.id}>
              <td className="num">{String(i + 1).padStart(3, '0')}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--ink)', color: 'var(--gold)',
                    display: 'grid', placeItems: 'center', fontFamily: 'var(--serif)', fontSize: '.8rem'
                  }}>
                    {u.nombre[0]}{u.apellido[0]}
                  </div>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '.95rem' }}>{u.nombre} {u.apellido}</span>
                </div>
              </td>
              <td style={{ fontSize: '.85rem', color: 'var(--ink-light)' }}>{u.email}</td>
              <td><span className={`chip ${rolChip[u.rol] || 'chip-ink'}`}>{rolLabel[u.rol] || u.rol}</span></td>
              <td className="text-mono" style={{ fontSize: '.8rem' }}>{u.ci || '—'}</td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(u)}>Editar</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setModalReset(u); setNewPass('password123'); }}>Contraseña</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(u)}>Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal crear/editar */}
      <Modal open={modal} onClose={() => setModal(false)}
             title={editId ? 'Editar usuario' : 'Nuevo usuario'} maxWidth="620px">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">Nombre *</label>
            <input className="form-input" value={form.nombre} onChange={e => f('nombre', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Apellido *</label>
            <input className="form-input" value={form.apellido} onChange={e => f('apellido', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Correo *</label>
            <input className="form-input" type="email" value={form.email} onChange={e => f('email', e.target.value)} />
          </div>
          {!editId && (
            <div>
              <label className="form-label">Contraseña inicial</label>
              <input className="form-input" value={form.password} onChange={e => f('password', e.target.value)} />
            </div>
          )}
          <div>
            <label className="form-label">CI</label>
            <input className="form-input" value={form.ci} onChange={e => f('ci', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Teléfono</label>
            <input className="form-input" value={form.telefono} onChange={e => f('telefono', e.target.value)} />
          </div>
          {!editId && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Rol *</label>
              <select className="form-input" value={form.rol} onChange={e => f('rol', e.target.value)}>
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente</option>
                <option value="jefe">Jefe de carrera</option>
              </select>
            </div>
          )}

          {form.rol === 'docente' && (
            <>
              <div>
                <label className="form-label">Especialidad</label>
                <input className="form-input" value={form.especialidad} onChange={e => f('especialidad', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Título</label>
                <input className="form-input" value={form.titulo} onChange={e => f('titulo', e.target.value)} />
              </div>
            </>
          )}

          {form.rol === 'estudiante' && (
            <>
              <div>
                <label className="form-label">Carrera</label>
                <select className="form-input" value={form.carrera_id} onChange={e => f('carrera_id', e.target.value)}>
                  <option value="">— Sin carrera —</option>
                  {carreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Semestre</label>
                <input className="form-input" type="number" min="1" max="10" value={form.semestre} onChange={e => f('semestre', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Código estudiante</label>
                <input className="form-input" value={form.codigo_estudiante} onChange={e => f('codigo_estudiante', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Fecha de ingreso</label>
                <input className="form-input" type="date" value={form.fecha_ingreso} onChange={e => f('fecha_ingreso', e.target.value)} />
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </Modal>

      {/* Modal reset contraseña */}
      <Modal open={!!modalReset} onClose={() => setModalReset(null)} title="Restablecer contraseña">
        <p style={{ marginBottom: '1rem', fontSize: '.9rem' }}>
          Restableciendo contraseña de <strong>{modalReset?.nombre} {modalReset?.apellido}</strong>
        </p>
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Nueva contraseña</label>
          <input className="form-input" value={newPass} onChange={e => setNewPass(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setModalReset(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={resetPass}>Restablecer</button>
        </div>
      </Modal>

      {/* Modal confirmar eliminar */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Confirmar eliminación">
        <p style={{ marginBottom: '1.5rem' }}>
          ¿Eliminar al usuario <strong>{confirmDel?.nombre} {confirmDel?.apellido}</strong>? Se eliminarán todos sus datos asociados.
        </p>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancelar</button>
          <button className="btn btn-danger" onClick={() => eliminar(confirmDel.id)}>Eliminar</button>
        </div>
      </Modal>
    </>
  );
}
