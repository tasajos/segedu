import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

// ── Helpers de URL ────────────────────────────────────────────
const getAbsoluteUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, window.location.origin).href;
};

const getGoogleDriveFileId = (url) => {
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if (fileMatch) return fileMatch[1];
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('drive.google.com') ? parsed.searchParams.get('id') : null;
  } catch {
    return null;
  }
};

const isDriveFolder = (url) =>
  /drive\.google\.com\/drive\/folders\//i.test(url);

const getDriveFolderEmbedUrl = (url) => {
  const match = url.match(/\/folders\/([^/?#&]+)/i);
  return match
    ? `https://drive.google.com/embeddedfolderview?id=${match[1]}#list`
    : null;
};

const buildEmbedUrl = (sourceUrl, tipo) => {
  const absoluteUrl = getAbsoluteUrl(sourceUrl);
  if (!absoluteUrl) return '';

  // Google Slides
  if (/docs\.google\.com\/presentation/i.test(absoluteUrl)) {
    if (/\/embed/i.test(absoluteUrl)) return absoluteUrl;
    return absoluteUrl
      .replace(/\/edit.*$/i, '/embed?start=false&loop=false&delayms=3000')
      .replace(/\/pub.*$/i, '/embed?start=false&loop=false&delayms=3000');
  }

  // Carpeta de Google Drive — debe ir ANTES del check de archivo
  if (isDriveFolder(absoluteUrl)) {
    return getDriveFolderEmbedUrl(absoluteUrl) || absoluteUrl;
  }

  // Archivo de Google Drive
  const driveFileId = getGoogleDriveFileId(absoluteUrl);
  if (driveFileId) return `https://drive.google.com/file/d/${driveFileId}/preview`;

  if (tipo === 'pdf') return absoluteUrl;
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`;
};

// ── Visor de carpeta Drive ────────────────────────────────────
function DrivefolderViewer({ url }) {
  const folderId = url.match(/\/folders\/([^/?#&]+)/i)?.[1];
  const embedUrl = folderId
    ? `https://drive.google.com/embeddedfolderview?id=${folderId}#list`
    : null;

  if (!embedUrl) {
    return (
      <div style={{ padding: '2rem', color: 'var(--danger)', fontSize: '.88rem' }}>
        No se pudo extraer el ID de la carpeta. Verifica que el enlace sea correcto.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '76vh', minHeight: 520 }}>
      {/* Aviso */}
      <div style={{
        padding: '.6rem 1rem', background: 'var(--blue-50)',
        borderBottom: '1px solid var(--blue-100)',
        fontSize: '.78rem', color: 'var(--blue-700)',
        display: 'flex', alignItems: 'center', gap: '.5rem',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        Carpeta compartida de Google Drive — haz clic en los archivos o subcarpetas para abrirlos
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--blue-600)', textDecoration: 'none' }}
          onClick={e => e.stopPropagation()}
        >
          Abrir en Drive ↗
        </a>
      </div>
      <iframe
        src={embedUrl}
        style={{ flex: 1, border: 'none', background: '#fff' }}
        title="Carpeta de Google Drive"
        allowFullScreen
      />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function PresentationViewer({ presentation }) {
  const [pdfUrl, setPdfUrl]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const sourceUrl  = presentation?.enlace_url || presentation?.archivo_path || '';
  const tipo       = presentation?.tipo_archivo;
  const isFolder   = Boolean(presentation?.enlace_url && isDriveFolder(presentation.enlace_url));
  const embedUrl   = useMemo(() => buildEmbedUrl(sourceUrl, tipo), [sourceUrl, tipo]);
  const isLocalPdf = tipo === 'pdf' && presentation?.archivo_path && !presentation?.enlace_url;

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

    setPdfUrl('');
    setError('');
    setLoading(true);

    if (!presentation?.id) { setLoading(false); return undefined; }

    if (isFolder) {
      setLoading(false);
      return undefined;
    }

    if (isLocalPdf) {
      api.get(`/auth/presentaciones/${presentation.id}/ver`, { responseType: 'blob' })
        .then(r => { objectUrl = URL.createObjectURL(r.data); if (!cancelled) setPdfUrl(objectUrl); })
        .catch(() => { if (!cancelled) setError('No se pudo cargar el PDF.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    } else if (embedUrl) {
      setLoading(false);
    } else {
      setError('No hay una URL disponible para visualizar esta presentación.');
      setLoading(false);
    }

    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [presentation?.id, isFolder, isLocalPdf, embedUrl]);

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)' }}>
      Cargando presentación...
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', color: 'var(--crimson)', fontSize: '.85rem' }}>{error}</div>
  );

  // Carpeta de Drive
  if (isFolder) return <DrivefolderViewer url={presentation.enlace_url} />;

  const iframeUrl = isLocalPdf ? `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1` : embedUrl;

  return (
    <div style={{ height: '76vh', minHeight: '520px', background: 'var(--paper-dark)', borderRadius: '3px', overflow: 'hidden' }}>
      <iframe
        src={iframeUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={presentation?.titulo || 'Presentación'}
        allowFullScreen
      />
    </div>
  );
}
