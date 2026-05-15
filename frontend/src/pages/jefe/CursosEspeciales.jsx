import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const EMPTY_FORM = { nombre: '', descripcion: '', requisitos: '', max_estudiantes: 30 };

export default function JefeCursosEspeciales() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [guardando, setGuardando] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [error, setError] = useState('');

  const cargar = async () => {
    try {
      const { data } = await api.get('/jefe/cursos-especiales');
      setCursos(data);
    } catch { /* silent */ }
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setEditando(null);
    setForm(EMPTY_FORM);
    setError('');
    setModal(true);
  };

  const abrirEditar = (curso) => {
    setEditando(curso);
    setForm({
      nombre: curso.nombre,
      descripcion: curso.descripcion || '',
      requisitos: curso.requisitos || '',
      max_estudiantes: curso.max_estudiantes
    });
    setError('');
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setGuardando(true);
    setError('');
    try {
      if (editando) {
        await api.put(`/jefe/cursos-especiales/${editando.id}`, form);
      } else {
        await api.post('/jefe/cursos-especiales', form);
      }
      setModal(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (curso) => {
    try {
      await api.put(`/jefe/cursos-especiales/${curso.id}`, { activo: curso.activo ? 0 : 1 });
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const eliminar = async (id) => {
    try {
      await api.delete(`/jefe/cursos-especiales/${id}`);
      setConfirmDel(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <>
      <PageHeader
        num="15"
        eyebrow="Gestión de carrera"
        title={<>Cursos <span className="display-italic">especiales</span></>}
        lead="Cree y administre cursos opcionales para que los estudiantes de su carrera puedan inscribirse."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={abrirCrear}>+ Nuevo curso</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {cursos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic', border: '1px dashed var(--line-strong)', borderRadius: '4px' }}>
            Sin cursos especiales creados
          </div>
        )}

        {cursos.map((c, i) => (
          <div key={c.id}>
            <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.4rem' }}>
                    <span className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold-dark)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', margin: 0 }}>{c.nombre}</h3>
                    <span className={`chip ${c.activo ? 'chip-forest' : 'chip-crimson'}`}>
                      {c.activo ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </div>

                  {c.descripcion && (
                    <p style={{ fontSize: '.88rem', color: 'var(--ink-light)', margin: '0 0 .4rem' }}>{c.descripcion}</p>
                  )}

                  {c.requisitos && (
                    <div style={{ fontSize: '.82rem', color: 'var(--ink-light)' }}>
                      <strong>Requisitos:</strong> {c.requisitos}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
                    <span className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>
                      {c.aprobados}/{c.max_estudiantes} aprobados
                    </span>
                    {parseInt(c.pendientes) > 0 && (
                      <span style={{ fontSize: '.7rem', fontFamily: 'var(--mono)', color: '#d97706',
                        background: 'rgba(217,119,6,.1)', padding: '.1rem .5rem', borderRadius: '999px',
                        border: '1px solid rgba(217,119,6,.3)' }}>
                        {c.pendientes} pendiente{c.pendientes > 1 ? 's' : ''} de aprobación
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '.6rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/jefe/cursos-especiales/${c.id}`)}>
                    Ingresar →
                  </button>
                  <button
                    className={`btn btn-sm ${c.activo ? 'btn-secondary' : 'btn-secondary'}`}
                    onClick={() => toggleActivo(c)}
                  >
                    {c.activo ? 'Deshabilitar' : 'Habilitar'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(c)}>
                    Editar
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmDel(confirmDel === c.id ? null : c.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>

            {confirmDel === c.id && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.9rem', color: '#b91c1c' }}>
                  Eliminar <strong>{c.nombre}</strong>? Se perderán todas las inscripciones.
                </span>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDel(null)}>Cancelar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => eliminar(c.id)}>Confirmar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editando ? 'Editar curso especial' : 'Nuevo curso especial'}
        maxWidth="560px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Nombre del curso *</label>
            <input
              className="form-input"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Introducción a la Programación"
            />
          </div>

          <div>
            <label className="form-label">Descripción</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripción breve del curso..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <label className="form-label">Requisitos</label>
            <textarea
              className="form-input"
              rows={2}
              value={form.requisitos}
              onChange={(e) => setForm({ ...form, requisitos: e.target.value })}
              placeholder="Ej: Haber cursado Matemáticas I..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <label className="form-label">Máximo de estudiantes</label>
            <input
              className="form-input"
              type="number"
              min={1}
              max={500}
              value={form.max_estudiantes}
              onChange={(e) => setForm({ ...form, max_estudiantes: parseInt(e.target.value) || 1 })}
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '.75rem 1rem', fontSize: '.88rem', color: '#b91c1c' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', paddingTop: '.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear curso'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
