import { useState, useEffect } from 'react';
import api from '../../services/api';
import './UnidadesInstruccion.css';

const TIPOS = [
  { value: 'simulador', icon: '⚡', label: 'Simulador', desc: 'Módulo interactivo hecho a medida.' },
  { value: 'contenido', icon: '📄', label: 'Contenido', desc: 'Material teórico de lectura.' },
  { value: 'ejercicio', icon: '✏️', label: 'Ejercicio', desc: 'Práctica guiada para estudiantes.' },
  { value: 'html', icon: '</>', label: 'Guías HTML', desc: 'Los docentes suben sus propias guías en HTML.' },
];

function emptyForm() {
  return { nombre: '', descripcion: '', tipo: 'simulador', orden: 1 };
}

export default function UnidadesInstruccion() {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(emptyForm());
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState('');

  function load() {
    setLoading(true);
    api.get('/jefe/unidades')
      .then(r => setUnidades(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm(emptyForm());
    setEditId(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(u) {
    setForm({ nombre: u.nombre, descripcion: u.descripcion || '', tipo: u.tipo, orden: u.orden });
    setEditId(u.id);
    setError('');
    setShowForm(true);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/jefe/unidades/${editId}`, form);
      } else {
        await api.post('/jefe/unidades', form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta unidad de instrucción?')) return;
    await api.delete(`/jefe/unidades/${id}`);
    load();
  }

  const TIPO_BADGE = {
    simulador: { bg: '#1a2a4a', color: '#7aa4d8' },
    contenido:  { bg: '#2a1a2a', color: '#c07ad8' },
    ejercicio:  { bg: '#1a2a1a', color: '#7ad87a' },
    html:       { bg: '#2a2210', color: '#e8b84b' }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', marginBottom: '.2rem' }}>Unidades de Instrucción</h1>
          <p style={{ fontSize: '.85rem', color: 'var(--ink-light)' }}>Gestiona los módulos de aprendizaje interactivo de la carrera.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva unidad</button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="unit-form-card">
          <div className="unit-form-title">
            {editId ? 'Editar unidad' : 'Nueva unidad de instrucción'}
          </div>
          <form onSubmit={submit} className="unit-form">
            <div className="unit-form-grid">
              <div className="unit-field unit-field-name">
                <label className="label">Nombre *</label>
                <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Circuitos Lógicos" />
              </div>
              <div className="unit-field unit-field-order">
                <label className="label">Orden</label>
                <input className="input" type="number" min="1" value={form.orden} onChange={e => setForm(f => ({ ...f, orden: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="unit-field">
              <label className="label">Tipo de unidad</label>
              <div className="unit-type-grid">
                {TIPOS.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    className={`unit-type-card${form.tipo === t.value ? ' is-selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                  >
                    <span className="unit-type-card__icon">{t.icon}</span>
                    <span className="unit-type-card__label">{t.label}</span>
                    <span className="unit-type-card__desc">{t.desc}</span>
                  </button>
                ))}
              </div>
              {form.tipo === 'html' && (
                <p className="unit-type-hint">
                  Al crear la unidad, cada docente podrá entrar a ella y publicar sus propios archivos HTML autocontenidos como guías de estudio.
                </p>
              )}
            </div>

            <div className="unit-field unit-field-description">
              <label className="label">Descripción</label>
              <textarea className="input" rows={3} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción breve de la unidad..." style={{ resize: 'vertical' }} />
            </div>
            {error && <div style={{ color: 'var(--crimson)', fontSize: '.83rem' }}>{error}</div>}
            <div className="unit-form-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear unidad'}</button>
              <button className="btn" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ padding: '2rem', color: 'var(--ink-light)' }}>Cargando...</div>
      ) : unidades.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)', background: 'var(--paper-dark)', borderRadius: '3px' }}>
          No hay unidades creadas aún. Haz clic en "+ Nueva unidad" para comenzar.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {unidades.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.1)', borderRadius: '3px', padding: '1rem 1.25rem' }}>
              <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink-light)', width: 28 }}>
                {String(u.orden).padStart(2, '0')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1rem' }}>{u.nombre}</div>
                {u.descripcion && (
                  <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                    {u.descripcion.length > 100 ? u.descripcion.slice(0, 100) + '…' : u.descripcion}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: '.72rem',
                fontFamily: 'var(--mono)',
                padding: '.2rem .55rem',
                borderRadius: '2px',
                background: TIPO_BADGE[u.tipo]?.bg || '#2a2a2a',
                color: TIPO_BADGE[u.tipo]?.color || '#aaa'
              }}>
                {u.tipo}
              </span>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button className="btn btn-sm" onClick={() => openEdit(u)}>Editar</button>
                <button className="btn btn-sm" style={{ color: 'var(--crimson)' }} onClick={() => eliminar(u.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
