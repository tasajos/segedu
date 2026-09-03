import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './UnidadHtml.css';

const formatSize = (bytes) => {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
};

const formatDate = (value) => new Date(value).toLocaleDateString('es-BO', {
  day: '2-digit', month: 'short', year: 'numeric'
});

export default function UnidadHtml() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [unidad, setUnidad] = useState(null);
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const [visor, setVisor] = useState(null);
  const [visorLoadingId, setVisorLoadingId] = useState(null);

  const canManage = user?.rol === 'docente';

  const load = async () => {
    try {
      const [unidadesRes, guiasRes] = await Promise.all([
        api.get('/auth/unidades'),
        api.get(`/auth/unidades/${id}/guias`)
      ]);
      setUnidad(unidadesRes.data.find(u => String(u.id) === String(id)) || null);
      setGuias(guiasRes.data);
    } catch (err) {
      setMensaje({ type: 'error', text: err.response?.data?.error || 'No se pudieron cargar las guías' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => () => { if (visor?.url) URL.revokeObjectURL(visor.url); }, [visor]);

  const resetForm = () => {
    setArchivo(null);
    setTitulo('');
    setDescripcion('');
    if (fileInput.current) fileInput.current.value = '';
  };

  const validarArchivo = (file) => {
    if (!file || !/\.html?$/i.test(file.name)) {
      setMensaje({ type: 'error', text: 'Selecciona un archivo .html o .htm válido' });
      return false;
    }
    return true;
  };

  const publicar = async (event) => {
    event.preventDefault();
    if (!validarArchivo(archivo)) return;
    const form = new FormData();
    form.append('archivo', archivo);
    if (titulo.trim()) form.append('titulo', titulo.trim());
    if (descripcion.trim()) form.append('descripcion', descripcion.trim());
    try {
      setSaving(true);
      setMensaje(null);
      const { data } = await api.post(`/docente/unidades/${id}/guias`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMensaje({ type: 'ok', text: `“${data.titulo}” se publicó correctamente.` });
      setShowUpload(false);
      resetForm();
      await load();
    } catch (err) {
      setMensaje({ type: 'error', text: err.response?.data?.error || 'No se pudo publicar el archivo' });
    } finally {
      setSaving(false);
    }
  };

  const reemplazar = async (event, guia) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!validarArchivo(file)) return;
    const form = new FormData();
    form.append('archivo', file);
    try {
      setSaving(true);
      const { data } = await api.put(`/docente/unidades/guias/${guia.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMensaje({ type: 'ok', text: `“${data.titulo}” fue reemplazada correctamente.` });
      await load();
    } catch (err) {
      setMensaje({ type: 'error', text: err.response?.data?.error || 'No se pudo reemplazar la guía' });
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (guia) => {
    if (!window.confirm(`¿Eliminar definitivamente “${guia.titulo}”?`)) return;
    try {
      setSaving(true);
      await api.delete(`/docente/unidades/guias/${guia.id}`);
      if (visor?.id === guia.id) setVisor(null);
      setMensaje({ type: 'ok', text: 'La guía fue eliminada.' });
      await load();
    } catch (err) {
      setMensaje({ type: 'error', text: err.response?.data?.error || 'No se pudo eliminar la guía' });
    } finally {
      setSaving(false);
    }
  };

  const abrir = async (guia) => {
    try {
      setVisorLoadingId(guia.id);
      setMensaje(null);
      const { data } = await api.get(`/auth/unidades/${id}/guias/${guia.id}/ver`, {
        responseType: 'blob'
      });
      if (visor?.url) URL.revokeObjectURL(visor.url);
      const url = URL.createObjectURL(new Blob([data], { type: 'text/html;charset=utf-8' }));
      setVisor({ id: guia.id, titulo: guia.titulo, url });
    } catch (err) {
      setMensaje({ type: 'error', text: err.response?.data?.error || 'No se pudo abrir la guía' });
    } finally {
      setVisorLoadingId(null);
    }
  };

  const nombreUnidad = unidad?.nombre || 'Unidad HTML';

  if (visor) {
    return (
      <div className="html-guide-viewer">
        <div className="html-guide-viewer__bar">
          <button className="btn btn-secondary" onClick={() => setVisor(null)}>← Volver a las guías</button>
          <div><span>{nombreUnidad}</span><strong>{visor.titulo}</strong></div>
          <a className="btn btn-primary" href={visor.url} target="_blank" rel="noopener noreferrer">Abrir en otra pestaña ↗</a>
        </div>
        <iframe
          title={visor.titulo}
          src={visor.url}
          sandbox="allow-scripts allow-forms allow-popups allow-downloads allow-modals"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className="programming-unit">
      <header className="programming-unit__hero">
        <div className="programming-unit__code" aria-hidden="true">{'</>'}</div>
        <div>
          <button className="programming-unit__back" onClick={() => navigate(-1)}>← Unidades de instrucción</button>
          <span className="programming-unit__eyebrow">Repositorio de aprendizaje</span>
          <h1>{nombreUnidad}</h1>
          <p>{unidad?.descripcion || 'Guías prácticas e interactivas en formato HTML.'}</p>
        </div>
        <div className="programming-unit__stats">
          <strong>{guias.length}</strong>
          <span>{guias.length === 1 ? 'guía disponible' : 'guías disponibles'}</span>
        </div>
      </header>

      {canManage && (
        <section className="html-upload-section">
          <div className="html-upload-section__intro">
            <div className="html-upload-icon">HTML</div>
            <div>
              <h2>Administrar contenido</h2>
              <p>Publica archivos HTML autocontenidos. El título se reconoce automáticamente.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowUpload((value) => !value)}>
              {showUpload ? 'Cancelar' : '+ Añadir guía HTML'}
            </button>
          </div>

          {showUpload && (
            <form className="html-upload-form" onSubmit={publicar}>
              <label className={`html-dropzone${archivo ? ' has-file' : ''}`}>
                <input ref={fileInput} type="file" accept=".html,.htm,text/html" onChange={(event) => setArchivo(event.target.files?.[0] || null)} />
                <span className="html-dropzone__symbol">&lt;/&gt;</span>
                <strong>{archivo ? archivo.name : 'Selecciona un archivo HTML'}</strong>
                <small>{archivo ? formatSize(archivo.size) : 'Máximo 25 MB · .html o .htm'}</small>
              </label>
              <div className="html-upload-fields">
                <label>Título opcional<input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Se detectará desde el HTML" /></label>
                <label>Descripción opcional<textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows="3" placeholder="¿Qué aprenderá el estudiante?" /></label>
                <button className="btn btn-primary" type="submit" disabled={saving || !archivo}>{saving ? 'Publicando...' : 'Publicar guía'}</button>
              </div>
            </form>
          )}
        </section>
      )}

      {mensaje && <div className={`html-unit-message ${mensaje.type}`} role="status">{mensaje.text}</div>}

      <div className="html-guides-heading">
        <div><span>Material disponible</span><h2>Guías de estudio</h2></div>
        <span className="html-guides-count">{guias.length} publicadas</span>
      </div>

      {loading ? (
        <div className="html-guides-empty">Cargando guías...</div>
      ) : guias.length === 0 ? (
        <div className="html-guides-empty">
          <span>&lt;/&gt;</span>
          <h3>Aún no hay guías publicadas</h3>
          <p>{canManage ? 'Añade el primer archivo HTML para comenzar.' : 'El docente publicará aquí el material de esta unidad.'}</p>
        </div>
      ) : (
        <div className="html-guides-grid">
          {guias.map((guia, index) => (
            <article className="html-guide-card" key={guia.id}>
              <div className="html-guide-card__top">
                <span className="html-guide-card__number">{String(index + 1).padStart(2, '0')}</span>
                <span className="html-guide-card__type">HTML interactivo</span>
              </div>
              <div className="html-guide-card__body">
                <h3>{guia.titulo}</h3>
                <p>{guia.descripcion || 'Guía práctica interactiva.'}</p>
              </div>
              <div className="html-guide-card__meta"><span>{formatSize(guia.tamano)}</span><span>·</span><span>{formatDate(guia.updated_at)}</span></div>
              <div className="html-guide-card__author">Publicado por {guia.docente_nombre}</div>
              <div className="html-guide-card__actions">
                <button className="btn btn-primary" onClick={() => abrir(guia)} disabled={visorLoadingId !== null}>
                  {visorLoadingId === guia.id ? 'Abriendo...' : 'Abrir guía →'}
                </button>
                {Boolean(guia.puede_editar) && (
                  <>
                    <label className="btn btn-secondary html-replace-button">
                      Reemplazar
                      <input type="file" accept=".html,.htm,text/html" onChange={(event) => reemplazar(event, guia)} disabled={saving} />
                    </label>
                    <button className="btn btn-danger" onClick={() => eliminar(guia)} disabled={saving}>Eliminar</button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
