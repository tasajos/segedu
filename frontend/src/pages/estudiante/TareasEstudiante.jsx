import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import mammoth from 'mammoth';

const formatFecha = (val) => {
  if (!val) return '—';
  const s = String(val).split('T')[0];
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

const diasRestantes = (fechaEntrega) => {
  if (!fechaEntrega) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const entrega = new Date(String(fechaEntrega).split('T')[0]);
  const diff = Math.ceil((entrega - hoy) / (1000 * 60 * 60 * 24));
  return diff;
};

// ── Visor inline para PDF y PPTX (sin descarga) ──────────────────────────────
function VisorMaterial({ tareaId, tipoArchivo }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [slides, setSlides] = useState(null);
  const [wordHtml, setWordHtml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let revoked = false;
    setPdfUrl(null); setSlides(null); setWordHtml(null);
    setLoading(true); setError('');

    if (tipoArchivo === 'pdf') {
      api.get(`/estudiante/tareas/${tareaId}/ver`, { responseType: 'blob' })
        .then(r => { if (!revoked) setPdfUrl(URL.createObjectURL(r.data)); })
        .catch(() => { if (!revoked) setError('No se pudo cargar el archivo PDF.'); })
        .finally(() => { if (!revoked) setLoading(false); });
    } else if (tipoArchivo === 'pptx') {
      api.get(`/estudiante/tareas/${tareaId}/slides`)
        .then(r => { if (!revoked) setSlides(r.data.slides); })
        .catch(() => { if (!revoked) setError('No se pudieron extraer las diapositivas.'); })
        .finally(() => { if (!revoked) setLoading(false); });
    } else if (tipoArchivo === 'word') {
      api.get(`/estudiante/tareas/${tareaId}/ver`, { responseType: 'arraybuffer' })
        .then(r => mammoth.convertToHtml({ arrayBuffer: r.data }))
        .then(result => { if (!revoked) setWordHtml(result.value); })
        .catch(() => { if (!revoked) setError('No se pudo cargar el documento Word.'); })
        .finally(() => { if (!revoked) setLoading(false); });
    } else {
      setLoading(false);
      setError('Sin material adjunto o formato no soportado.');
    }

    return () => {
      revoked = true;
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [tareaId, tipoArchivo]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)' }}>Cargando material...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--crimson)' }}>{error}</div>;

  if (tipoArchivo === 'word' && wordHtml) {
    return (
      <div
        className="word-preview"
        dangerouslySetInnerHTML={{ __html: wordHtml }}
        onContextMenu={e => e.preventDefault()}
        style={{ maxHeight: '72vh', overflowY: 'auto', padding: '1.5rem 2rem', background: '#fff', borderRadius: '4px' }}
      />
    );
  }

  if (tipoArchivo === 'pdf' && pdfUrl) {
    return (
      <div style={{ position: 'relative', height: '72vh', userSelect: 'none' }}>
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: '2px' }}
          title="Material de tarea"
        />
        {/* overlay prevents right-click download */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }} onContextMenu={e => e.preventDefault()} />
      </div>
    );
  }

  if (tipoArchivo === 'pptx' && slides) {
    if (!slides.length) return <p style={{ color: 'var(--ink-light)', padding: '1rem' }}>No se encontraron diapositivas.</p>;
    return (
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '72vh', overflowY: 'auto', padding: '.25rem' }}
        onContextMenu={e => e.preventDefault()}
      >
        {slides.map(s => (
          <div key={s.numero} style={{ background: '#1e1e2e', color: '#e8e8f0', borderRadius: '4px', padding: '1.5rem 2rem', minHeight: '140px' }}>
            <div style={{ fontSize: '.65rem', letterSpacing: '.12em', color: 'rgba(220,220,255,.4)', marginBottom: '1rem', fontFamily: 'var(--mono)' }}>
              DIAPOSITIVA {String(s.numero).padStart(2, '0')}
            </div>
            {s.textos.length === 0
              ? <p style={{ color: 'rgba(220,220,255,.3)', fontStyle: 'italic' }}>— Sin texto —</p>
              : s.textos.map((t, i) => (
                <p key={i} style={{ margin: '.3rem 0', fontSize: i === 0 ? '1.05rem' : '.9rem', fontWeight: i === 0 ? 600 : 400 }}>{t}</p>
              ))
            }
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ── Modal de entrega de tarea (Word o PDF) ───────────────────────────────────
function ModalEntrega({ tarea, onClose, onSuccess }) {
  const [archivo, setArchivo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['doc', 'docx', 'pdf'].includes(ext)) {
      setError('Formato no permitido. Usa .doc, .docx o .pdf');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('El archivo supera el límite de 20 MB.');
      return;
    }
    setError('');
    setArchivo(file);
  };

  const handleFile = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (!archivo) return;
    setError('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('archivo', archivo);
      await api.post(`/estudiante/tareas/${tarea.id}/entrega`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar la entrega');
    } finally {
      setSaving(false);
    }
  };

  const fileIcon = archivo?.name.endsWith('.pdf') ? '📄' : '📝';
  const fileSizeMB = archivo ? (archivo.size / (1024 * 1024)).toFixed(2) : null;

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Info de la tarea */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '.875rem',
        padding: '1rem 1.25rem',
        background: 'var(--blue-50)', border: '1.5px solid var(--blue-100)',
        borderRadius: 'var(--radius)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, background: 'var(--blue-600)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text)', lineHeight: 1.3 }}>{tarea.titulo}</div>
          {tarea.fecha_entrega && (
            <div style={{ fontSize: '.78rem', color: 'var(--blue-700)', marginTop: '.3rem', fontWeight: 500 }}>
              Fecha límite: {formatFecha(tarea.fecha_entrega)}
            </div>
          )}
        </div>
      </div>

      {/* Zona de carga */}
      <div
        onClick={() => !archivo && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem',
          padding: '2rem 1.5rem',
          border: `2px dashed ${archivo ? 'var(--success-border)' : dragOver ? 'var(--blue-400)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius)',
          background: archivo ? 'var(--success-bg)' : dragOver ? 'var(--blue-50)' : 'var(--gray-50)',
          cursor: archivo ? 'default' : 'pointer',
          transition: 'all .2s',
        }}
      >
        {archivo ? (
          <>
            <div style={{ fontSize: '2.25rem', lineHeight: 1 }}>{fileIcon}</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--success)', wordBreak: 'break-all' }}>{archivo.name}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>{fileSizeMB} MB</div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setArchivo(null); if (inputRef.current) inputRef.current.value = ''; }}
              style={{
                fontSize: '.75rem', fontWeight: 600, color: 'var(--danger)',
                background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
                borderRadius: 99, padding: '.2rem .75rem', cursor: 'pointer',
              }}
            >
              Quitar archivo
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'var(--white)', border: '1.5px solid var(--border)',
              display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow-sm)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--blue-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text-soft)' }}>
                Arrastra tu archivo aquí o <span style={{ color: 'var(--blue-600)' }}>selecciona uno</span>
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.3rem' }}>
                Word (.doc, .docx) o PDF · máximo 20 MB
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.4rem' }}>
              {['.DOC', '.DOCX', '.PDF'].map(f => (
                <span key={f} style={{
                  fontSize: '.65rem', fontWeight: 700, letterSpacing: '.04em',
                  padding: '.15rem .55rem', borderRadius: 99,
                  background: 'var(--white)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)',
                }}>{f}</span>
              ))}
            </div>
          </>
        )}
        <input ref={inputRef} type="file" accept=".doc,.docx,.pdf" onChange={handleFile} style={{ display: 'none' }} />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.6rem',
          padding: '.75rem 1rem', borderRadius: 'var(--radius-sm)',
          background: 'var(--danger-bg)', border: '1px solid var(--danger-border)',
          fontSize: '.83rem', color: 'var(--danger)', fontWeight: 500,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Nota de reemplazo */}
      {tarea.entrega_id && (
        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Ya tienes una entrega. Este archivo la reemplazará.
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', paddingTop: '.25rem' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={saving || !archivo}>
          {saving ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
              Enviando...
            </span>
          ) : 'Entregar tarea'}
        </button>
      </div>
    </form>
  );
}

export default function EstudianteTareas() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalMaterial, setModalMaterial] = useState(null); // { id, tipo, titulo }
  const [modalEntrega, setModalEntrega] = useState(null);   // tarea completa

  const cargar = async () => {
    try {
      const r = await api.get('/estudiante/tareas');
      setTareas(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // Group tasks by materia
  const porMateria = tareas.reduce((acc, t) => {
    const key = t.materia_id;
    if (!acc[key]) acc[key] = { nombre: t.materia_nombre, codigo: t.materia_codigo, grupo: t.materia_grupo, tareas: [] };
    acc[key].tareas.push(t);
    return acc;
  }, {});

  const pendientes = tareas.filter(t => !t.entrega_id).length;
  const entregadas = tareas.filter(t => t.entrega_id).length;
  const calificadas = tareas.filter(t => t.calificacion !== null && t.calificacion !== undefined).length;

  return (
    <>
      <PageHeader
        num="05"
        eyebrow="Módulo académico"
        title={<>Mis <span className="display-italic">tareas</span></>}
        lead="Consulte las tareas asignadas por sus docentes. Visualice el material de apoyo directamente en el sistema y entregue sus trabajos en formato Word."
      />

      {/* Estadísticas rápidas */}
      <div className="grid-3 mb-8">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--serif)', color: 'var(--gold-dark)' }}>{tareas.length}</div>
          <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', marginTop: '.25rem' }}>Total de tareas</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--serif)', color: 'var(--crimson)' }}>{pendientes}</div>
          <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', marginTop: '.25rem' }}>Pendientes</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--serif)', color: 'var(--forest)' }}>{calificadas}</div>
          <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', marginTop: '.25rem' }}>Calificadas</div>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--ink-light)' }}>Cargando tareas...</p>}

      {!loading && tareas.length === 0 && (
        <div style={{ padding: '4rem', textAlign: 'center', border: '1px dashed var(--line-strong)' }}>
          <p className="display-italic" style={{ fontSize: '1.1rem', color: 'var(--ink-light)' }}>No hay tareas asignadas</p>
        </div>
      )}

      {/* Tareas agrupadas por materia */}
      {Object.values(porMateria).map((grupo) => (
        <div key={grupo.codigo} style={{ marginBottom: '2.5rem' }}>
          <div className="section-head">
            <h2 style={{ fontFamily: 'var(--serif)' }}>{grupo.nombre}</h2>
            <span className="count text-mono" style={{ fontSize: '.7rem' }}>{grupo.codigo} · Grupo {grupo.grupo}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            {grupo.tareas.map(t => {
              const dias = diasRestantes(t.fecha_entrega);
              const entregada = !!t.entrega_id;
              const calificada = t.calificacion !== null && t.calificacion !== undefined;
              const vencida = dias !== null && dias < 0 && !entregada;

              return (
                <div key={t.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.25rem', alignItems: 'start', borderLeft: `3px solid ${entregada ? 'var(--forest)' : vencida ? 'var(--crimson)' : 'var(--gold)'}` }}>
                  <div>
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.35rem' }}>
                      <h3 style={{ margin: 0 }}>{t.titulo}</h3>
                      {entregada && !calificada && <span className="chip chip-forest">Entregada</span>}
                      {calificada && <span className="chip chip-forest">Nota: {t.calificacion}</span>}
                      {!entregada && !vencida && <span className="chip chip-gold">Pendiente</span>}
                      {vencida && <span className="chip chip-crimson">Vencida</span>}
                      {t.tipo_archivo && <span className="chip chip-ink" style={{ fontSize: '.68rem' }}>{t.tipo_archivo.toUpperCase()}</span>}
                    </div>

                    {t.descripcion && (
                      <p style={{ fontSize: '.87rem', color: 'var(--ink-light)', marginBottom: '.5rem', lineHeight: 1.5 }}>{t.descripcion}</p>
                    )}

                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '.78rem', color: 'var(--ink-light)' }}>
                      <span>Docente: {t.docente_nombre} {t.docente_apellido}</span>
                      {t.fecha_entrega && (
                        <span style={{ color: vencida ? 'var(--crimson)' : dias !== null && dias <= 3 ? 'var(--gold-dark)' : 'inherit' }}>
                          Entrega: {formatFecha(t.fecha_entrega)}
                          {dias !== null && !entregada && (
                            <> · {dias < 0 ? `Vencida hace ${Math.abs(dias)} días` : dias === 0 ? 'Vence hoy' : `${dias} días restantes`}</>
                          )}
                        </span>
                      )}
                    </div>

                    {calificada && t.comentario_calificacion && (
                      <div style={{ marginTop: '.6rem', padding: '.6rem .8rem', background: 'var(--paper-dark)', borderRadius: '2px', fontSize: '.83rem', borderLeft: '3px solid var(--forest)' }}>
                        <strong>Comentario docente:</strong> {t.comentario_calificacion}
                      </div>
                    )}

                    {entregada && t.fecha_mi_entrega && (
                      <div style={{ marginTop: '.4rem', fontSize: '.76rem', color: 'var(--ink-light)' }}>
                        Entregado el {formatFecha(String(t.fecha_mi_entrega).split('T')[0])}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'flex-end', minWidth: '120px' }}>
                    {t.archivo_path && (
                      <button className="btn btn-outline" style={{ fontSize: '.76rem', width: '100%' }}
                        onClick={() => setModalMaterial({ id: t.id, tipo: t.tipo_archivo, titulo: t.titulo })}>
                        Ver material
                      </button>
                    )}
                    <button
                      className={vencida ? 'btn btn-ghost' : 'btn btn-primary'}
                      style={{ fontSize: '.76rem', width: '100%' }}
                      onClick={() => setModalEntrega(t)}
                      disabled={vencida}
                    >
                      {entregada ? 'Reemplazar entrega' : 'Entregar tarea'}
                    </button>
                    {vencida && (
                      <div style={{ maxWidth: '150px', fontSize: '.72rem', lineHeight: 1.35, color: 'var(--danger)', textAlign: 'right' }}>
                        Fuera de la fecha permitida
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modal: visor de material */}
      <Modal open={!!modalMaterial} onClose={() => setModalMaterial(null)} title={modalMaterial?.titulo || 'Material'} maxWidth="900px">
        {modalMaterial && (
          <VisorMaterial tareaId={modalMaterial.id} tipoArchivo={modalMaterial.tipo} />
        )}
      </Modal>

      {/* Modal: entrega de tarea */}
      <Modal open={!!modalEntrega} onClose={() => setModalEntrega(null)} title="Entregar tarea" maxWidth="520px">
        {modalEntrega && (
          <ModalEntrega tarea={modalEntrega} onClose={() => setModalEntrega(null)} onSuccess={cargar} />
        )}
      </Modal>
    </>
  );
}
