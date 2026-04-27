import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const getAbsoluteUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, window.location.origin).href;
};

const getGoogleDriveId = (url) => {
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if (fileMatch) return fileMatch[1];

  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('drive.google.com') ? parsed.searchParams.get('id') : null;
  } catch {
    return null;
  }
};

const buildEmbedUrl = (sourceUrl, tipo) => {
  const absoluteUrl = getAbsoluteUrl(sourceUrl);
  if (!absoluteUrl) return '';

  if (/docs\.google\.com\/presentation/i.test(absoluteUrl)) {
    if (/\/embed/i.test(absoluteUrl)) return absoluteUrl;
    return absoluteUrl
      .replace(/\/edit.*$/i, '/embed?start=false&loop=false&delayms=3000')
      .replace(/\/pub.*$/i, '/embed?start=false&loop=false&delayms=3000');
  }

  const driveId = getGoogleDriveId(absoluteUrl);
  if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;

  if (tipo === 'pdf') return absoluteUrl;
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`;
};

export default function PresentationViewer({ presentation }) {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sourceUrl = presentation?.enlace_url || presentation?.archivo_path || '';
  const tipo = presentation?.tipo_archivo;
  const embedUrl = useMemo(() => buildEmbedUrl(sourceUrl, tipo), [sourceUrl, tipo]);
  const isLocalPdf = tipo === 'pdf' && presentation?.archivo_path && !presentation?.enlace_url;

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

    setPdfUrl('');
    setError('');
    setLoading(true);

    if (!presentation?.id) {
      setLoading(false);
      return undefined;
    }

    if (isLocalPdf) {
      api.get(`/auth/presentaciones/${presentation.id}/ver`, { responseType: 'blob' })
        .then((response) => {
          objectUrl = URL.createObjectURL(response.data);
          if (!cancelled) setPdfUrl(objectUrl);
        })
        .catch(() => {
          if (!cancelled) setError('No se pudo cargar el PDF.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else if (embedUrl) {
      setLoading(false);
    } else {
      setError('No hay una URL disponible para visualizar esta presentación.');
      setLoading(false);
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [presentation?.id, isLocalPdf, embedUrl]);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)' }}>Cargando presentación...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'var(--crimson)', fontSize: '.85rem' }}>{error}</div>;
  }

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
