import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';

// ── Visor inline PDF / PPTX (sin descarga) ────────────────────────────────────
function VisorPresentacion({ id, tipo }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [slides, setSlides]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]    = useState('');

  useEffect(() => {
    let cancelled = false;
    setPdfUrl(null); setSlides(null); setLoading(true); setError('');

    if (tipo === 'pdf') {
      api.get(`/auth/presentaciones/${id}/ver`, { responseType: 'blob' })
        .then(r => { if (!cancelled) setPdfUrl(URL.createObjectURL(r.data)); })
        .catch(() => { if (!cancelled) setError('No se pudo cargar el PDF.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    } else {
      api.get(`/auth/presentaciones/${id}/slides`)
        .then(r => { if (!cancelled) setSlides(r.data.slides); })
        .catch(() => { if (!cancelled) setError('No se pudieron extraer las diapositivas.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }

    return () => { cancelled = true; if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [id, tipo]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)' }}>Cargando presentación...</div>;
  if (error)   return <div style={{ padding: '2rem', color: 'var(--crimson)', fontSize: '.85rem' }}>{error}</div>;

  if (tipo === 'pdf' && pdfUrl) {
    return (
      <div style={{ position: 'relative', height: '74vh' }}>
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: '2px' }}
          title="Presentación PDF"
        />
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }} onContextMenu={e => e.preventDefault()} />
      </div>
    );
  }

  if (tipo === 'pptx' && slides) {
    if (!slides.length) return <p style={{ color: 'var(--ink-light)', padding: '1rem' }}>No se encontraron diapositivas.</p>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '74vh', overflowY: 'auto', padding: '.25rem' }}>
        {slides.map(s => (
          <div key={s.numero} style={{ background: 'var(--paper-dark)', borderRadius: '3px', padding: '1.25rem', borderLeft: '3px solid var(--gold)' }}>
            <div style={{ fontSize: '.68rem', fontFamily: 'var(--mono)', color: 'var(--ink-light)', marginBottom: '.5rem' }}>
              DIAPOSITIVA {s.numero}
            </div>
            {s.textos.length ? (
              s.textos.map((t, ti) => <p key={ti} style={{ margin: '0 0 .35rem', fontSize: '.88rem', lineHeight: 1.5 }}>{t}</p>)
            ) : (
              <p style={{ color: 'var(--ink-light)', fontSize: '.82rem', margin: 0 }}>— sin texto —</p>
            )}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ── Página Docente ────────────────────────────────────────────────────────────
export default function PresentacionesDocente() {
  const [lista, setLista]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState({ titulo: '', descripcion: '' });
  const [file, setFile]         = useState(null);
  const [visor, setVisor]       = useState(null); // {id, titulo, tipo}
  const fileRef = useRef();

  function load() {
    setLoading(true);
    api.get('/auth/presentaciones')
      .then(r => setLista(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.titulo.trim()) { setError('El título es obligatorio'); return; }
    if (!file) { setError('Selecciona un archivo PDF o PPTX'); return; }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'pptx'].includes(ext)) { setError('Solo se permiten archivos PDF o PPTX'); return; }

    setSaving(true); setError('');
    const fd = new FormData();
    fd.append('titulo', form.titulo.trim());
    fd.append('descripcion', form.descripcion);
    fd.append('archivo', file);
    try {
      await api.post('/docente/presentaciones', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowForm(false);
      setForm({ titulo: '', descripcion: '' });
      setFile(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!confirm(`¿Eliminar "${p.titulo}"?`)) return;
    await api.delete(`/docente/presentaciones/${p.id}`);
    load();
  }

  const TIPO_ICON = { pdf: '📄', pptx: '📊' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', marginBottom: '.2rem' }}>Presentaciones</h1>
          <p style={{ fontSize: '.85rem', color: 'var(--ink-light)' }}>
            Sube presentaciones en PDF o PowerPoint. Los estudiantes solo pueden visualizarlas, no descargarlas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setError(''); }}>+ Subir presentación</button>
      </div>

      {/* Upload form */}
      {showForm && (
        <div style={{ background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.1)', borderRadius: '3px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, marginBottom: '1rem' }}>Nueva presentación</div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '.85rem' }}>
            <div>
              <label className="label">Título *</label>
              <input className="input" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej. Introducción a Álgebra Booleana" />
            </div>
            <div>
              <label className="label">Descripción</label>
              <textarea className="input" rows={2} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción opcional..." style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label className="label">Archivo (PDF o PPTX) *</label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.pptx"
                style={{ display: 'none' }}
                onChange={e => setFile(e.target.files[0] || null)}
              />
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                <button type="button" className="btn" onClick={() => fileRef.current.click()}>
                  Seleccionar archivo
                </button>
                {file ? (
                  <span style={{ fontSize: '.82rem', color: 'var(--ink-light)' }}>
                    {file.name.split('.').pop().toUpperCase() === 'PDF' ? '📄' : '📊'} {file.name}
                  </span>
                ) : (
                  <span style={{ fontSize: '.8rem', color: 'var(--ink-light)' }}>Sin archivo seleccionado</span>
                )}
              </div>
            </div>
            {error && <div style={{ color: 'var(--crimson)', fontSize: '.83rem' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Subiendo...' : 'Subir presentación'}</button>
              <button className="btn" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ padding: '2rem', color: 'var(--ink-light)' }}>Cargando...</div>
      ) : lista.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)', background: 'var(--paper-dark)', borderRadius: '3px' }}>
          No has subido presentaciones aún.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {lista.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--paper-dark)', border: '1px solid rgba(0,0,0,.1)', borderRadius: '3px', padding: '1rem 1.25rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{TIPO_ICON[p.tipo_archivo]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 700 }}>{p.titulo}</div>
                {p.descripcion && <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', marginTop: '.15rem' }}>{p.descripcion}</div>}
                <div style={{ fontSize: '.72rem', color: 'var(--ink-light)', marginTop: '.3rem', fontFamily: 'var(--mono)' }}>
                  {p.tipo_archivo.toUpperCase()} · {p.archivo_nombre} · {new Date(p.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button className="btn btn-sm" onClick={() => setVisor({ id: p.id, titulo: p.titulo, tipo: p.tipo_archivo })}>
                  Ver
                </button>
                <button className="btn btn-sm" style={{ color: 'var(--crimson)' }} onClick={() => handleDelete(p)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Viewer modal */}
      <Modal open={!!visor} onClose={() => setVisor(null)} title={visor?.titulo || 'Presentación'} maxWidth="900px">
        {visor && <VisorPresentacion id={visor.id} tipo={visor.tipo} />}
      </Modal>
    </div>
  );
}
