import { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import PresentationViewer from '../../components/PresentationViewer';

export default function PresentacionesVista() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visor, setVisor] = useState(null);

  useEffect(() => {
    api.get('/auth/presentaciones')
      .then((response) => setLista(response.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const TIPO_ICON = { pdf: 'PDF', pptx: 'PPT', link: 'URL' };
  const TIPO_LABEL = { pdf: 'PDF', pptx: 'PowerPoint', link: 'Enlace externo' };

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
          No hay presentaciones disponibles aun.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
          {lista.map((p) => (
            <button
              key={p.id}
              onClick={() => setVisor(p)}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.transform = '';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem' }}>
                <span className="chip chip-ink" style={{ lineHeight: 1 }}>{TIPO_ICON[p.tipo_archivo] || 'PPT'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.95rem', lineHeight: 1.3 }}>{p.titulo}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--ink-light)', marginTop: '.2rem', fontFamily: 'var(--mono)' }}>
                    {TIPO_LABEL[p.tipo_archivo] || 'Presentacion'}
                  </div>
                </div>
              </div>
              {p.descripcion && (
                <p style={{ fontSize: '.8rem', color: 'var(--ink-light)', margin: 0, lineHeight: 1.5 }}>
                  {p.descripcion.length > 100 ? `${p.descripcion.slice(0, 100)}...` : p.descripcion}
                </p>
              )}
              <div style={{ fontSize: '.72rem', color: 'var(--ink-light)', fontFamily: 'var(--mono)' }}>
                {p.docente_nombre} {p.docente_apellido} - {new Date(p.created_at).toLocaleDateString('es-ES')}
              </div>
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: 'var(--ink)',
                  color: '#fff',
                  fontSize: '.7rem',
                  padding: '.22rem .55rem',
                  borderRadius: '2px',
                  fontFamily: 'var(--mono)',
                  marginTop: 'auto'
                }}
              >
                Ver presentacion
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!visor} onClose={() => setVisor(null)} title={visor?.titulo || 'Presentacion'} maxWidth="1120px">
        {visor && <PresentationViewer presentation={visor} />}
      </Modal>
    </div>
  );
}
