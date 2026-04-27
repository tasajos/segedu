import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let revoked = false;
    setPdfUrl(null);
    setSlides(null);
    setLoading(true);
    setError('');

    if (tipoArchivo === 'pdf') {
      api.get(`/estudiante/tareas/${tareaId}/ver`, { responseType: 'blob' })
        .then(r => {
          if (!revoked) setPdfUrl(URL.createObjectURL(r.data));
        })
        .catch(() => { if (!revoked) setError('No se pudo cargar el archivo PDF.'); })
        .finally(() => { if (!revoked) setLoading(false); });
    } else if (tipoArchivo === 'pptx') {
      api.get(`/estudiante/tareas/${tareaId}/slides`)
        .then(r => { if (!revoked) setSlides(r.data.slides); })
        .catch(() => { if (!revoked) setError('No se pudieron extraer las diapositivas.'); })
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

// ── Modal de entrega de tarea (solo Word) ────────────────────────────────────
function ModalEntrega({ tarea, onClose, onSuccess }) {
  const [archivo, setArchivo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ padding: '.75rem 1rem', background: 'var(--paper-dark)', borderRadius: '2px', fontSize: '.88rem' }}>
        <strong>{tarea.titulo}</strong>
        {tarea.fecha_entrega && <div style={{ color: 'var(--ink-light)', fontSize: '.8rem', marginTop: '.25rem' }}>Fecha límite: {formatFecha(tarea.fecha_entrega)}</div>}
      </div>
      <div>
        <label className="label">Archivo Word (.docx) *</label>
        <input type="file" accept=".docx" onChange={e => setArchivo(e.target.files[0])} style={{ fontSize: '.85rem' }} required />
        <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', marginTop: '.4rem' }}>
          Solo se aceptan archivos en formato Word (.docx). Si ya entregaste antes, este archivo reemplazará el anterior.
        </div>
      </div>
      {error && <div style={{ color: 'var(--crimson)', fontSize: '.85rem' }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={saving || !archivo}>
          {saving ? 'Enviando...' : 'Entregar tarea'}
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
                    {!vencida && (
                      <button className="btn btn-primary" style={{ fontSize: '.76rem', width: '100%' }}
                        onClick={() => setModalEntrega(t)}>
                        {entregada ? 'Reemplazar entrega' : 'Entregar tarea'}
                      </button>
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
