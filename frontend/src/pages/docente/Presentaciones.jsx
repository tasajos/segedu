import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import PresentationViewer from '../../components/PresentationViewer';

const EMPTY_FORM = {
  titulo: '',
  descripcion: '',
  enlace_url: ''
};

export default function PresentacionesDocente() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [visor, setVisor] = useState(null);
  const fileRef = useRef();

  function load() {
    setLoading(true);
    api.get('/auth/presentaciones')
      .then((response) => setLista(response.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const hasLink = Boolean(form.enlace_url.trim());

    if (!form.titulo.trim()) {
      setError('El titulo es obligatorio');
      return;
    }

    if (!file && !hasLink) {
      setError('Selecciona un archivo PDF/PPTX o pega un enlace publico de Drive');
      return;
    }

    if (file && hasLink) {
      setError('Usa solo una opcion: archivo o enlace');
      return;
    }

    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'pptx'].includes(ext)) {
        setError('Solo se permiten archivos PDF o PPTX');
        return;
      }
    }

    setSaving(true);
    setError('');

    const fd = new FormData();
    fd.append('titulo', form.titulo.trim());
    fd.append('descripcion', form.descripcion);
    fd.append('enlace_url', form.enlace_url.trim());
    if (file) fd.append('archivo', file);

    try {
      await api.post('/docente/presentaciones', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowForm(false);
      setForm(EMPTY_FORM);
      setFile(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    if (!confirm(`Eliminar "${p.titulo}"?`)) return;
    await api.delete(`/docente/presentaciones/${p.id}`);
    load();
  }

  const TIPO_ICON = { pdf: 'PDF', pptx: 'PPT', link: 'URL' };
  const TIPO_LABEL = { pdf: 'Archivo PDF', pptx: 'PowerPoint', link: 'Enlace externo' };

  return (
    <div className="presentations-page">
      <PageHeader
        num="09"
        eyebrow="Material de clase"
        title={<>Presentaciones <span className="display-italic">digitales</span></>}
        lead="Comparta presentaciones como archivo PDF/PPTX o mediante un enlace publico de Google Drive o Google Slides."
        actions={
          <button className="btn btn-primary btn-lg" onClick={() => { setShowForm(true); setError(''); }}>
            + Subir presentacion
          </button>
        }
      />

      {showForm && (
        <section className="presentation-form-card fade-up">
          <div className="presentation-form-head">
            <div>
              <span className="eyebrow">Nueva publicacion</span>
              <h2>Nueva presentacion</h2>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="presentation-form-grid">
              <div className="form-field">
                <label>Titulo *</label>
                <input
                  className="form-input"
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  placeholder="Ej. Circuitos logicos"
                />
              </div>

              <div className="form-field">
                <label>Descripcion</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Breve contexto para los estudiantes"
                />
              </div>
            </div>

            <div className="presentation-source-grid">
              <div className={`source-panel ${file ? 'is-selected' : ''}`}>
                <div className="source-panel-title">
                  <span className="source-icon">PDF</span>
                  <div>
                    <strong>Subir archivo</strong>
                    <p>Use PDF o PPTX desde su equipo.</p>
                  </div>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => fileRef.current.click()}>
                  Seleccionar archivo
                </button>
                <span className="source-value">{file ? file.name : 'Sin archivo seleccionado'}</span>
              </div>

              <div className={`source-panel ${form.enlace_url.trim() ? 'is-selected' : ''}`}>
                <div className="source-panel-title">
                  <span className="source-icon">URL</span>
                  <div>
                    <strong>Usar enlace</strong>
                    <p>Drive o Google Slides con acceso publico.</p>
                  </div>
                </div>
                <input
                  className="form-input"
                  value={form.enlace_url}
                  onChange={(e) => setForm((f) => ({ ...f, enlace_url: e.target.value }))}
                  placeholder="https://docs.google.com/presentation/d/..."
                />
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.pptx"
                style={{ display: 'none' }}
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </div>

            <p className="presentation-hint">
              Use solo una opcion: archivo o enlace. Los enlaces deben estar compartidos como publicos o visibles para cualquiera con el enlace.
            </p>

            {error && <div className="presentation-error">{error}</div>}

            <div className="presentation-form-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar presentacion'}</button>
              <button className="btn btn-ghost" type="button" onClick={() => { setForm(EMPTY_FORM); setFile(null); setError(''); }}>
                Limpiar
              </button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="presentation-empty">Cargando...</div>
      ) : lista.length === 0 ? (
        <div className="presentation-empty">
          No has subido presentaciones aun.
        </div>
      ) : (
        <section className="presentation-list">
          <div className="section-head">
            <h2>Biblioteca de presentaciones</h2>
            <span className="count">{lista.length} materiales</span>
          </div>
          {lista.map((p) => (
            <article key={p.id} className="presentation-row">
              <span className="presentation-badge">{TIPO_ICON[p.tipo_archivo] || 'PPT'}</span>
              <div className="presentation-row-body">
                <div className="presentation-row-title">{p.titulo}</div>
                {p.descripcion && <p>{p.descripcion}</p>}
                <div className="presentation-meta">
                  {TIPO_LABEL[p.tipo_archivo] || 'Presentacion'} - {p.archivo_nombre || 'Enlace externo'} - {new Date(p.created_at).toLocaleDateString('es-ES')}
                </div>
              </div>
              <div className="presentation-row-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setVisor(p)}>Ver</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>Eliminar</button>
              </div>
            </article>
          ))}
        </section>
      )}

      <Modal open={!!visor} onClose={() => setVisor(null)} title={visor?.titulo || 'Presentacion'} maxWidth="1120px">
        {visor && <PresentationViewer presentation={visor} />}
      </Modal>

      <style>{`
        .presentations-page {
          max-width: 1180px;
          margin: 0 auto;
        }

        .presentation-form-card {
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          padding: 1.4rem;
          margin-bottom: 1.75rem;
        }

        .presentation-form-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding-bottom: 1rem;
          margin-bottom: 1.2rem;
          border-bottom: 1px solid var(--border);
        }

        .presentation-form-head h2 {
          font-size: 1.2rem;
          margin-top: .25rem;
        }

        .presentation-form-grid {
          display: grid;
          grid-template-columns: minmax(220px, .9fr) minmax(280px, 1.1fr);
          gap: 1rem;
        }

        .presentation-source-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          margin-top: .15rem;
        }

        .source-panel {
          display: flex;
          flex-direction: column;
          gap: .85rem;
          min-height: 164px;
          padding: 1rem;
          background: var(--gray-50);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm);
          transition: border-color .15s, box-shadow .15s, background .15s;
        }

        .source-panel.is-selected {
          background: var(--blue-50);
          border-color: var(--blue-400);
          box-shadow: 0 0 0 3px rgba(37,99,235,.08);
        }

        .source-panel-title {
          display: flex;
          align-items: flex-start;
          gap: .8rem;
        }

        .source-panel-title strong {
          display: block;
          color: var(--text);
          font-weight: 700;
        }

        .source-panel-title p,
        .source-value,
        .presentation-hint,
        .presentation-row-body p {
          color: var(--text-muted);
          font-size: .84rem;
        }

        .source-icon,
        .presentation-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          height: 36px;
          min-width: 44px;
          padding: 0 .55rem;
          border-radius: 8px;
          background: var(--blue-50);
          color: var(--blue-700);
          border: 1px solid var(--blue-100);
          font-family: var(--font-mono);
          font-size: .72rem;
          font-weight: 800;
        }

        .source-value {
          min-height: 1.3rem;
          word-break: break-word;
        }

        .presentation-hint {
          margin-top: .9rem;
          padding: .75rem .9rem;
          background: var(--gray-50);
          border-left: 3px solid var(--blue-500);
          border-radius: 4px;
        }

        .presentation-error {
          margin-top: .9rem;
          padding: .75rem .9rem;
          color: var(--danger);
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          border-radius: var(--radius-sm);
          font-size: .85rem;
          font-weight: 600;
        }

        .presentation-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: .75rem;
          margin-top: 1rem;
        }

        .presentation-empty {
          padding: 3rem;
          text-align: center;
          color: var(--text-muted);
          background: var(--surface);
          border: 1.5px dashed var(--border-strong);
          border-radius: var(--radius);
        }

        .presentation-list {
          display: flex;
          flex-direction: column;
          gap: .8rem;
        }

        .presentation-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.15rem;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          transition: transform .15s, box-shadow .15s, border-color .15s;
        }

        .presentation-row:hover {
          transform: translateY(-1px);
          border-color: var(--blue-100);
          box-shadow: var(--shadow);
        }

        .presentation-row-body {
          flex: 1;
          min-width: 220px;
        }

        .presentation-row-title {
          color: var(--text);
          font-weight: 800;
          font-size: .98rem;
        }

        .presentation-meta {
          margin-top: .25rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: .72rem;
        }

        .presentation-row-actions {
          display: flex;
          gap: .5rem;
        }

        @media (max-width: 780px) {
          .presentation-form-grid,
          .presentation-source-grid {
            grid-template-columns: 1fr;
          }

          .presentation-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .presentation-row-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
