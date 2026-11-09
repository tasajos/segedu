import { useMemo, useState } from 'react';
import Modal from './Modal';
import { formatBytes } from '../services/driveUpload';

const grupoPorMateria = (videos) => {
  const grupos = new Map();
  videos.forEach((video) => {
    if (!grupos.has(video.materia_id)) grupos.set(video.materia_id, { ...video, videos: [] });
    grupos.get(video.materia_id).videos.push(video);
  });
  return [...grupos.values()];
};

function VideoCard({ video, onPlay, onDelete }) {
  const fecha = new Date(video.created_at).toLocaleDateString('es-BO');
  return (
    <article className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <button
        type="button"
        onClick={() => onPlay(video)}
        aria-label={`Reproducir ${video.titulo}`}
        style={{
          width: '100%', aspectRatio: '16 / 9', border: 0, cursor: 'pointer',
          display: 'grid', placeItems: 'center',
          background: 'linear-gradient(135deg, var(--blue-700), var(--blue-400))'
        }}
      >
        <svg width="52" height="52" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,.92)" />
          <path d="M10 8l6 4-6 4z" fill="var(--blue-700)" />
        </svg>
      </button>
      <div style={{ padding: '.85rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '.3rem', flex: 1 }}>
        <h3 style={{ fontSize: '.95rem', fontWeight: 700, overflowWrap: 'anywhere' }}>{video.titulo}</h3>
        {video.descripcion && (
          <p className="text-muted" style={{ fontSize: '.8rem', overflowWrap: 'anywhere' }}>{video.descripcion}</p>
        )}
        <p className="text-muted" style={{ fontSize: '.72rem', marginTop: 'auto', paddingTop: '.4rem' }}>
          {video.docente_nombre && `${video.docente_nombre} ${video.docente_apellido} · `}
          {fecha} · {formatBytes(video.tamano_bytes)}
        </p>
        {onDelete && (
          <button type="button" className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-start', marginTop: '.35rem' }} onClick={() => onDelete(video)}>
            Eliminar
          </button>
        )}
      </div>
    </article>
  );
}

export default function VideoTutorialesGrid({ videos, onDelete }) {
  const [activo, setActivo] = useState(null);
  const materias = useMemo(() => grupoPorMateria(videos), [videos]);

  return (
    <>
      {materias.map((materia) => (
        <section key={materia.materia_id} style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '.75rem', overflowWrap: 'anywhere' }}>
            {materia.materia_nombre}
            <span className="text-muted" style={{ fontWeight: 500, fontSize: '.82rem' }}>
              {' '}· {materia.materia_codigo} · Grupo {materia.materia_grupo}
            </span>
          </h2>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))' }}>
            {materia.videos.map((video) => (
              <VideoCard key={video.id} video={video} onPlay={setActivo} onDelete={onDelete} />
            ))}
          </div>
        </section>
      ))}

      <Modal open={Boolean(activo)} onClose={() => setActivo(null)} title={activo?.titulo} maxWidth="1000px">
        {activo && (
          <>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', maxHeight: 'calc(100vh - 12rem)', background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {/* Tapa el botón del reproductor de Drive que abre el archivo fuera de SEGEDU */}
              <div aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: 72, height: 72, zIndex: 1 }} />
              <iframe
                src={`https://drive.google.com/file/d/${encodeURIComponent(activo.drive_file_id)}/preview`}
                title={activo.titulo}
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
                style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
              />
            </div>
            <p className="text-muted" style={{ fontSize: '.75rem', marginTop: '.6rem' }}>
              Si el video se acaba de subir, Google Drive puede tardar unos minutos en procesarlo.
            </p>
          </>
        )}
      </Modal>
    </>
  );
}
