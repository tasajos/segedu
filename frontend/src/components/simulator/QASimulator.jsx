import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/* ══════════════════════════════════════════════════════════════
   CONSTANTES
   ══════════════════════════════════════════════════════════════ */
const SEVERIDAD = {
  critica: { bg: '#fef2f2', border: '#ef444433', text: '#b91c1c', label: 'Crítica' },
  alta:    { bg: '#fff7ed', border: '#f9731633', text: '#c2410c', label: 'Alta' },
  media:   { bg: '#fffbeb', border: '#eab30833', text: '#a16207', label: 'Media' },
  baja:    { bg: '#f0fdf4', border: '#22c55e33', text: '#15803d', label: 'Baja' },
};

const ESTADO_BUG = {
  nuevo:           { bg: '#eff6ff', text: '#1d4ed8', label: 'Nuevo' },
  abierto:         { bg: '#fff7ed', text: '#c2410c', label: 'Abierto' },
  en_progreso:     { bg: '#faf5ff', text: '#7c3aed', label: 'En Progreso' },
  pending_testing: { bg: '#f0f9ff', text: '#0369a1', label: 'Pending Testing' },
  resuelto:        { bg: '#f0fdf4', text: '#15803d', label: 'Resuelto' },
  cerrado:         { bg: '#f1f5f9', text: '#475569', label: 'Cerrado' },
  rechazado:       { bg: '#fef2f2', text: '#b91c1c', label: 'Rechazado' },
};

const ESTADO_TC = {
  no_ejecutado: { bg: '#f1f5f9', text: '#475569', label: 'No Ejecutado' },
  pasado:       { bg: '#f0fdf4', text: '#15803d', label: 'Pass' },
  fallido:      { bg: '#fef2f2', text: '#b91c1c', label: 'Failed' },
  bloqueado:    { bg: '#fffbeb', text: '#a16207', label: 'Block' },
  na:           { bg: '#f8fafc', text: '#64748b', label: 'N/A' },
};

const EMPTY_BUG = { titulo: '', descripcion: '', pasos_reproduccion: '', resultado_esperado: '', resultado_actual: '', severidad: 'media', prioridad: 'media', estado: 'nuevo', tipo: 'funcional', ambiente: 'qa' };
const EMPTY_TC  = { titulo: '', descripcion: '', precondiciones: '', pasos: [''], resultado_esperado: '', prioridad: 'media', categoria: '' };

/* ══════════════════════════════════════════════════════════════
   ATOMS
   ══════════════════════════════════════════════════════════════ */
function Badge({ cfg, small }) {
  if (!cfg) return null;
  return (
    <span style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border || cfg.text + '33'}`, fontSize: small ? '.65rem' : '.7rem', padding: small ? '.1rem .38rem' : '.14rem .48rem', borderRadius: '99px', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}
function Tag({ children }) {
  return <span style={{ fontSize: '.65rem', color: 'var(--ink-light)', background: 'rgba(0,0,0,.06)', padding: '.1rem .38rem', borderRadius: '3px' }}>{children}</span>;
}
function Btn({ onClick, children, variant = 'ghost', disabled }) {
  const base = { all: 'unset', cursor: disabled ? 'default' : 'pointer', fontSize: '.73rem', padding: '.3rem .65rem', borderRadius: '4px', whiteSpace: 'nowrap', opacity: disabled ? .5 : 1, transition: 'opacity .15s' };
  const s = {
    ghost:   { ...base, border: '1px solid rgba(0,0,0,.13)', color: 'var(--ink-light)' },
    primary: { ...base, background: 'var(--ink)', color: '#fff', border: 'none' },
    danger:  { ...base, border: '1px solid #ef444444', color: '#ef4444' },
    success: { ...base, border: '1px solid #15803d44', color: '#15803d', fontWeight: 600 },
    info:    { ...base, border: '1px solid #0369a144', color: '#0369a1', fontWeight: 600 },
    manager: { ...base, border: '1px solid #7c3aed44', color: '#7c3aed', fontWeight: 600 },
  };
  return <button onClick={!disabled ? onClick : undefined} style={s[variant]}>{children}</button>;
}

function Modal({ title, onClose, wide, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '1.5rem 1rem', overflowY: 'auto' }}>
      <div style={{ background: 'var(--paper)', borderRadius: '8px', width: '100%', maxWidth: wide ? '800px' : '560px', boxShadow: '0 20px 60px rgba(0,0,0,.22)', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.4rem', borderBottom: '1px solid rgba(0,0,0,.08)' }}>
          <h3 style={{ fontFamily: 'var(--serif)', margin: 0, fontSize: '1.05rem' }}>{title}</h3>
          <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--ink-light)', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '1.4rem' }}>{children}</div>
      </div>
    </div>
  );
}

const inputS = { width: '100%', padding: '.45rem .7rem', border: '1px solid rgba(0,0,0,.15)', borderRadius: '4px', fontSize: '.82rem', background: 'var(--paper-dark)', color: 'var(--ink)', fontFamily: 'inherit', boxSizing: 'border-box' };
const taS    = { ...inputS, minHeight: '75px', resize: 'vertical' };
const labelS = { fontSize: '.72rem', fontWeight: 700, color: 'var(--ink-light)', display: 'block', marginBottom: '.28rem' };
function Field({ label, children }) { return <div><label style={labelS}>{label}</label>{children}</div>; }

function StatsRow({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '.65rem', marginBottom: '1.15rem' }}>
      {items.map(s => (
        <div key={s.label} style={{ background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.08)', borderRadius: '6px', padding: '.7rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.val}</div>
          <div style={{ fontSize: '.64rem', color: 'var(--ink-light)', marginTop: '.1rem' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMMENTS THREAD
   ══════════════════════════════════════════════════════════════ */
function CommentsThread({ bugId, rol, readOnly }) {
  const [comments, setComments] = useState([]);
  const [text, setText]         = useState('');
  const [saving, setSaving]     = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    api.get(`/auth/qa/bugs/${bugId}/comments`).then(r => setComments(r.data)).catch(() => {});
  }, [bugId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  const send = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const r = await api.post(`/auth/qa/bugs/${bugId}/comments`, { comentario: text, rol_sesion: rol });
      setComments(prev => [...prev, r.data]);
      setText('');
    } catch (e) { alert(e.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  const COLOR = { DEV: { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' }, QA: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' }, MANAGER: { bg: '#faf5ff', border: '#a855f7', text: '#7c3aed' } };

  return (
    <div>
      <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.6rem' }}>
        Comentarios {comments.length > 0 && `(${comments.length})`}
      </div>
      {comments.length === 0 ? (
        <div style={{ padding: '.65rem .85rem', background: 'rgba(0,0,0,.03)', borderRadius: '5px', fontSize: '.78rem', color: 'var(--ink-light)', marginBottom: '.75rem' }}>Sin comentarios aún.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem', marginBottom: '.75rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '.25rem' }}>
          {comments.map(c => {
            const st = COLOR[c.rol_sesion] || COLOR.QA;
            return (
              <div key={c.id} style={{ padding: '.55rem .75rem', borderRadius: '6px', background: st.bg, borderLeft: `3px solid ${st.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.18rem', gap: '.5rem' }}>
                  <span style={{ fontSize: '.69rem', fontWeight: 700, color: st.text }}>{c.autor} · {c.rol_sesion}</span>
                  <span style={{ fontSize: '.64rem', color: 'var(--ink-light)', flexShrink: 0 }}>{new Date(c.created_at).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div style={{ fontSize: '.82rem', lineHeight: 1.5 }}>{c.comentario}</div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      )}
      {!readOnly && (
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-end' }}>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Escribe un comentario… (Ctrl+Enter para enviar)" style={{ ...taS, flex: 1, minHeight: '58px' }} onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) send(); }} />
          <button onClick={send} disabled={!text.trim() || saving} style={{ padding: '.45rem .85rem', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '.78rem', opacity: (!text.trim() || saving) ? .5 : 1, flexShrink: 0 }}>
            {saving ? '…' : 'Enviar'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BUG INFO
   ══════════════════════════════════════════════════════════════ */
function BugInfo({ bug }) {
  const row = (label, val) => val ? (
    <div style={{ marginBottom: '.65rem' }}>
      <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.15rem' }}>{label}</div>
      <div style={{ fontSize: '.83rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{val}</div>
    </div>
  ) : null;
  return (
    <div>
      <div style={{ display: 'flex', gap: '.38rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <Badge cfg={SEVERIDAD[bug.severidad]} /><Badge cfg={ESTADO_BUG[bug.estado]} />
        <Tag>Tipo: {bug.tipo}</Tag><Tag>Ambiente: {bug.ambiente}</Tag><Tag>Prioridad: {bug.prioridad}</Tag>
        {bug.asignado_qa_nombre?.trim() && <span style={{ fontSize: '.7rem', background: '#faf5ff', color: '#7c3aed', border: '1px solid #a855f733', padding: '.14rem .48rem', borderRadius: '99px', fontWeight: 600 }}>Asignado a: {bug.asignado_qa_nombre}</span>}
        {bug.enviado_testing_por_nombre?.trim() && <span style={{ fontSize: '.7rem', background: '#f0f9ff', color: '#0369a1', border: '1px solid #0369a133', padding: '.14rem .48rem', borderRadius: '99px', fontWeight: 600 }}>Fix por: {bug.enviado_testing_por_nombre}</span>}
      </div>
      {row('Descripción', bug.descripcion)}
      {row('Pasos para reproducir', bug.pasos_reproduccion)}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>{row('Resultado esperado', bug.resultado_esperado)}</div>
        <div>{row('Resultado actual', bug.resultado_actual)}</div>
      </div>
      <div style={{ fontSize: '.68rem', color: 'var(--ink-light)', borderTop: '1px solid rgba(0,0,0,.07)', paddingTop: '.6rem', marginTop: '.25rem' }}>
        Reportado por {bug.reportado_por_nombre} · {new Date(bug.created_at).toLocaleString('es-BO')}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   IMAGES SECTION
   ══════════════════════════════════════════════════════════════ */
function ImagesSection({ bugId, canDelete }) {
  const [images, setImages]     = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () =>
    api.get(`/auth/qa/bugs/${bugId}/images`).then(r => setImages(r.data)).catch(() => {});

  useEffect(() => { load(); }, [bugId]);

  const handleUpload = async (e) => {
    const picked = Array.from(e.target.files);
    if (!picked.length) return;
    setUploading(true);
    const fd = new FormData();
    picked.forEach(f => fd.append('images', f));
    try {
      await api.post(`/auth/qa/bugs/${bugId}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al subir imágenes');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (imgId) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    await api.delete(`/auth/qa/bugs/${bugId}/images/${imgId}`).catch(() => {});
    setImages(prev => prev.filter(i => i.id !== imgId));
  };

  const imgUrl = (filename) => `/uploads/qa/${filename}`;

  return (
    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.65rem' }}>
        <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Imágenes {images.length > 0 && `(${images.length})`}
        </span>
        <label style={{ cursor: uploading ? 'default' : 'pointer', fontSize: '.72rem', color: uploading ? 'var(--ink-light)' : 'var(--ink)', padding: '.18rem .55rem', border: '1px solid rgba(0,0,0,.14)', borderRadius: '4px', opacity: uploading ? .5 : 1 }}>
          {uploading ? 'Subiendo…' : '+ Agregar'}
          <input ref={fileRef} type="file" multiple accept="image/*" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
        </label>
      </div>

      {images.length === 0 ? (
        <div style={{ padding: '.5rem .85rem', background: 'rgba(0,0,0,.03)', borderRadius: '5px', fontSize: '.78rem', color: 'var(--ink-light)' }}>
          Sin imágenes adjuntas.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.55rem' }}>
          {images.map(img => (
            <div key={img.id} style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={imgUrl(img.filename)}
                alt={img.original_name}
                title={img.original_name}
                onClick={() => setLightbox(img)}
                style={{ width: '88px', height: '68px', objectFit: 'cover', borderRadius: '5px', border: '1px solid rgba(0,0,0,.12)', cursor: 'zoom-in', display: 'block' }}
              />
              {canDelete && (
                <button
                  onClick={() => handleDelete(img.id)}
                  title="Eliminar imagen"
                  style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(0,0,0,.65)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}>
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '2rem', cursor: 'zoom-out' }}>
          <img
            src={imgUrl(lightbox.filename)}
            alt={lightbox.original_name}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '6px', boxShadow: '0 24px 64px rgba(0,0,0,.5)', cursor: 'default' }}
          />
          <div style={{ position: 'fixed', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)', fontSize: '.78rem', color: 'rgba(255,255,255,.7)', background: 'rgba(0,0,0,.5)', padding: '.3rem .8rem', borderRadius: '99px' }}>
            {lightbox.original_name}
          </div>
          <button
            onClick={() => setLightbox(null)}
            style={{ position: 'fixed', top: '1rem', right: '1rem', background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BUG DETAIL MODAL
   context: 'bugReporter' | 'pendingTesting'
   ══════════════════════════════════════════════════════════════ */
function BugDetailModal({ bug, rol, context, onClose, onRefresh, onEdit }) {
  const [estado, setEstado]       = useState(bug.estado);
  const [asignQAId, setAsignQA]   = useState(bug.asignado_qa_id || '');
  const [usuarios, setUsuarios]   = useState([]);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (rol === 'MANAGER') api.get('/auth/qa/usuarios').then(r => setUsuarios(r.data)).catch(() => {});
  }, [rol]);

  const updateEstado = async (nuevoEstado) => {
    setSaving(true);
    try {
      await api.put(`/auth/qa/bugs/${bug.id}`, { titulo: bug.titulo, descripcion: bug.descripcion, pasos_reproduccion: bug.pasos_reproduccion, resultado_esperado: bug.resultado_esperado, resultado_actual: bug.resultado_actual, severidad: bug.severidad, prioridad: bug.prioridad, estado: nuevoEstado, tipo: bug.tipo, ambiente: bug.ambiente });
      onRefresh(); onClose();
    } catch (e) { alert(e.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  const handleAsignar = async () => {
    if (!asignQAId) return;
    setSaving(true);
    try { await api.post(`/auth/qa/bugs/${bug.id}/asignar`, { asignado_qa_id: asignQAId }); onRefresh(); onClose(); }
    catch (e) { alert(e.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  return (
    <Modal title={`Bug #${bug.id} — ${bug.titulo}`} onClose={onClose} wide>
      <BugInfo bug={bug} />

      <ImagesSection bugId={bug.id} canDelete={rol === 'QA' || rol === 'MANAGER'} />

      {/* DEV: cambiar estado + pending testing */}
      {rol === 'DEV' && context === 'bugReporter' && (
        <div style={{ marginTop: '1.1rem', padding: '1rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px' }}>
          <div style={{ fontSize: '.74rem', fontWeight: 700, color: '#0369a1', marginBottom: '.65rem' }}>Acciones del Developer</div>
          <div style={{ display: 'flex', gap: '.65rem', alignItems: 'flex-end', marginBottom: '.65rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelS}>Cambiar estado</label>
              <select value={estado} onChange={e => setEstado(e.target.value)} style={inputS}>
                {Object.entries(ESTADO_BUG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <button onClick={() => updateEstado(estado)} disabled={saving || estado === bug.estado}
              style={{ padding: '.45rem 1rem', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '.8rem', opacity: (saving || estado === bug.estado) ? .5 : 1 }}>
              Guardar estado
            </button>
          </div>
          <button onClick={() => updateEstado('pending_testing')} disabled={saving || bug.estado === 'pending_testing'}
            style={{ width: '100%', padding: '.5rem', background: '#0369a1', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '.83rem', fontWeight: 700, opacity: (saving || bug.estado === 'pending_testing') ? .55 : 1 }}>
            {bug.estado === 'pending_testing' ? '✓ Ya está en Pending Testing' : '⏫ Enviar a Pending Testing'}
          </button>
        </div>
      )}

      {/* QA: marcar resuelto */}
      {rol === 'QA' && context === 'pendingTesting' && (
        <div style={{ marginTop: '1.1rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
          <div style={{ fontSize: '.74rem', fontWeight: 700, color: '#15803d', marginBottom: '.65rem' }}>Revisión de QA</div>
          <button onClick={() => updateEstado('resuelto')} disabled={saving}
            style={{ width: '100%', padding: '.5rem', background: '#15803d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '.83rem', fontWeight: 700, opacity: saving ? .55 : 1 }}>
            ✓ Marcar como Resuelto
          </button>
        </div>
      )}

      {/* MANAGER: asignar QA + resolver */}
      {rol === 'MANAGER' && context === 'pendingTesting' && (
        <div style={{ marginTop: '1.1rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <div style={{ padding: '1rem', background: '#faf5ff', border: '1px solid #d8b4fe', borderRadius: '6px' }}>
            <div style={{ fontSize: '.74rem', fontWeight: 700, color: '#7c3aed', marginBottom: '.65rem' }}>Asignar Revisor QA</div>
            <div style={{ display: 'flex', gap: '.65rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={labelS}>Seleccionar QA reviewer</label>
                <select value={asignQAId} onChange={e => setAsignQA(e.target.value)} style={inputS}>
                  <option value="">Sin asignar</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido || ''}</option>)}
                </select>
              </div>
              <button onClick={handleAsignar} disabled={saving}
                style={{ padding: '.45rem 1rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '.8rem', opacity: saving ? .5 : 1 }}>
                Asignar
              </button>
            </div>
          </div>
          <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
            <div style={{ fontSize: '.74rem', fontWeight: 700, color: '#15803d', marginBottom: '.65rem' }}>Cierre</div>
            <button onClick={() => updateEstado('resuelto')} disabled={saving}
              style={{ width: '100%', padding: '.5rem', background: '#15803d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '.83rem', fontWeight: 700, opacity: saving ? .55 : 1 }}>
              ✓ Marcar como Resuelto
            </button>
          </div>
        </div>
      )}

      {/* QA/MANAGER: editar bug en bug reporter */}
      {(rol === 'QA' || rol === 'MANAGER') && context === 'bugReporter' && onEdit && (
        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <button onClick={onEdit} style={{ padding: '.45rem 1.1rem', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '.82rem' }}>Editar Bug</button>
        </div>
      )}

      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,.07)' }}>
        <CommentsThread bugId={bug.id} rol={rol} />
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════
   BUG FORM
   ══════════════════════════════════════════════════════════════ */
function BugForm({ initial, onSave, onCancel, saving }) {
  const [f, setF]       = useState({ ...EMPTY_BUG, ...initial });
  const [files, setFiles] = useState([]);
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
      <Field label="Título *"><input style={inputS} value={f.titulo} onChange={e => s('titulo', e.target.value)} placeholder="Ej: El botón guardar no responde en Firefox" /></Field>
      <Field label="Descripción"><textarea style={taS} value={f.descripcion} onChange={e => s('descripcion', e.target.value)} placeholder="Descripción detallada del problema…" /></Field>
      <Field label="Pasos para reproducir"><textarea style={{ ...taS, minHeight: '90px' }} value={f.pasos_reproduccion} onChange={e => s('pasos_reproduccion', e.target.value)} placeholder={'1. Ir a la pantalla X\n2. Hacer clic en Y\n3. Observar el error…'} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>
        <Field label="Resultado esperado"><textarea style={{ ...taS, minHeight: '65px' }} value={f.resultado_esperado} onChange={e => s('resultado_esperado', e.target.value)} placeholder="Qué debería ocurrir…" /></Field>
        <Field label="Resultado actual"><textarea style={{ ...taS, minHeight: '65px' }} value={f.resultado_actual} onChange={e => s('resultado_actual', e.target.value)} placeholder="Qué ocurrió en realidad…" /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.9rem' }}>
        <Field label="Severidad"><select style={inputS} value={f.severidad} onChange={e => s('severidad', e.target.value)}><option value="critica">Crítica</option><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></Field>
        <Field label="Prioridad"><select style={inputS} value={f.prioridad} onChange={e => s('prioridad', e.target.value)}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></Field>
        <Field label="Estado"><select style={inputS} value={f.estado} onChange={e => s('estado', e.target.value)}>{Object.entries(ESTADO_BUG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>
        <Field label="Tipo"><select style={inputS} value={f.tipo} onChange={e => s('tipo', e.target.value)}><option value="funcional">Funcional</option><option value="ui">UI / UX</option><option value="rendimiento">Rendimiento</option><option value="seguridad">Seguridad</option><option value="usabilidad">Usabilidad</option><option value="otro">Otro</option></select></Field>
        <Field label="Ambiente"><select style={inputS} value={f.ambiente} onChange={e => s('ambiente', e.target.value)}><option value="desarrollo">Desarrollo</option><option value="qa">QA</option><option value="staging">Staging</option><option value="produccion">Producción</option></select></Field>
      </div>

      {/* Image upload */}
      <div>
        <label style={labelS}>Imágenes adjuntas (opcional)</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.6rem .9rem', border: '2px dashed rgba(0,0,0,.14)', borderRadius: '6px', cursor: 'pointer', fontSize: '.82rem', color: 'var(--ink-light)', transition: 'border-color .15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,.14)'}>
          <span style={{ fontSize: '1.2rem' }}>📎</span>
          <span>{files.length > 0 ? `${files.length} imagen${files.length > 1 ? 'es' : ''} seleccionada${files.length > 1 ? 's' : ''}` : 'Haz clic para adjuntar imágenes…'}</span>
          <input type="file" multiple accept="image/*" onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])} style={{ display: 'none' }} />
        </label>
        {files.length > 0 && (
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginTop: '.45rem' }}>
            {files.map((file, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.72rem', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', padding: '.18rem .5rem', borderRadius: '3px' }}>
                🖼 {file.name.length > 22 ? file.name.slice(0, 22) + '…' : file.name}
                <button onClick={() => removeFile(i)} style={{ all: 'unset', cursor: 'pointer', color: '#ef4444', marginLeft: '.15rem', lineHeight: 1, fontSize: '.9rem' }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '.65rem', justifyContent: 'flex-end', paddingTop: '.75rem', borderTop: '1px solid rgba(0,0,0,.07)' }}>
        <button onClick={onCancel} style={{ padding: '.45rem 1.1rem', border: '1px solid rgba(0,0,0,.14)', borderRadius: '4px', background: 'transparent', cursor: 'pointer', fontSize: '.82rem' }}>Cancelar</button>
        <button onClick={() => onSave(f, files)} disabled={!f.titulo || saving} style={{ padding: '.45rem 1.1rem', border: 'none', borderRadius: '4px', background: 'var(--ink)', color: '#fff', cursor: 'pointer', fontSize: '.82rem', opacity: (!f.titulo || saving) ? .55 : 1 }}>{saving ? 'Guardando…' : 'Guardar Bug'}</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BUGS TAB
   ══════════════════════════════════════════════════════════════ */
function BugsTab({ rol }) {
  const [bugs, setBugs]     = useState([]);
  const [loading, setLoad]  = useState(true);
  const [showForm, setForm] = useState(false);
  const [editBug, setEdit]  = useState(null);
  const [viewBug, setView]  = useState(null);
  const [saving, setSave]   = useState(false);
  const [fEst, setFEst]     = useState('');
  const [fSev, setFSev]     = useState('');

  const canEdit = rol === 'QA' || rol === 'MANAGER';
  const load = () => { setLoad(true); api.get('/auth/qa/bugs').then(r => setBugs(r.data)).catch(() => {}).finally(() => setLoad(false)); };
  useEffect(load, []);

  const openNew   = () => { setEdit(null); setForm(true); };
  const openEdit  = (b) => { setEdit(b); setForm(true); };
  const closeForm = () => { setEdit(null); setForm(false); };

  const handleSave = async (form, files) => {
    setSave(true);
    try {
      let bugId;
      if (editBug) {
        await api.put(`/auth/qa/bugs/${editBug.id}`, form);
        bugId = editBug.id;
      } else {
        const r = await api.post('/auth/qa/bugs', form);
        bugId = r.data.id;
      }
      if (files?.length) {
        const fd = new FormData();
        files.forEach(f => fd.append('images', f));
        await api.post(`/auth/qa/bugs/${bugId}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      closeForm(); load();
    } catch (e) { alert(e.response?.data?.error || 'Error'); } finally { setSave(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este bug?')) return;
    await api.delete(`/auth/qa/bugs/${id}`).catch(() => {});
    load();
  };

  const filtered = bugs.filter(b => (!fEst || b.estado === fEst) && (!fSev || b.severidad === fSev));

  return (
    <div>
      <StatsRow items={[
        { label: 'Total',       val: bugs.length,                                                         color: '#1d4ed8' },
        { label: 'Nuevos',      val: bugs.filter(b => b.estado === 'nuevo').length,                      color: '#c2410c' },
        { label: 'En Progreso', val: bugs.filter(b => b.estado === 'en_progreso').length,                color: '#7c3aed' },
        { label: 'Pending',     val: bugs.filter(b => b.estado === 'pending_testing').length,            color: '#0369a1' },
        { label: 'Resueltos',   val: bugs.filter(b => ['resuelto','cerrado'].includes(b.estado)).length, color: '#15803d' },
      ]} />

      <div style={{ display: 'flex', gap: '.65rem', alignItems: 'center', marginBottom: '.9rem', flexWrap: 'wrap' }}>
        {canEdit && <button onClick={openNew} style={{ padding: '.42rem .9rem', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '.81rem', fontWeight: 600 }}>+ Nuevo Bug</button>}
        <select value={fEst} onChange={e => setFEst(e.target.value)} style={{ padding: '.38rem .55rem', border: '1px solid rgba(0,0,0,.14)', borderRadius: '4px', fontSize: '.77rem', background: 'var(--paper-dark)', color: 'var(--ink)' }}>
          <option value="">Todos los estados</option>{Object.entries(ESTADO_BUG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={fSev} onChange={e => setFSev(e.target.value)} style={{ padding: '.38rem .55rem', border: '1px solid rgba(0,0,0,.14)', borderRadius: '4px', fontSize: '.77rem', background: 'var(--paper-dark)', color: 'var(--ink)' }}>
          <option value="">Todas las severidades</option>{Object.entries(SEVERIDAD).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ fontSize: '.74rem', color: 'var(--ink-light)', marginLeft: 'auto' }}>{filtered.length} bugs</span>
      </div>

      {loading ? <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)' }}>Cargando…</div>
        : filtered.length === 0 ? <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)', border: '2px dashed rgba(0,0,0,.1)', borderRadius: '8px' }}>{bugs.length === 0 ? 'No hay bugs registrados aún.' : 'Sin resultados.'}</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
            {filtered.map(bug => (
              <div key={bug.id} style={{ background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.08)', borderRadius: '6px', padding: '.9rem 1rem', display: 'flex', gap: '.9rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '.45rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.35rem' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '.66rem', color: 'var(--ink-light)' }}>#{bug.id}</span>
                    <span style={{ fontWeight: 600, fontSize: '.87rem' }}>{bug.titulo}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
                    <Badge cfg={SEVERIDAD[bug.severidad]} small /><Badge cfg={ESTADO_BUG[bug.estado]} small /><Tag>{bug.tipo}</Tag>
                    {bug.asignado_qa_nombre?.trim() && <Tag>👤 {bug.asignado_qa_nombre}</Tag>}
                  </div>
                  <div style={{ fontSize: '.66rem', color: 'var(--ink-light)' }}>{bug.reportado_por_nombre} · {new Date(bug.created_at).toLocaleDateString('es-BO')}</div>
                </div>
                <div style={{ display: 'flex', gap: '.35rem', flexShrink: 0, flexWrap: 'wrap' }}>
                  <Btn onClick={() => setView(bug)}>Ver</Btn>
                  {canEdit && <Btn onClick={() => openEdit(bug)}>Editar</Btn>}
                  {canEdit && <Btn variant="danger" onClick={() => handleDelete(bug.id)}>Eliminar</Btn>}
                </div>
              </div>
            ))}
          </div>
        )}

      {showForm && <Modal title={editBug ? 'Editar Bug' : 'Reportar Nuevo Bug'} onClose={closeForm} wide><BugForm initial={editBug || EMPTY_BUG} onSave={handleSave} onCancel={closeForm} saving={saving} /></Modal>}
      {viewBug && <BugDetailModal bug={viewBug} rol={rol} context="bugReporter" onClose={() => setView(null)} onRefresh={load} onEdit={canEdit ? () => { setView(null); openEdit(viewBug); } : undefined} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PENDING TESTING TAB
   ══════════════════════════════════════════════════════════════ */
function PendingTestingTab({ rol }) {
  const { user } = useAuth();
  const [bugs, setBugs]    = useState([]);
  const [loading, setLoad] = useState(true);
  const [viewBug, setView] = useState(null);

  const load = () => { setLoad(true); api.get('/auth/qa/bugs').then(r => setBugs(r.data.filter(b => b.estado === 'pending_testing'))).catch(() => {}).finally(() => setLoad(false)); };
  useEffect(load, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '.9rem' }}>Bugs en Pending Testing</div>
          <div style={{ fontSize: '.76rem', color: 'var(--ink-light)', marginTop: '.1rem' }}>
            {rol === 'MANAGER' ? 'Asigna reviewers QA y cierra los bugs verificados.' : rol === 'QA' ? 'Revisa y marca como resuelto. Los bugs asignados a ti están destacados.' : 'Bugs que enviaste a testing para verificación del equipo QA.'}
          </div>
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '1.4rem', fontWeight: 700, color: '#0369a1' }}>{bugs.length}</span>
      </div>

      {loading ? <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)' }}>Cargando…</div>
        : bugs.length === 0 ? <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)', border: '2px dashed rgba(0,0,0,.1)', borderRadius: '8px' }}>No hay bugs en Pending Testing.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
            {bugs.map(bug => {
              const asignado = bug.asignado_qa_id == user?.id;
              return (
                <div key={bug.id} style={{ background: asignado ? '#faf5ff' : '#f0f9ff', border: `1px solid ${asignado ? '#d8b4fe' : '#bae6fd'}`, borderRadius: '6px', padding: '.9rem 1rem', display: 'flex', gap: '.9rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '.45rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.35rem' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '.66rem', color: asignado ? '#7c3aed' : '#0369a1' }}>#{bug.id}</span>
                      <span style={{ fontWeight: 600, fontSize: '.87rem' }}>{bug.titulo}</span>
                      {asignado && <span style={{ fontSize: '.65rem', background: '#7c3aed', color: '#fff', padding: '.1rem .4rem', borderRadius: '3px', fontWeight: 700 }}>Asignado a ti</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
                      <Badge cfg={SEVERIDAD[bug.severidad]} small /><Tag>{bug.tipo}</Tag><Tag>{bug.ambiente}</Tag>
                      {bug.asignado_qa_nombre?.trim() && <Tag>Reviewer: {bug.asignado_qa_nombre}</Tag>}
                      {bug.enviado_testing_por_nombre?.trim() && <Tag>Fix: {bug.enviado_testing_por_nombre}</Tag>}
                    </div>
                    <div style={{ fontSize: '.66rem', color: 'var(--ink-light)' }}>{bug.reportado_por_nombre} · {new Date(bug.created_at).toLocaleDateString('es-BO')}</div>
                  </div>
                  <Btn variant={rol === 'MANAGER' ? 'manager' : 'info'} onClick={() => setView(bug)}>
                    {rol === 'MANAGER' ? 'Gestionar' : rol === 'QA' ? 'Revisar' : 'Ver detalle'}
                  </Btn>
                </div>
              );
            })}
          </div>
        )}

      {viewBug && <BugDetailModal bug={viewBug} rol={rol} context="pendingTesting" onClose={() => setView(null)} onRefresh={load} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EQUIPOS TAB (solo MANAGER)
   ══════════════════════════════════════════════════════════════ */
function EquiposTab() {
  const [equipos, setEquipos]     = useState([]);
  const [loading, setLoad]        = useState(true);
  const [selected, setSelected]   = useState(null);
  const [miembros, setMiembros]   = useState([]);
  const [usuarios, setUsuarios]   = useState([]);
  const [showNew, setShowNew]     = useState(false);
  const [nombre, setNombre]       = useState('');
  const [desc, setDesc]           = useState('');
  const [nuevoMId, setNuevoMId]   = useState('');
  const [nuevoMRol, setNuevoMRol] = useState('QA');
  const [saving, setSaving]       = useState(false);

  const loadEquipos  = () => { setLoad(true); api.get('/auth/qa/equipos').then(r => setEquipos(r.data)).catch(() => {}).finally(() => setLoad(false)); };
  const loadMiembros = (id) => api.get(`/auth/qa/equipos/${id}/miembros`).then(r => setMiembros(r.data)).catch(() => {});

  useEffect(() => {
    loadEquipos();
    api.get('/auth/qa/usuarios').then(r => setUsuarios(r.data)).catch(() => {});
  }, []);

  useEffect(() => { if (selected) loadMiembros(selected.id); }, [selected]);

  const crearEquipo = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    try { const r = await api.post('/auth/qa/equipos', { nombre, descripcion: desc }); setEquipos(prev => [r.data, ...prev]); setNombre(''); setDesc(''); setShowNew(false); }
    catch (e) { alert(e.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  const eliminarEquipo = async (id) => {
    if (!confirm('¿Eliminar este equipo?')) return;
    await api.delete(`/auth/qa/equipos/${id}`).catch(() => {});
    setEquipos(prev => prev.filter(e => e.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const agregarMiembro = async () => {
    if (!nuevoMId) return;
    setSaving(true);
    try { const r = await api.post(`/auth/qa/equipos/${selected.id}/miembros`, { usuario_id: nuevoMId, rol_equipo: nuevoMRol }); setMiembros(r.data); setNuevoMId(''); }
    catch (e) { alert(e.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  const eliminarMiembro = async (uid) => {
    await api.delete(`/auth/qa/equipos/${selected.id}/miembros/${uid}`).catch(() => {});
    setMiembros(prev => prev.filter(m => m.usuario_id !== uid));
    loadEquipos();
  };

  const disponibles = usuarios.filter(u => !miembros.find(m => m.usuario_id === u.id));

  if (selected) return (
    <div>
      <button onClick={() => setSelected(null)} style={{ all: 'unset', cursor: 'pointer', fontSize: '.8rem', color: 'var(--ink-light)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>← Volver a equipos</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: 'var(--serif)', margin: '0 0 .25rem', fontSize: '1.1rem' }}>👥 {selected.nombre}</h3>
          {selected.descripcion && <p style={{ margin: 0, fontSize: '.8rem', color: 'var(--ink-light)' }}>{selected.descripcion}</p>}
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '1.3rem', fontWeight: 700, color: '#7c3aed' }}>{miembros.length}</span>
      </div>

      {/* Agregar miembro */}
      <div style={{ background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.08)', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '.74rem', fontWeight: 700, color: 'var(--ink-light)', marginBottom: '.65rem' }}>Agregar miembro</div>
        <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}>
          <select value={nuevoMId} onChange={e => setNuevoMId(e.target.value)} style={{ ...inputS, flex: '2 1 160px' }}>
            <option value="">Seleccionar usuario…</option>
            {disponibles.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido || ''} ({u.rol})</option>)}
          </select>
          <select value={nuevoMRol} onChange={e => setNuevoMRol(e.target.value)} style={{ ...inputS, flex: '1 1 90px' }}>
            <option value="QA">QA Tester</option><option value="DEV">Developer</option>
          </select>
          <button onClick={agregarMiembro} disabled={!nuevoMId || saving}
            style={{ padding: '.45rem 1rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '.82rem', opacity: (!nuevoMId || saving) ? .5 : 1 }}>
            Agregar
          </button>
        </div>
      </div>

      {/* Lista de miembros */}
      {miembros.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--ink-light)', border: '2px dashed rgba(0,0,0,.1)', borderRadius: '8px' }}>Sin miembros aún. Agrega el primero.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          {miembros.map(m => (
            <div key={m.usuario_id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem 1rem', background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.08)', borderRadius: '6px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: m.rol_equipo === 'QA' ? '#f0fdf4' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                {m.rol_equipo === 'QA' ? '🔍' : '💻'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '.87rem' }}>{m.nombre_completo}</div>
                <div style={{ fontSize: '.68rem', color: 'var(--ink-light)' }}>{m.email} · Rol sistema: {m.rol_sistema}</div>
              </div>
              <span style={{ fontSize: '.7rem', fontWeight: 700, padding: '.2rem .55rem', borderRadius: '99px', background: m.rol_equipo === 'QA' ? '#f0fdf4' : '#eff6ff', color: m.rol_equipo === 'QA' ? '#15803d' : '#1d4ed8' }}>{m.rol_equipo}</span>
              <Btn variant="danger" onClick={() => eliminarMiembro(m.usuario_id)}>Remover</Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '.9rem' }}>Equipos de QA</div>
          <div style={{ fontSize: '.76rem', color: 'var(--ink-light)', marginTop: '.1rem' }}>Crea equipos y asigna miembros con sus roles.</div>
        </div>
        <button onClick={() => setShowNew(true)} style={{ padding: '.42rem .9rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '.81rem', fontWeight: 600 }}>+ Nuevo Equipo</button>
      </div>

      {showNew && (
        <div style={{ background: 'var(--paper-dark)', border: '1px solid #d8b4fe', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '.74rem', fontWeight: 700, color: '#7c3aed', marginBottom: '.65rem' }}>Nuevo Equipo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <input style={inputS} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del equipo *" />
            <input style={inputS} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción (opcional)" />
            <div style={{ display: 'flex', gap: '.65rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNew(false)} style={{ padding: '.4rem 1rem', border: '1px solid rgba(0,0,0,.14)', borderRadius: '4px', background: 'transparent', cursor: 'pointer', fontSize: '.82rem' }}>Cancelar</button>
              <button onClick={crearEquipo} disabled={!nombre.trim() || saving} style={{ padding: '.4rem 1rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '.82rem', opacity: (!nombre.trim() || saving) ? .5 : 1 }}>{saving ? 'Creando…' : 'Crear Equipo'}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)' }}>Cargando…</div>
        : equipos.length === 0 ? <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)', border: '2px dashed rgba(0,0,0,.1)', borderRadius: '8px' }}>No hay equipos. Crea el primero.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {equipos.map(eq => (
              <div key={eq.id} style={{ background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.08)', borderRadius: '6px', padding: '1rem', display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>👥</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{eq.nombre}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>{eq.total_miembros} miembro{eq.total_miembros !== 1 ? 's' : ''} · Creado por {eq.creado_por_nombre}</div>
                </div>
                <div style={{ display: 'flex', gap: '.35rem' }}>
                  <Btn variant="manager" onClick={() => setSelected(eq)}>Gestionar</Btn>
                  <Btn variant="danger" onClick={() => eliminarEquipo(eq.id)}>Eliminar</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DASHBOARD TAB (solo MANAGER)
   ══════════════════════════════════════════════════════════════ */
function DashboardTab() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    api.get('/auth/qa/dashboard').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoad(false));
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)' }}>Cargando dashboard…</div>;
  if (!stats)  return <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>Error al cargar estadísticas.</div>;

  const { bugTotals: bt, tcTotals: tc, bugsPorUsuario, resueltoPorDev, equipoStats } = stats;
  const maxBugsUser = Math.max(...(bugsPorUsuario.map(u => u.total)), 1);
  const maxBugsDev  = Math.max(...(resueltoPorDev.map(d => d.resueltos || 0)), 1);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.65rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Bugs Totales',    val: bt.total,            color: '#1d4ed8', icon: '🐛' },
          { label: 'Pending Testing', val: bt.pending_testing,  color: '#0369a1', icon: '⏳' },
          { label: 'Resueltos',       val: bt.resueltos,        color: '#15803d', icon: '✅' },
          { label: 'Test Cases',      val: tc.total,            color: '#7c3aed', icon: '🧪' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.08)', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <span style={{ fontSize: '1.6rem' }}>{k.icon}</span>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: k.color, fontFamily: 'var(--mono)', lineHeight: 1 }}>{k.val}</div>
              <div style={{ fontSize: '.68rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Desglose bugs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '.5rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Nuevos',      val: bt.nuevos,       color: '#1d4ed8' },
          { label: 'En Progreso', val: bt.en_progreso,  color: '#7c3aed' },
          { label: 'Rechazados',  val: bt.rechazados,   color: '#b91c1c' },
          { label: 'TC Pass',     val: tc.pasados,      color: '#15803d' },
          { label: 'TC Failed',   val: tc.fallidos,     color: '#b91c1c' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.07)', borderRadius: '6px', padding: '.6rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: k.color, fontFamily: 'var(--mono)' }}>{k.val}</div>
            <div style={{ fontSize: '.62rem', color: 'var(--ink-light)' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Equipos info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.65rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#faf5ff', border: '1px solid #d8b4fe', borderRadius: '6px', padding: '.8rem 1rem', display: 'flex', gap: '.65rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1.4rem' }}>👥</span>
          <div><div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#7c3aed', fontFamily: 'var(--mono)' }}>{equipoStats.total_equipos}</div><div style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>Equipos activos</div></div>
        </div>
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '.8rem 1rem', display: 'flex', gap: '.65rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1.4rem' }}>🧑‍💻</span>
          <div><div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0369a1', fontFamily: 'var(--mono)' }}>{equipoStats.total_miembros}</div><div style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>Miembros en equipos</div></div>
        </div>
      </div>

      {/* Gráficas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Bugs por usuario */}
        <div style={{ background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.08)', borderRadius: '8px', padding: '1.1rem' }}>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.95rem', marginBottom: '1rem' }}>🐛 Bugs creados por usuario</div>
          {bugsPorUsuario.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--ink-light)', fontSize: '.8rem', padding: '1.5rem 0' }}>Sin datos</div>
          ) : bugsPorUsuario.map((u, i) => (
            <div key={i} style={{ marginBottom: '.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
                <span style={{ fontSize: '.78rem', fontWeight: i === 0 ? 700 : 400 }}>{u.nombre}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', color: '#1d4ed8', fontWeight: 700 }}>{u.total}</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(0,0,0,.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(u.total / maxBugsUser) * 100}%`, background: i === 0 ? '#1d4ed8' : '#93c5fd', borderRadius: '3px', transition: 'width .4s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Bugs resueltos por DEV */}
        <div style={{ background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.08)', borderRadius: '8px', padding: '1.1rem' }}>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.95rem', marginBottom: '1rem' }}>💻 Fixes enviados por Developer</div>
          {resueltoPorDev.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--ink-light)', fontSize: '.8rem', padding: '1.5rem 0' }}>Sin datos aún. Los devs deben usar "Enviar a Pending Testing".</div>
          ) : resueltoPorDev.map((d, i) => (
            <div key={i} style={{ marginBottom: '.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
                <span style={{ fontSize: '.78rem', fontWeight: i === 0 ? 700 : 400 }}>{d.nombre}</span>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: 'var(--ink-light)' }}>{d.total_enviados} env.</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', color: '#15803d', fontWeight: 700 }}>{d.resueltos} ✓</span>
                </div>
              </div>
              <div style={{ height: '6px', background: 'rgba(0,0,0,.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${((d.resueltos || 0) / maxBugsDev) * 100}%`, background: i === 0 ? '#15803d' : '#86efac', borderRadius: '3px', transition: 'width .4s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TEST CASES TAB (QA + MANAGER)
   ══════════════════════════════════════════════════════════════ */
function TestCasesTab() {
  const [tcs, setTcs]       = useState([]);
  const [loading, setLoad]  = useState(true);
  const [showForm, setForm] = useState(false);
  const [editTC, setEdit]   = useState(null);
  const [execTC, setExec]   = useState(null);
  const [saving, setSave]   = useState(false);
  const [fEst, setFEst]     = useState('');

  const load      = () => { setLoad(true); api.get('/auth/qa/test-cases').then(r => setTcs(r.data)).catch(() => {}).finally(() => setLoad(false)); };
  const closeForm = () => { setEdit(null); setForm(false); };
  useEffect(load, []);

  const handleSave = async (form) => {
    setSave(true);
    try { const p = { ...form, pasos: form.pasos.filter(x => x.trim()) }; editTC ? await api.put(`/auth/qa/test-cases/${editTC.id}`, p) : await api.post('/auth/qa/test-cases', p); closeForm(); load(); }
    catch (e) { alert(e.response?.data?.error || 'Error'); } finally { setSave(false); }
  };

  const handleExecute = async ({ estado, resultado_actual }) => {
    setSave(true);
    try { await api.post(`/auth/qa/test-cases/${execTC.id}/ejecutar`, { estado, resultado_actual }); setExec(null); load(); }
    catch (e) { alert(e.response?.data?.error || 'Error'); } finally { setSave(false); }
  };

  const handleDelete = async (id) => { if (!confirm('¿Eliminar?')) return; await api.delete(`/auth/qa/test-cases/${id}`).catch(() => {}); load(); };
  const filtered = tcs.filter(tc => !fEst || tc.estado === fEst);

  return (
    <div>
      <StatsRow items={[
        { label: 'Total',         val: tcs.length,                                          color: '#1d4ed8' },
        { label: 'No Ejecutados', val: tcs.filter(t => t.estado === 'no_ejecutado').length, color: '#475569' },
        { label: 'Pass',          val: tcs.filter(t => t.estado === 'pasado').length,       color: '#15803d' },
        { label: 'Failed',        val: tcs.filter(t => t.estado === 'fallido').length,      color: '#b91c1c' },
        { label: 'N/A',           val: tcs.filter(t => t.estado === 'na').length,           color: '#64748b' },
      ]} />
      <div style={{ display: 'flex', gap: '.65rem', alignItems: 'center', marginBottom: '.9rem', flexWrap: 'wrap' }}>
        <button onClick={() => { setEdit(null); setForm(true); }} style={{ padding: '.42rem .9rem', background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '.81rem', fontWeight: 600 }}>+ Nuevo Test Case</button>
        <select value={fEst} onChange={e => setFEst(e.target.value)} style={{ padding: '.38rem .55rem', border: '1px solid rgba(0,0,0,.14)', borderRadius: '4px', fontSize: '.77rem', background: 'var(--paper-dark)', color: 'var(--ink)' }}>
          <option value="">Todos</option>{Object.entries(ESTADO_TC).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ fontSize: '.74rem', color: 'var(--ink-light)', marginLeft: 'auto' }}>{filtered.length} test cases</span>
      </div>
      {loading ? <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)' }}>Cargando…</div>
        : filtered.length === 0 ? <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)', border: '2px dashed rgba(0,0,0,.1)', borderRadius: '8px' }}>{tcs.length === 0 ? 'No hay test cases aún.' : 'Sin resultados.'}</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
            {filtered.map(tc => {
              const pasos = typeof tc.pasos === 'string' ? JSON.parse(tc.pasos) : tc.pasos;
              return (
                <div key={tc.id} style={{ background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.08)', borderRadius: '6px', padding: '.9rem 1rem', display: 'flex', gap: '.9rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '.45rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.35rem' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '.66rem', color: 'var(--ink-light)' }}>TC-{String(tc.id).padStart(3, '0')}</span>
                      <span style={{ fontWeight: 600, fontSize: '.87rem' }}>{tc.titulo}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
                      <Badge cfg={ESTADO_TC[tc.estado]} small /><Tag>Prioridad: {tc.prioridad}</Tag>{tc.categoria && <Tag>{tc.categoria}</Tag>}<Tag>{pasos.length} pasos</Tag>
                    </div>
                    <div style={{ fontSize: '.66rem', color: 'var(--ink-light)' }}>{tc.creado_por_nombre} · {new Date(tc.created_at).toLocaleDateString('es-BO')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '.35rem', flexShrink: 0 }}>
                    <Btn variant="success" onClick={() => setExec(tc)}>Ejecutar</Btn>
                    <Btn onClick={() => { setEdit(tc); setForm(true); }}>Editar</Btn>
                    <Btn variant="danger" onClick={() => handleDelete(tc.id)}>Eliminar</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      {showForm && <Modal title={editTC ? 'Editar Test Case' : 'Nuevo Test Case'} onClose={closeForm} wide><TestCaseForm initial={editTC ? { ...editTC, pasos: typeof editTC.pasos === 'string' ? JSON.parse(editTC.pasos) : editTC.pasos } : EMPTY_TC} onSave={handleSave} onCancel={closeForm} saving={saving} /></Modal>}
      {execTC && <ExecModal tc={execTC} onClose={() => setExec(null)} onExecute={handleExecute} saving={saving} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TEST CASE FORM
   ══════════════════════════════════════════════════════════════ */
function TestCaseForm({ initial, onSave, onCancel, saving }) {
  const [f, setF] = useState({ ...EMPTY_TC, ...initial });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setPaso = (i, v) => setF(p => { const ps = [...p.pasos]; ps[i] = v; return { ...p, pasos: ps }; });
  const addPaso = () => setF(p => ({ ...p, pasos: [...p.pasos, ''] }));
  const delPaso = (i) => setF(p => ({ ...p, pasos: p.pasos.filter((_, idx) => idx !== i) }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
      <Field label="Título *"><input style={inputS} value={f.titulo} onChange={e => s('titulo', e.target.value)} placeholder="Ej: Verificar login con credenciales válidas" /></Field>
      <Field label="Descripción"><textarea style={taS} value={f.descripcion} onChange={e => s('descripcion', e.target.value)} placeholder="Objetivo del test case…" /></Field>
      <Field label="Precondiciones"><textarea style={{ ...taS, minHeight: '55px' }} value={f.precondiciones} onChange={e => s('precondiciones', e.target.value)} placeholder="El usuario debe estar registrado en el sistema" /></Field>
      <div>
        <label style={labelS}>Pasos de ejecución *</label>
        {f.pasos.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: '.45rem', marginBottom: '.38rem', alignItems: 'center' }}>
            <span style={{ fontSize: '.7rem', color: 'var(--ink-light)', minWidth: '22px', textAlign: 'right', fontFamily: 'var(--mono)' }}>{i + 1}.</span>
            <input style={{ ...inputS, flex: 1 }} value={p} onChange={e => setPaso(i, e.target.value)} placeholder={`Paso ${i + 1}…`} />
            {f.pasos.length > 1 && <button onClick={() => delPaso(i)} style={{ all: 'unset', cursor: 'pointer', color: '#ef4444', fontSize: '1.1rem' }}>×</button>}
          </div>
        ))}
        <button onClick={addPaso} style={{ fontSize: '.74rem', color: 'var(--ink-light)', background: 'none', border: '1px dashed rgba(0,0,0,.2)', borderRadius: '4px', padding: '.28rem .7rem', cursor: 'pointer' }}>+ Agregar paso</button>
      </div>
      <Field label="Resultado esperado *"><textarea style={taS} value={f.resultado_esperado} onChange={e => s('resultado_esperado', e.target.value)} placeholder="¿Qué debe ocurrir al ejecutar los pasos?" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>
        <Field label="Prioridad"><select style={inputS} value={f.prioridad} onChange={e => s('prioridad', e.target.value)}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></Field>
        <Field label="Categoría"><input style={inputS} value={f.categoria} onChange={e => s('categoria', e.target.value)} placeholder="Ej: Autenticación, Pagos…" /></Field>
      </div>
      <div style={{ display: 'flex', gap: '.65rem', justifyContent: 'flex-end', paddingTop: '.75rem', borderTop: '1px solid rgba(0,0,0,.07)' }}>
        <button onClick={onCancel} style={{ padding: '.45rem 1.1rem', border: '1px solid rgba(0,0,0,.14)', borderRadius: '4px', background: 'transparent', cursor: 'pointer', fontSize: '.82rem' }}>Cancelar</button>
        <button onClick={() => onSave(f)} disabled={!f.titulo || !f.resultado_esperado || saving} style={{ padding: '.45rem 1.1rem', border: 'none', borderRadius: '4px', background: 'var(--ink)', color: '#fff', cursor: 'pointer', fontSize: '.82rem', opacity: (!f.titulo || !f.resultado_esperado || saving) ? .55 : 1 }}>{saving ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   EXECUTION MODAL
   ══════════════════════════════════════════════════════════════ */
function ExecModal({ tc, onClose, onExecute, saving }) {
  const [estado, setEstado]    = useState('pasado');
  const [resultado, setResult] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010, padding: '1rem' }}>
      <div style={{ background: 'var(--paper)', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,.22)' }}>
        <h3 style={{ fontFamily: 'var(--serif)', margin: '0 0 .3rem' }}>Ejecutar Test Case</h3>
        <p style={{ fontSize: '.8rem', color: 'var(--ink-light)', margin: '0 0 1.2rem' }}>{tc.titulo}</p>
        <div style={{ marginBottom: '1rem' }}>
          <div style={labelS}>Resultado *</div>
          <div style={{ display: 'flex', gap: '.65rem' }}>
            {[{ val: 'pasado', label: 'Pass', color: '#15803d' }, { val: 'fallido', label: 'Failed', color: '#b91c1c' }, { val: 'bloqueado', label: 'Block', color: '#a16207' }, { val: 'na', label: 'N/A', color: '#64748b' }].map(o => (
              <button key={o.val} onClick={() => setEstado(o.val)} style={{ flex: 1, padding: '.5rem', cursor: 'pointer', border: `2px solid ${estado === o.val ? o.color : 'rgba(0,0,0,.12)'}`, borderRadius: '6px', fontSize: '.82rem', fontWeight: 600, background: estado === o.val ? `${o.color}18` : 'transparent', color: estado === o.val ? o.color : 'var(--ink-light)' }}>{o.label}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: '1.2rem' }}>
          <div style={labelS}>Notas</div>
          <textarea style={taS} value={resultado} onChange={e => setResult(e.target.value)} placeholder="Describe lo que ocurrió…" />
        </div>
        <div style={{ display: 'flex', gap: '.65rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '.45rem 1.1rem', border: '1px solid rgba(0,0,0,.14)', borderRadius: '4px', background: 'transparent', cursor: 'pointer', fontSize: '.82rem' }}>Cancelar</button>
          <button onClick={() => onExecute({ estado, resultado_actual: resultado })} disabled={saving} style={{ padding: '.45rem 1.1rem', border: 'none', borderRadius: '4px', background: 'var(--ink)', color: '#fff', cursor: 'pointer', fontSize: '.82rem', opacity: saving ? .55 : 1 }}>{saving ? 'Guardando…' : 'Registrar'}</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROLE SELECTION
   ══════════════════════════════════════════════════════════════ */
function RoleSelection({ onSelect }) {
  const ROLES = [
    { rol: 'QA', emoji: '🔍', titulo: 'QA Tester', desc: 'Reporta bugs, crea y ejecuta test cases. Revisa bugs en Pending Testing.', acciones: ['Reportar bugs', 'Crear & ejecutar test cases', 'Revisar Pending Testing', 'Marcar bugs como resueltos'] },
    { rol: 'DEV', emoji: '💻', titulo: 'Developer', desc: 'Revisa bugs, actualiza estados y envía a Pending Testing para verificación.', acciones: ['Ver todos los bugs', 'Cambiar estado', 'Agregar comentarios', 'Enviar a Pending Testing'] },
    { rol: 'MANAGER', emoji: '📊', titulo: 'QA Manager', desc: 'Gestión completa: equipos, asignación de reviewers y dashboard de métricas.', acciones: ['Todo lo de QA Tester', 'Crear & gestionar equipos', 'Asignar bugs a reviewers', 'Dashboard de métricas'] },
  ];

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2.6rem', marginBottom: '.65rem' }}>🧪</div>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', margin: '0 0 .35rem' }}>QA Lab</h2>
        <p style={{ fontSize: '.84rem', color: 'var(--ink-light)', margin: 0 }}>Selecciona tu rol para comenzar la sesión</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {ROLES.map(r => (
          <button key={r.rol} onClick={() => onSelect(r.rol)} style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '.7rem', background: 'var(--paper-dark)', border: `2px solid ${r.rol === 'MANAGER' ? '#d8b4fe' : 'rgba(0,0,0,.08)'}`, borderRadius: '8px', padding: '1.4rem', transition: 'all .15s', textAlign: 'left' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = r.rol === 'MANAGER' ? '#a855f7' : 'var(--ink)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = r.rol === 'MANAGER' ? '#d8b4fe' : 'rgba(0,0,0,.08)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
            <div style={{ fontSize: '1.9rem' }}>{r.emoji}</div>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1.05rem' }}>{r.titulo}</div>
              <div style={{ fontSize: '.74rem', color: 'var(--ink-light)', marginTop: '.28rem', lineHeight: 1.55 }}>{r.desc}</div>
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 1rem', fontSize: '.72rem', color: 'var(--ink-light)', lineHeight: 1.95 }}>{r.acciones.map(a => <li key={a}>{a}</li>)}</ul>
            <div style={{ background: r.rol === 'MANAGER' ? '#7c3aed' : 'var(--ink)', color: '#fff', fontSize: '.71rem', padding: '.28rem .7rem', borderRadius: '4px', alignSelf: 'flex-start', fontFamily: 'var(--mono)' }}>
              Entrar como {r.titulo} →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════════════ */
export default function QASimulator() {
  const { user } = useAuth();
  const [rol, setRol] = useState(null);
  const [tab, setTab] = useState('bugs');

  if (!rol) return <RoleSelection onSelect={(r) => { setRol(r); setTab('bugs'); }} />;

  const TABS = {
    QA:      [{ key: 'bugs', label: 'Bug Reporter', icon: '🐛' }, { key: 'testcases', label: 'Test Cases', icon: '✅' }, { key: 'pending', label: 'Pending Testing', icon: '⏳' }],
    DEV:     [{ key: 'bugs', label: 'Bug Reporter', icon: '🐛' }, { key: 'pending', label: 'Pending Testing', icon: '⏳' }],
    MANAGER: [{ key: 'bugs', label: 'Bug Reporter', icon: '🐛' }, { key: 'testcases', label: 'Test Cases', icon: '✅' }, { key: 'pending', label: 'Pending Testing', icon: '⏳' }, { key: 'equipos', label: 'Equipos', icon: '👥' }, { key: 'dashboard', label: 'Dashboard', icon: '📊' }],
  };

  const SESSION_COLOR = { QA: '#15803d', DEV: '#0369a1', MANAGER: '#7c3aed' };
  const tabs = TABS[rol] || TABS.QA;

  return (
    <div>
      {/* Session bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', marginBottom: '1.4rem', padding: '.65rem .95rem', background: 'var(--paper-dark)', border: `1px solid ${SESSION_COLOR[rol]}22`, borderLeft: `3px solid ${SESSION_COLOR[rol]}`, borderRadius: '6px' }}>
        <span style={{ fontSize: '1.1rem' }}>{rol === 'QA' ? '🔍' : rol === 'DEV' ? '💻' : '📊'}</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: '.88rem', color: SESSION_COLOR[rol] }}>{rol === 'QA' ? 'QA Tester' : rol === 'DEV' ? 'Developer' : 'QA Manager'}</span>
          <span style={{ fontSize: '.76rem', color: 'var(--ink-light)', marginLeft: '.45rem' }}>· {user?.nombre} {user?.apellido}</span>
        </div>
        <button onClick={() => setRol(null)} style={{ all: 'unset', cursor: 'pointer', fontSize: '.72rem', color: 'var(--ink-light)', padding: '.22rem .55rem', border: '1px solid rgba(0,0,0,.12)', borderRadius: '4px' }}>
          Cambiar rol
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid rgba(0,0,0,.07)', marginBottom: '1.4rem' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ all: 'unset', cursor: 'pointer', padding: '.55rem 1rem', fontSize: '.83rem', fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? SESSION_COLOR[rol] : 'var(--ink-light)', borderBottom: `2px solid ${tab === t.key ? SESSION_COLOR[rol] : 'transparent'}`, marginBottom: '-2px', transition: 'all .15s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'bugs'      && <BugsTab rol={rol} />}
      {tab === 'testcases' && <TestCasesTab />}
      {tab === 'pending'   && <PendingTestingTab rol={rol} />}
      {tab === 'equipos'   && <EquiposTab />}
      {tab === 'dashboard' && <DashboardTab />}
    </div>
  );
}
