import { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';

// ── Visor inline PDF / PPTX (sin descarga, sin controles de descarga) ─────────
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
        {/* bloquea clic derecho y descarga */}
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

// ── Página vista (estudiante / jefe) ──────────────────────────────────────────
export default function PresentacionesVista() {
  const [lista, setLista]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [visor, setVisor]     = useState(null); // {id, titulo, tipo}

  useEffect(() => {
    api.get('/auth/presentaciones')
      .then(r => setLista(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const TIPO_ICON  = { pdf: '📄', pptx: '📊' };
  const TIPO_LABEL = { pdf: 'PDF', pptx: 'PowerPoint' };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', marginBottom: '.2rem' }}>Presentaciones</h1>
        <p style={{ fontSize: '.85rem', color: 'var(--ink-light)' }}>
          Material de estudio subido por los docentes. Solo puedes visualizarlo.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', color: 'var(--ink-light)' }}>Cargando...</div>
      ) : lista.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)', background: 'var(--paper-dark)', borderRadius: '3px' }}>
          No hay presentaciones disponibles aún.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
          {lista.map(p => (
            <button
              key={p.id}
              onClick={() => setVisor({ id: p.id, titulo: p.titulo, tipo: p.tipo_archivo })}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '.6rem',
                background: 'var(--paper-dark)',
                border: '1px solid rgba(0,0,0,.1)',
                borderRadius: '3px',
                padding: '1.1rem',
                transition: 'box-shadow .15s, transform .15s',
                textAlign: 'left'
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem' }}>
                <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{TIPO_ICON[p.tipo_archivo]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.95rem', lineHeight: 1.3 }}>{p.titulo}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--ink-light)', marginTop: '.2rem', fontFamily: 'var(--mono)' }}>
                    {TIPO_LABEL[p.tipo_archivo]}
                  </div>
                </div>
              </div>
              {p.descripcion && (
                <p style={{ fontSize: '.8rem', color: 'var(--ink-light)', margin: 0, lineHeight: 1.5 }}>
                  {p.descripcion.length > 100 ? p.descripcion.slice(0, 100) + '…' : p.descripcion}
                </p>
              )}
              <div style={{ fontSize: '.72rem', color: 'var(--ink-light)', fontFamily: 'var(--mono)' }}>
                {p.docente_nombre} {p.docente_apellido} · {new Date(p.created_at).toLocaleDateString('es-ES')}
              </div>
              <div style={{
                alignSelf: 'flex-start',
                background: 'var(--ink)',
                color: '#fff',
                fontSize: '.7rem',
                padding: '.22rem .55rem',
                borderRadius: '2px',
                fontFamily: 'var(--mono)',
                marginTop: 'auto'
              }}>
                Ver presentación →
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!visor} onClose={() => setVisor(null)} title={visor?.titulo || 'Presentación'} maxWidth="920px">
        {visor && <VisorPresentacion id={visor.id} tipo={visor.tipo} />}
      </Modal>
    </div>
  );
}
