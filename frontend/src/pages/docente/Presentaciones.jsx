import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import PresentationViewer from '../../components/PresentationViewer';

const EMPTY_FORM = { titulo: '', descripcion: '', enlace_url: '', carpeta_id: '' };

const TIPO_ICON  = { pdf: 'PDF', pptx: 'PPT', link: 'URL' };
const TIPO_LABEL = { pdf: 'Archivo PDF', pptx: 'PowerPoint', link: 'Enlace externo' };

// ── Icono carpeta SVG ─────────────────────────────────────────
function IconFolder({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

// ── Grupo de presentaciones por carpeta ───────────────────────
function CarpetaSeccion({ carpeta, items, carpetas, onVer, onMover, onEliminar, onRenombrar, onEliminarCarpeta }) {
  const [collapsed, setCollapsed] = useState(false);
  const [editando, setEditando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState(carpeta?.nombre || '');
  const inputRef = useRef();

  const esSinCarpeta = !carpeta;

  const confirmarRename = () => {
    if (nuevoNombre.trim() && nuevoNombre.trim() !== carpeta.nombre) {
      onRenombrar(carpeta.id, nuevoNombre.trim());
    }
    setEditando(false);
  };

  return (
    <section style={{
      background: 'var(--surface)',
      border: '1.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Cabecera de carpeta */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '.75rem',
          padding: '.85rem 1.15rem',
          background: esSinCarpeta ? 'var(--gray-50)' : 'var(--blue-50)',
          borderBottom: collapsed ? 'none' : '1px solid var(--border)',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(c => !c)}
      >
        <IconFolder size={17} color={esSinCarpeta ? 'var(--text-muted)' : 'var(--blue-600)'} />

        {editando ? (
          <input
            ref={inputRef}
            value={nuevoNombre}
            onChange={e => setNuevoNombre(e.target.value)}
            onBlur={confirmarRename}
            onKeyDown={e => { if (e.key === 'Enter') confirmarRename(); if (e.key === 'Escape') setEditando(false); }}
            onClick={e => e.stopPropagation()}
            autoFocus
            style={{
              flex: 1, fontSize: '.9rem', fontWeight: 700,
              border: '1.5px solid var(--blue-400)', borderRadius: 4,
              padding: '.2rem .5rem', outline: 'none', background: 'var(--white)',
            }}
          />
        ) : (
          <span style={{ flex: 1, fontWeight: 700, fontSize: '.9rem', color: esSinCarpeta ? 'var(--text-muted)' : 'var(--text)' }}>
            {esSinCarpeta ? 'Sin carpeta' : carpeta.nombre}
          </span>
        )}

        <span style={{
          fontSize: '.72rem', fontWeight: 600, color: 'var(--text-muted)',
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 99, padding: '.1rem .55rem',
        }}>
          {items.length}
        </span>

        {!esSinCarpeta && (
          <div style={{ display: 'flex', gap: '.3rem' }} onClick={e => e.stopPropagation()}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '.25rem .55rem', fontSize: '.72rem' }}
              onClick={() => { setEditando(true); setNuevoNombre(carpeta.nombre); setTimeout(() => inputRef.current?.focus(), 0); }}
            >
              Renombrar
            </button>
            <button
              className="btn btn-danger btn-sm"
              style={{ padding: '.25rem .55rem', fontSize: '.72rem' }}
              onClick={() => onEliminarCarpeta(carpeta)}
            >
              Eliminar
            </button>
          </div>
        )}

        <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginLeft: '.25rem' }}>
          {collapsed ? '▶' : '▼'}
        </span>
      </div>

      {/* Presentaciones dentro de la carpeta */}
      {!collapsed && (
        items.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.85rem' }}>
            Carpeta vacía. Mueve presentaciones aquí desde el botón "Mover".
          </div>
        ) : (
          <div>
            {items.map((p, idx) => (
              <PresentacionRow
                key={p.id}
                p={p}
                carpetas={carpetas}
                carpetaActual={carpeta?.id || null}
                onVer={onVer}
                onMover={onMover}
                onEliminar={onEliminar}
                isLast={idx === items.length - 1}
              />
            ))}
          </div>
        )
      )}
    </section>
  );
}

// ── Fila de presentación ──────────────────────────────────────
function PresentacionRow({ p, carpetas, carpetaActual, onVer, onMover, onEliminar, isLast }) {
  const [moviendo, setMoviendo] = useState(false);
  const [destino, setDestino] = useState('');

  const confirmarMover = async () => {
    const nuevaCarpetaId = destino === '' ? null : parseInt(destino);
    await onMover(p.id, nuevaCarpetaId);
    setMoviendo(false);
    setDestino('');
  };

  return (
    <article style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '.85rem 1.15rem',
      borderBottom: isLast ? 'none' : '1px solid var(--gray-100)',
      transition: 'background .12s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-50)'}
      onMouseLeave={e => e.currentTarget.style.background = ''}
    >
      {/* Badge tipo */}
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        height: 32, minWidth: 42, padding: '0 .5rem',
        borderRadius: 6, background: 'var(--blue-50)',
        color: 'var(--blue-700)', border: '1px solid var(--blue-100)',
        fontFamily: 'var(--font-mono)', fontSize: '.68rem', fontWeight: 800, flexShrink: 0,
      }}>
        {TIPO_ICON[p.tipo_archivo] || 'PPT'}
      </span>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.titulo}
        </div>
        <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '.15rem' }}>
          {TIPO_LABEL[p.tipo_archivo]} · {p.archivo_nombre || 'Enlace externo'} · {new Date(p.created_at).toLocaleDateString('es-ES')}
        </div>
        {p.descripcion && (
          <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.descripcion}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center', flexShrink: 0 }}>
        {moviendo ? (
          <>
            <select
              value={destino}
              onChange={e => setDestino(e.target.value)}
              autoFocus
              style={{
                fontSize: '.78rem', padding: '.3rem .5rem',
                border: '1.5px solid var(--blue-400)', borderRadius: 4,
                background: 'var(--white)', color: 'var(--text)', outline: 'none',
              }}
            >
              <option value="">Sin carpeta</option>
              {carpetas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={confirmarMover}>OK</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setMoviendo(false)}>✕</button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => onVer(p)}>Ver</button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setMoviendo(true); setDestino(carpetaActual !== null ? String(carpetaActual) : ''); }}
            >
              Mover
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => onEliminar(p)}>Eliminar</button>
          </>
        )}
      </div>
    </article>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function PresentacionesDocente() {
  const [lista, setLista]       = useState([]);
  const [carpetas, setCarpetas] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCarpetaForm, setShowCarpetaForm] = useState(false);
  const [nuevaCarpeta, setNuevaCarpeta] = useState('');
  const [saving, setSaving]     = useState(false);
  const [savingCarpeta, setSavingCarpeta] = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState(EMPTY_FORM);
  const [file, setFile]         = useState(null);
  const [visor, setVisor]       = useState(null);
  const fileRef = useRef();

  async function cargar() {
    setLoading(true);
    const [resP, resC] = await Promise.allSettled([
      api.get('/docente/mis-presentaciones'),
      api.get('/docente/carpetas'),
    ]);
    if (resP.status === 'fulfilled') setLista(resP.value.data);
    if (resC.status === 'fulfilled') setCarpetas(resC.value.data);
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  // ── Crear presentación ────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const hasLink = Boolean(form.enlace_url.trim());
    if (!form.titulo.trim())     return setError('El título es obligatorio');
    if (!file && !hasLink)       return setError('Selecciona un archivo PDF/PPTX o pega un enlace público de Drive');
    if (file && hasLink)         return setError('Usa solo una opción: archivo o enlace');
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'pptx'].includes(ext)) return setError('Solo se permiten archivos PDF o PPTX');
    }
    setSaving(true); setError('');
    const fd = new FormData();
    fd.append('titulo', form.titulo.trim());
    fd.append('descripcion', form.descripcion);
    fd.append('enlace_url', form.enlace_url.trim());
    if (form.carpeta_id) fd.append('carpeta_id', form.carpeta_id);
    if (file) fd.append('archivo', file);
    try {
      await api.post('/docente/presentaciones', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowForm(false); setForm(EMPTY_FORM); setFile(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir');
    } finally {
      setSaving(false);
    }
  }

  // ── Crear carpeta ─────────────────────────────────────────
  async function handleCrearCarpeta(e) {
    e.preventDefault();
    if (!nuevaCarpeta.trim()) return;
    setSavingCarpeta(true);
    try {
      await api.post('/docente/carpetas', { nombre: nuevaCarpeta.trim() });
      setNuevaCarpeta(''); setShowCarpetaForm(false);
      cargar();
    } finally {
      setSavingCarpeta(false);
    }
  }

  // ── Renombrar carpeta ─────────────────────────────────────
  async function handleRenombrar(id, nombre) {
    await api.put(`/docente/carpetas/${id}`, { nombre });
    cargar();
  }

  // ── Eliminar carpeta ──────────────────────────────────────
  async function handleEliminarCarpeta(c) {
    if (!confirm(`Eliminar carpeta "${c.nombre}"? Las presentaciones dentro quedarán sin carpeta.`)) return;
    await api.delete(`/docente/carpetas/${c.id}`);
    cargar();
  }

  // ── Mover presentación ────────────────────────────────────
  async function handleMover(id, carpetaId) {
    await api.put(`/docente/presentaciones/${id}/mover`, { carpeta_id: carpetaId });
    cargar();
  }

  // ── Eliminar presentación ─────────────────────────────────
  async function handleEliminar(p) {
    if (!confirm(`Eliminar "${p.titulo}"?`)) return;
    await api.delete(`/docente/presentaciones/${p.id}`);
    cargar();
  }

  // ── Agrupar por carpeta ───────────────────────────────────
  const grupos = (() => {
    const map = {};
    carpetas.forEach(c => { map[c.id] = { carpeta: c, items: [] }; });
    map['sin'] = { carpeta: null, items: [] };
    lista.forEach(p => {
      const key = p.carpeta_id ?? 'sin';
      if (!map[key]) map[key] = { carpeta: null, items: [] };
      map[key].items.push(p);
    });
    return [
      ...carpetas.map(c => map[c.id]),
      map['sin'],
    ].filter(g => g);
  })();

  const total = lista.length;

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      <PageHeader
        num="09"
        eyebrow="Material de clase"
        title={<>Presentaciones <span className="display-italic">digitales</span></>}
        lead="Organice su material en carpetas. Comparta presentaciones como PDF, PPTX o enlace público de Google Drive."
        actions={
          <div style={{ display: 'flex', gap: '.6rem' }}>
            <button className="btn btn-ghost btn-lg"
              onClick={() => { setShowCarpetaForm(s => !s); setShowForm(false); }}>
              <IconFolder size={15} /> Nueva carpeta
            </button>
            <button className="btn btn-primary btn-lg"
              onClick={() => { setShowForm(s => !s); setShowCarpetaForm(false); setError(''); }}>
              + Subir presentación
            </button>
          </div>
        }
      />

      {/* ── Form nueva carpeta ─────────────────────────────── */}
      {showCarpetaForm && (
        <form onSubmit={handleCrearCarpeta} className="fade-up" style={{
          display: 'flex', gap: '.75rem', alignItems: 'center',
          padding: '1rem 1.25rem',
          background: 'var(--blue-50)', border: '1.5px solid var(--blue-100)',
          borderRadius: 'var(--radius)', marginBottom: '1.25rem',
        }}>
          <IconFolder size={18} color="var(--blue-600)" />
          <input
            autoFocus
            className="form-input"
            placeholder="Nombre de la carpeta…"
            value={nuevaCarpeta}
            onChange={e => setNuevaCarpeta(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" type="submit" disabled={savingCarpeta || !nuevaCarpeta.trim()}>
            {savingCarpeta ? 'Creando…' : 'Crear'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => { setShowCarpetaForm(false); setNuevaCarpeta(''); }}>
            Cancelar
          </button>
        </form>
      )}

      {/* ── Form nueva presentación ────────────────────────── */}
      {showForm && (
        <section className="fade-up" style={{
          background: 'var(--surface)', border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
          padding: '1.4rem', marginBottom: '1.75rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1rem', marginBottom: '1.2rem', borderBottom: '1px solid var(--border)' }}>
            <div>
              <span className="eyebrow">Nueva publicación</span>
              <h2 style={{ fontSize: '1.2rem', marginTop: '.25rem' }}>Nueva presentación</h2>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,.9fr) minmax(280px,1.1fr)', gap: '1rem' }}>
              <div className="form-field">
                <label>Título *</label>
                <input className="form-input" value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ej. Circuitos lógicos" />
              </div>
              <div className="form-field">
                <label>Descripción</label>
                <textarea className="form-input" rows={2} value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Breve contexto para los estudiantes" />
              </div>
            </div>

            {carpetas.length > 0 && (
              <div className="form-field" style={{ maxWidth: 340, marginBottom: '1rem' }}>
                <label>Carpeta (opcional)</label>
                <select className="form-input" value={form.carpeta_id}
                  onChange={e => setForm(f => ({ ...f, carpeta_id: e.target.value }))}>
                  <option value="">Sin carpeta</option>
                  {carpetas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '1rem', marginTop: '.15rem' }}>
              {/* Panel archivo */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '.85rem',
                minHeight: 164, padding: '1rem',
                background: file ? 'var(--blue-50)' : 'var(--gray-50)',
                border: `1.5px solid ${file ? 'var(--blue-400)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                boxShadow: file ? '0 0 0 3px rgba(37,99,235,.08)' : 'none',
                transition: 'all .15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.8rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 36, minWidth: 44, padding: '0 .55rem', borderRadius: 8, background: 'var(--blue-50)', color: 'var(--blue-700)', border: '1px solid var(--blue-100)', fontFamily: 'var(--font-mono)', fontSize: '.72rem', fontWeight: 800 }}>PDF</span>
                  <div>
                    <strong style={{ display: 'block', fontWeight: 700 }}>Subir archivo</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '.84rem' }}>Use PDF o PPTX desde su equipo.</p>
                  </div>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => fileRef.current.click()}>
                  Seleccionar archivo
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '.84rem', wordBreak: 'break-word' }}>
                  {file ? file.name : 'Sin archivo seleccionado'}
                </span>
              </div>

              {/* Panel URL */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '.85rem',
                minHeight: 164, padding: '1rem',
                background: form.enlace_url.trim() ? 'var(--blue-50)' : 'var(--gray-50)',
                border: `1.5px solid ${form.enlace_url.trim() ? 'var(--blue-400)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                boxShadow: form.enlace_url.trim() ? '0 0 0 3px rgba(37,99,235,.08)' : 'none',
                transition: 'all .15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.8rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 36, minWidth: 44, padding: '0 .55rem', borderRadius: 8, background: 'var(--blue-50)', color: 'var(--blue-700)', border: '1px solid var(--blue-100)', fontFamily: 'var(--font-mono)', fontSize: '.72rem', fontWeight: 800 }}>URL</span>
                  <div>
                    <strong style={{ display: 'block', fontWeight: 700 }}>Usar enlace</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '.84rem' }}>Drive o Google Slides público.</p>
                  </div>
                </div>
                <input className="form-input" value={form.enlace_url}
                  onChange={e => setForm(f => ({ ...f, enlace_url: e.target.value }))}
                  placeholder="https://docs.google.com/presentation/d/..." />
              </div>

              <input ref={fileRef} type="file" accept=".pdf,.pptx" style={{ display: 'none' }}
                onChange={e => setFile(e.target.files[0] || null)} />
            </div>

            <p style={{ marginTop: '.9rem', padding: '.75rem .9rem', background: 'var(--gray-50)', borderLeft: '3px solid var(--blue-500)', borderRadius: 4, color: 'var(--text-muted)', fontSize: '.84rem' }}>
              Use solo una opción: archivo o enlace. Los enlaces deben estar compartidos públicamente.
            </p>

            {error && (
              <div style={{ marginTop: '.9rem', padding: '.75rem .9rem', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar presentación'}</button>
              <button className="btn btn-ghost" type="button" onClick={() => { setForm(EMPTY_FORM); setFile(null); setError(''); }}>Limpiar</button>
            </div>
          </form>
        </section>
      )}

      {/* ── Biblioteca ────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', border: '1.5px dashed var(--border-strong)', borderRadius: 'var(--radius)' }}>
          Cargando…
        </div>
      ) : total === 0 && carpetas.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface)', border: '1.5px dashed var(--border-strong)', borderRadius: 'var(--radius)' }}>
          No has subido presentaciones aún. Usa el botón <strong>+ Subir presentación</strong> para comenzar.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '.75rem', borderBottom: '2px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Biblioteca de presentaciones</h2>
            <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{total} material{total !== 1 ? 'es' : ''} · {carpetas.length} carpeta{carpetas.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {grupos.map((g, i) => (
              (g.items.length > 0 || g.carpeta) && (
                <CarpetaSeccion
                  key={g.carpeta?.id ?? 'sin'}
                  carpeta={g.carpeta}
                  items={g.items}
                  carpetas={carpetas}
                  onVer={setVisor}
                  onMover={handleMover}
                  onEliminar={handleEliminar}
                  onRenombrar={handleRenombrar}
                  onEliminarCarpeta={handleEliminarCarpeta}
                />
              )
            ))}
          </div>
        </>
      )}

      <Modal open={!!visor} onClose={() => setVisor(null)} title={visor?.titulo || 'Presentación'} maxWidth="1120px">
        {visor && <PresentationViewer presentation={visor} />}
      </Modal>
    </div>
  );
}
