import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import VideoTutorialesGrid from '../../components/VideoTutorialesGrid';

export default function EstudianteVideotutoriales() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/estudiante/videotutoriales')
      .then(({ data }) => setVideos(data))
      .catch((err) => setError(err.response?.data?.error || 'No se pudieron cargar los videotutoriales'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Mis materias" title="Videotutoriales" lead="Videos publicados por tus docentes en las materias donde estás inscrito." />
      {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}
      {loading && <p className="text-muted">Cargando…</p>}
      {!loading && !error && videos.length === 0 && (
        <p className="text-muted">Tus materias aún no tienen videotutoriales.</p>
      )}
      <VideoTutorialesGrid videos={videos} />
    </div>
  );
}
