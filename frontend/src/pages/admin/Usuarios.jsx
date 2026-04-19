import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const EMPTY_USER = {
  nombre: '',
  apellido: '',
  email: '',
  password: 'password123',
  rol: 'estudiante',
  ci: '',
  telefono: '',
  especialidad: '',
  titulo: '',
  carrera_id: '',
  semestre: '1',
  codigo_estudiante: '',
  fecha_ingreso: ''
};

const EMPTY_IMPORT = {
  archivo: null,
  password_inicial: 'password123',
  email_domain: 'est.uni.edu',
  carrera_id: '',
  materia_ids: [],
  semestre: '',
  fecha_ingreso: ''
};

const rolLabel = { estudiante: 'Estudiante', docente: 'Docente', jefe: 'Jefe de carrera' };
const rolChip = { estudiante: 'chip-gold', docente: 'chip-forest', jefe: 'chip-ink' };

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [filtroRol, setFiltroRol] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [modalImport, setModalImport] = useState(false);
  const [modalProceso, setModalProceso] = useState(false);
  const [modalReset, setModalReset] = useState(null);
  const [form, setForm] = useState(EMPTY_USER);
  const [importForm, setImportForm] = useState(EMPTY_IMPORT);
  const [importResult, setImportResult] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [newPass, setNewPass] = useState('password123');

  const cargar = async () => {
    const [u, c, m] = await Promise.all([
      api.get('/admin/usuarios', { params: filtroRol ? { rol: filtroRol } : {} }),
      api.get('/admin/carreras'),
      api.get('/admin/materias')
    ]);
    setUsuarios(u.data);
    setCarreras(c.data);
    setMaterias(m.data);
  };

  useEffect(() => {
    cargar();
  }, [filtroRol]);

  const abrirNuevo = () => {
    setForm(EMPTY_USER);
    setEditId(null);
    setModal(true);
  };

  const abrirImportar = () => {
    setImportForm(EMPTY_IMPORT);
    setImportResult(null);
    setModalImport(true);
  };

  const abrirEditar = (u) => {
    setForm({
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      password: '',
      rol: u.rol,
      ci: u.ci || '',
      telefono: u.telefono || '',
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

  const importarExcel = async () => {
    if (!importForm.archivo) return;

    const body = new FormData();
    body.append('archivo', importForm.archivo);
    if (importForm.password_inicial) body.append('password_inicial', importForm.password_inicial);
    if (importForm.email_domain) body.append('email_domain', importForm.email_domain);
    if (importForm.carrera_id) body.append('carrera_id', importForm.carrera_id);
    if (importForm.materia_ids.length > 0) body.append('materia_ids', JSON.stringify(importForm.materia_ids));
    if (importForm.semestre) body.append('semestre', importForm.semestre);
    if (importForm.fecha_ingreso) body.append('fecha_ingreso', importForm.fecha_ingreso);

    setImporting(true);
    setModalProceso(true);
    try {
      const { data } = await api.post('/admin/usuarios/importar-excel', body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult(data);
      await cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al importar el Excel');
    } finally {
      setImporting(false);
      setModalProceso(false);
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

  const filtrados = usuarios.filter((u) => {
    const t = search.toLowerCase();
    return !t || u.nombre.toLowerCase().includes(t) || u.apellido.toLowerCase().includes(t) || u.email.toLowerCase().includes(t);
  });

  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const fi = (k, v) => setImportForm((p) => ({ ...p, [k]: v }));
  const materiasFiltradas = importForm.carrera_id
    ? materias.filter((m) => String(m.carrera_id) === String(importForm.carrera_id))
    : materias;

  return (
    <>
      <PageHeader
        num="03"
        eyebrow="Gestion de usuarios"
        title={<>Estudiantes, docentes <span className="display-italic">y jefes</span></>}
        lead="Cree y administre todos los usuarios del sistema academico."
      />

      <div className="flex gap-4 mb-6" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '.75rem 1rem',
            border: '1px solid var(--line-strong)',
            borderRadius: '2px',
            background: 'var(--paper-light)',
            fontFamily: 'var(--sans)'
          }}
        />
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          style={{
            padding: '.75rem 1rem',
            border: '1px solid var(--line-strong)',
            borderRadius: '2px',
            background: 'var(--paper-light)',
            fontFamily: 'var(--mono)',
            fontSize: '.85rem'
          }}
        >
          <option value="">Todos los roles</option>
          <option value="estudiante">Estudiantes</option>
          <option value="docente">Docentes</option>
          <option value="jefe">Jefes de carrera</option>
        </select>
        <button className="btn btn-secondary" onClick={abrirImportar}>Importar Excel</button>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo usuario</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>No</th>
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
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--ink)',
                      color: 'var(--gold)',
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: 'var(--serif)',
                      fontSize: '.8rem'
                    }}
                  >
                    {u.nombre[0]}{u.apellido[0]}
                  </div>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '.95rem' }}>{u.nombre} {u.apellido}</span>
                </div>
              </td>
              <td style={{ fontSize: '.85rem', color: 'var(--ink-light)' }}>{u.email}</td>
              <td><span className={`chip ${rolChip[u.rol] || 'chip-ink'}`}>{rolLabel[u.rol] || u.rol}</span></td>
              <td className="text-mono" style={{ fontSize: '.8rem' }}>{u.ci || '-'}</td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(u)}>Editar</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setModalReset(u); setNewPass('password123'); }}>Contrasena</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(u)}>Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar usuario' : 'Nuevo usuario'} maxWidth="620px">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label">Nombre *</label>
            <input className="form-input" value={form.nombre} onChange={(e) => f('nombre', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Apellido *</label>
            <input className="form-input" value={form.apellido} onChange={(e) => f('apellido', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Correo *</label>
            <input className="form-input" type="email" value={form.email} onChange={(e) => f('email', e.target.value)} />
          </div>
          {!editId && (
            <div>
              <label className="form-label">Contrasena inicial</label>
              <input className="form-input" value={form.password} onChange={(e) => f('password', e.target.value)} />
            </div>
          )}
          <div>
            <label className="form-label">CI</label>
            <input className="form-input" value={form.ci} onChange={(e) => f('ci', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Telefono</label>
            <input className="form-input" value={form.telefono} onChange={(e) => f('telefono', e.target.value)} />
          </div>
          {!editId && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Rol *</label>
              <select className="form-input" value={form.rol} onChange={(e) => f('rol', e.target.value)}>
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
                <input className="form-input" value={form.especialidad} onChange={(e) => f('especialidad', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Titulo</label>
                <input className="form-input" value={form.titulo} onChange={(e) => f('titulo', e.target.value)} />
              </div>
            </>
          )}

          {form.rol === 'estudiante' && (
            <>
              <div>
                <label className="form-label">Carrera</label>
                <select className="form-input" value={form.carrera_id} onChange={(e) => f('carrera_id', e.target.value)}>
                  <option value="">- Sin carrera -</option>
                  {carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Semestre</label>
                <input className="form-input" type="number" min="1" max="10" value={form.semestre} onChange={(e) => f('semestre', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Codigo estudiante</label>
                <input className="form-input" value={form.codigo_estudiante} onChange={(e) => f('codigo_estudiante', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Fecha de ingreso</label>
                <input className="form-input" type="date" value={form.fecha_ingreso} onChange={(e) => f('fecha_ingreso', e.target.value)} />
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </Modal>

      <Modal open={modalImport} onClose={() => setModalImport(false)} title="Importar estudiantes desde Excel" maxWidth="680px">
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ fontSize: '.9rem', color: 'var(--ink-light)' }}>
            Suba una lista de estudiantes en Excel. El sistema leerá el encabezado de la materia y registrará a cada estudiante con su inscripción correspondiente.
          </div>

          <div>
            <label className="form-label">Archivo Excel *</label>
            <input
              className="form-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => fi('archivo', e.target.files?.[0] || null)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Contrasena inicial</label>
              <input className="form-input" value={importForm.password_inicial} onChange={(e) => fi('password_inicial', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Dominio de correo</label>
              <input className="form-input" value={importForm.email_domain} onChange={(e) => fi('email_domain', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Fecha de ingreso</label>
              <input className="form-input" type="date" value={importForm.fecha_ingreso} onChange={(e) => fi('fecha_ingreso', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Semestre</label>
              <input className="form-input" type="number" min="1" max="12" value={importForm.semestre} onChange={(e) => fi('semestre', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Carrera manual</label>
              <select
                className="form-input"
                value={importForm.carrera_id}
                onChange={(e) => setImportForm((p) => ({ ...p, carrera_id: e.target.value, materia_ids: [] }))}
              >
                <option value="">Detectar desde el Excel</option>
                {carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Materias manuales</label>
              <select
                className="form-input"
                multiple
                size="6"
                value={importForm.materia_ids}
                onChange={(e) => fi('materia_ids', Array.from(e.target.selectedOptions, (option) => option.value))}
              >
                {materiasFiltradas.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.nombre} ({m.codigo}) - Grupo {m.grupo}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', marginTop: '.35rem' }}>
                Puede seleccionar varias materias con `Ctrl` o `Shift`. Si no selecciona ninguna, se intentará detectar la materia desde el Excel.
              </div>
            </div>
          </div>

          {importResult && (
            <div className="card" style={{ padding: '1rem', display: 'grid', gap: '.5rem' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 600 }}>
                Importacion completada
              </div>
              <div style={{ fontSize: '.9rem', color: 'var(--ink-light)' }}>
                Materias: {(importResult.materias || []).map((m) => `${m.nombre} (${m.codigo}) - Grupo ${m.grupo}`).join(', ')}
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                <span className="chip chip-forest">{importResult.createdUsers} creados</span>
                <span className="chip chip-gold">{importResult.reusedStudents} existentes</span>
                <span className="chip chip-ink">{importResult.enrolled} inscritos</span>
                <span className="chip chip-crimson">{importResult.alreadyEnrolled} ya inscritos</span>
              </div>
              {importResult.nuevosUsuarios?.length > 0 && (
                <div style={{ marginTop: '.5rem', display: 'grid', gap: '.5rem' }}>
                  <div className="text-mono" style={{ fontSize: '.72rem', letterSpacing: '.08em', color: 'var(--ink-light)', textTransform: 'uppercase' }}>
                    Usuarios nuevos
                  </div>
                  <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'grid', gap: '.5rem' }}>
                    {importResult.nuevosUsuarios.map((u) => (
                      <div key={u.codigo_estudiante} style={{ padding: '.75rem', background: 'var(--paper-dark)', borderRadius: '2px' }}>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 600 }}>
                          {u.nombre} {u.apellido}
                        </div>
                        <div className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                          {u.codigo_estudiante} - {u.email}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setModalImport(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={importarExcel} disabled={importing || !importForm.archivo}>
            {importing ? 'Importando...' : 'Importar estudiantes'}
          </button>
        </div>
      </Modal>

      <Modal open={modalProceso} onClose={() => {}} title="Importacion en proceso" maxWidth="520px">
        <div style={{ display: 'grid', gap: '1rem', textAlign: 'center', padding: '.5rem 0' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 600 }}>
            Registrando estudiantes...
          </div>
          <div style={{ fontSize: '.95rem', color: 'var(--ink-light)' }}>
            Estamos procesando el archivo Excel, creando usuarios y asignando sus materias.
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--line)', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: '40%',
                height: '100%',
                background: 'linear-gradient(90deg, var(--ink), var(--gold))',
                borderRadius: '999px',
                animation: 'import-progress 1.2s ease-in-out infinite'
              }}
            />
          </div>
        </div>
      </Modal>

      <Modal open={!!modalReset} onClose={() => setModalReset(null)} title="Restablecer contrasena">
        <p style={{ marginBottom: '1rem', fontSize: '.9rem' }}>
          Restableciendo contrasena de <strong>{modalReset?.nombre} {modalReset?.apellido}</strong>
        </p>
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Nueva contrasena</label>
          <input className="form-input" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setModalReset(null)}>Cancelar</button>
          <button className="btn btn-primary" onClick={resetPass}>Restablecer</button>
        </div>
      </Modal>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Confirmar eliminacion">
        <p style={{ marginBottom: '1.5rem' }}>
          Eliminar al usuario <strong>{confirmDel?.nombre} {confirmDel?.apellido}</strong>? Se eliminaran todos sus datos asociados.
        </p>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancelar</button>
          <button className="btn btn-danger" onClick={() => eliminar(confirmDel.id)}>Eliminar</button>
        </div>
      </Modal>
    </>
  );
}
