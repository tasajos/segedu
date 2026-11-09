import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import VideoTutorialesGrid from '../../components/VideoTutorialesGrid';
import { MAX_VIDEO_BYTES, formatBytes, uploadToDrive } from '../../services/driveUpload';

const EMPTY_FORM = { materia_id: '', titulo: '', descripcion: '' };
const VIDEO_EXTENSIONS = '.mp4,.m4v,.webm,.mov,.mkv,.avi,.wmv,.mpg,.mpeg,.3gp';
const REGISTER_ATTEMPTS = 4;

// El archivo ya está en Drive: un corte de red aquí no debe perder la subida.
const registrarConReintentos = async (payload) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await api.post('/docente/videotutoriales', payload);
    } catch (err) {
      if (err.response || attempt === REGISTER_ATTEMPTS) throw err;
      await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }
  }
};

export default function DocenteVideotutoriales() {
  const { user } = useAuth();
  const soloLectura = user.rol === 'auditor';
  const [materias, setMaterias] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);
  const subiendo = progress !== null;

  const cargarVideos = useCallback(() => (
    api.get('/docente/videotutoriales')
      .then(({ data }) => setVideos(data))
      .catch((err) => setError(err.response?.data?.error || 'No se pudieron cargar los videotutoriales'))
  ), []);

  useEffect(() => {
    Promise.all([
      api.get('/docente/materias').then(({ data }) => setMaterias(data)),
      cargarVideos()
    ])
      .catch(() => setError('No se pudieron cargar las materias'))
      .finally(() => setLoading(false));
  }, [cargarVideos]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!subiendo) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [subiendo]);

  const seleccionarArchivo = (event) => {
    const selected = event.target.files[0] || null;
    setError('');
    if (selected && selected.size > MAX_VIDEO_BYTES) {
      setError(`El video pesa ${formatBytes(selected.size)} y el máximo es 3 GB.`);
      event.target.value = '';
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const subir = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);

    try {
      const { data: session } = await api.post('/docente/videotutoriales/iniciar-subida', {
        materia_id: Number(form.materia_id),
        nombre_archivo: file.name,
        tamano_bytes: file.size
      });
      const driveFile = await uploadToDrive(session.upload_url, file, {
        contentType: session.mime_type,
        onProgress: setProgress,
        signal: controller.signal
      });
      await registrarConReintentos({
        materia_id: Number(form.materia_id),
        titulo: form.titulo,
        descripcion: form.descripcion,
        drive_file_id: driveFile.id
      });

      setForm(EMPTY_FORM);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setNotice('Video publicado. Google Drive puede tardar unos minutos en dejarlo listo para reproducir.');
      await cargarVideos();
    } catch (err) {
      if (err.name === 'AbortError') setNotice('Subida cancelada.');
      else setError(err.response?.data?.error || err.message || 'No se pudo subir el video');
    } finally {
      abortRef.current = null;
      setProgress(null);
    }
  };

  const eliminar = async (video) => {
    if (!window.confirm(`¿Eliminar "${video.titulo}"? Dejará de estar disponible para los estudiantes y el archivo irá a la papelera de la unidad compartida.`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/docente/videotutoriales/${video.id}`);
      setVideos((current) => current.filter((item) => item.id !== video.id));
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar el video');
    }
  };

  const updateField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const porcentaje = Math.round((progress ?? 0) * 100);

  return (
    <div>
      <PageHeader eyebrow="Docente" title="Videotutoriales" lead="Publica videos de hasta 3 GB para los estudiantes inscritos en tus materias." />

      {!soloLectura && (
        <form className="card" onSubmit={subir} style={{ display: 'grid', gap: '1rem', marginBottom: '1.75rem' }}>
          <div className="grid-2">
            <div>
              <label className="form-label" htmlFor="video-materia">Materia *</label>
              <select id="video-materia" className="form-input" required disabled={subiendo} value={form.materia_id} onChange={updateField('materia_id')}>
                <option value="">Selecciona una materia</option>
                {materias.map((materia) => (
                  <option key={materia.id} value={materia.id}>
                    {materia.nombre} · {materia.codigo} · Grupo {materia.grupo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="video-titulo">Título *</label>
              <input id="video-titulo" className="form-input" required maxLength={250} disabled={subiendo} value={form.titulo} onChange={updateField('titulo')} />
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="video-descripcion">Descripción</label>
            <textarea id="video-descripcion" className="form-input" disabled={subiendo} value={form.descripcion} onChange={updateField('descripcion')} />
          </div>

          <div>
            <label className="form-label" htmlFor="video-archivo">Video * (máximo 3 GB)</label>
            <input id="video-archivo" ref={fileInputRef} className="form-input" type="file" required accept={VIDEO_EXTENSIONS} disabled={subiendo} onChange={seleccionarArchivo} />
            {file && <p className="text-muted" style={{ fontSize: '.78rem', marginTop: '.35rem', overflowWrap: 'anywhere' }}>{file.name} · {formatBytes(file.size)}</p>}
          </div>

          {subiendo && (
            <div>
              <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={porcentaje} style={{ height: 10, borderRadius: 99, background: 'var(--gray-100)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${porcentaje}%`, background: 'var(--blue-600)', transition: 'width .2s' }} />
              </div>
              <p className="text-muted" style={{ fontSize: '.78rem', marginTop: '.35rem' }}>
                {porcentaje < 100 ? `Subiendo ${porcentaje}%. No cierres ni cambies de página.` : 'Publicando el video…'}
              </p>
            </div>
          )}

          {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: '.85rem' }}>{error}</p>}
          {notice && <p role="status" style={{ color: 'var(--success)', fontSize: '.85rem' }}>{notice}</p>}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
            <button type="submit" className="btn btn-primary" disabled={subiendo}>Subir video</button>
            {subiendo && porcentaje < 100 && (
              <button type="button" className="btn btn-ghost" onClick={() => abortRef.current?.abort()}>Cancelar</button>
            )}
          </div>
        </form>
      )}

      {soloLectura && error && <p role="alert" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
      {loading && <p className="text-muted">Cargando…</p>}
      {!loading && videos.length === 0 && <p className="text-muted">Aún no hay videotutoriales publicados.</p>}
      <VideoTutorialesGrid videos={videos} onDelete={soloLectura ? undefined : eliminar} />
    </div>
  );
}
