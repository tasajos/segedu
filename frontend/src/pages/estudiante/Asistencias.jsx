import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const ESTADOS = [
  { val: 'presente', label: 'Presente', color: 'forest' },
  { val: 'falta',    label: 'Falta',    color: 'crimson' },
  { val: 'permiso',  label: 'Permiso',  color: 'gold' },
  { val: 'tarde',    label: 'Tarde',    color: 'ink' }
];

const TIPO_COLOR  = { falta: 'var(--crimson)', sancion: '#7b2d8b', permiso: 'var(--gold)' };
const TIPO_CHIP   = { falta: 'chip-crimson', sancion: 'chip-ink', permiso: 'chip-gold' };
const COMENTARIO_COLOR = { alerta: 'var(--crimson)', felicitacion: 'var(--forest)', positivo: 'var(--forest)', observacion: 'var(--gold)' };

const SOLICITUD_LABEL = { carta_permiso: 'Carta de permiso', justificacion: 'Justificación' };

const formatFecha = (val) => {
  if (!val) return '—';
  const s = String(val).split('T')[0];
  const [y, m, d] = s.split('-');
  if (!y || !m || !d) return val;
  return new Date(+y, +m - 1, +d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const today = new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  materia_id: '', tipo: 'carta_permiso',
  fecha_desde: today, fecha_hasta: today,
  horas_detalle: '', detalle: ''
};

export default function EstudianteAsistencias() {
  const [materias,   setMaterias]   = useState([]);
  const [resumen,    setResumen]    = useState([]);
  const [expediente, setExpediente] = useState(null);
  const [permisos,   setPermisos]   = useState([]);
  const [filter,     setFilter]     = useState('');
  const [tab,        setTab]        = useState('asistencias');

  const [modalPermiso, setModalPermiso] = useState(false);
  const [permisoStep,  setPermisoStep]  = useState('form'); // 'form' | 'confirm'
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [archivo,      setArchivo]      = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [formError,    setFormError]    = useState('');

  const cargar = async () => {
    const [m, r, e, p] = await Promise.all([
      api.get('/estudiante/materias'),
      api.get('/estudiante/asistencias/resumen'),
      api.get('/estudiante/expediente'),
      api.get('/estudiante/permisos')
    ]);
    setMaterias(m.data);
    setResumen(r.data);
    setExpediente(e.data);
    setPermisos(p.data);
  };

  useEffect(() => { cargar(); }, []);

  const asistenciasFiltradas = (expediente?.asistencias || []).filter(a =>
    !filter || String(a.materia_id) === filter
  );

  const estadoInfo = (v) => ESTADOS.find(e => e.val === v) || ESTADOS[0];

  const abrirModalPermiso = () => {
    setForm(EMPTY_FORM);
    setArchivo(null);
    setFormError('');
    setPermisoStep('form');
    setModalPermiso(true);
  };

  const revisarPermiso = (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.materia_id) { setFormError('Seleccione una materia'); return; }
    if (form.tipo === 'carta_permiso' && !archivo) {
      setFormError('Debe adjuntar la carta de permiso en formato Word (.docx)');
      return;
    }
    if (form.tipo === 'justificacion' && !form.detalle.trim()) {
      setFormError('Debe escribir la justificación');
      return;
    }
    setPermisoStep('confirm');
  };

  const enviarPermiso = async () => {
    setFormError('');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (archivo) fd.append('documento', archivo);
      await api.post('/estudiante/permisos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPermisoStep('success');
      cargar();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al enviar la solicitud');
    } finally {
      setSaving(false);
    }
  };

  const pendientesPermiso = permisos.length;

  return (
    <>
      <PageHeader
        num="04"
        eyebrow="Mi expediente académico"
        title={<>Asistencias y <span className="display-italic">permisos</span></>}
        lead="Consulte sus registros de asistencia, disciplina y observaciones. Si necesita un permiso o justificación, envíe la solicitud al jefe de carrera."
        actions={
          <button className="btn btn-primary" onClick={abrirModalPermiso}>
            Solicitar permiso
          </button>
        }
      />

      {/* Resumen por materia */}
      <div className="section-head">
        <h2>Resumen por materia</h2>
        <span className="count">{resumen.length} materias</span>
      </div>
      <div className="grid-2 mb-8">
        {resumen.map((r, i) => {
          const total = (+r.presentes) + (+r.faltas) + (+r.permisos) + (+r.tardes);
          const pct = total ? Math.round((+r.presentes * 100) / total) : 0;
          return (
            <div key={r.id} className="card">
              <div className="flex justify-between items-center mb-4">
                <span className="text-mono" style={{ fontSize: '.7rem', color: 'var(--gold-dark)' }}>
                  {String(i + 1).padStart(2, '0')} · {r.nombre}
                </span>
                <span className="chip chip-ink">{pct}%</span>
              </div>
              <div className="res-bar">
                <div style={{ width: `${pct}%`, background: pct >= 80 ? 'var(--forest)' : pct >= 60 ? 'var(--gold)' : 'var(--crimson)' }} />
              </div>
              <div className="res-grid">
                <div><span className="rlabel">Presentes</span><span className="rval" style={{ color: 'var(--forest)' }}>{r.presentes}</span></div>
                <div><span className="rlabel">Faltas</span><span className="rval" style={{ color: 'var(--crimson)' }}>{r.faltas}</span></div>
                <div><span className="rlabel">Permisos</span><span className="rval" style={{ color: 'var(--gold-dark)' }}>{r.permisos}</span></div>
                <div><span className="rlabel">Tardes</span><span className="rval">{r.tardes}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.25rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--line)' }}>
        {[
          { key: 'asistencias', label: 'Asistencias' },
          { key: 'permisos',    label: 'Mis solicitudes', badge: pendientesPermiso },
          { key: 'disciplina',  label: 'Disciplina', badge: expediente?.disciplina?.length || 0 },
          { key: 'comentarios', label: 'Observaciones' }
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '.5rem 1rem', border: 'none', background: 'transparent',
            fontFamily: 'var(--mono)', fontSize: '.78rem', cursor: 'pointer',
            letterSpacing: '.06em', textTransform: 'uppercase',
            borderBottom: tab === t.key ? '2px solid var(--ink)' : '2px solid transparent',
            marginBottom: '-2px',
            color: tab === t.key ? 'var(--ink)' : 'var(--ink-light)',
            display: 'flex', alignItems: 'center', gap: '.4rem'
          }}>
            {t.label}
            {t.badge > 0 && (
              <span style={{ background: 'var(--gold-dark)', color: '#fff', borderRadius: '999px', padding: '1px 6px', fontSize: '.6rem' }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Asistencias */}
      {tab === 'asistencias' && (
        <>
          <div className="section-head">
            <h2>Historial de asistencias</h2>
            <select value={filter} onChange={e => setFilter(e.target.value)} style={{
              fontFamily: 'var(--mono)', fontSize: '.75rem', padding: '.4rem .75rem',
              background: 'var(--paper-light)', border: '1px solid var(--line-strong)', borderRadius: '2px'
            }}>
              <option value="">Todas las materias</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>№</th><th>Fecha</th><th>Materia</th><th>Estado</th><th>Justificación</th>
              </tr>
            </thead>
            <tbody>
              {asistenciasFiltradas.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic', color: 'var(--ink-light)' }}>Sin registros</td></tr>
              )}
              {asistenciasFiltradas.map((a, i) => {
                const info = estadoInfo(a.estado);
                return (
                  <tr key={a.id}>
                    <td className="num">{String(i + 1).padStart(3, '0')}</td>
                    <td style={{ fontFamily: 'var(--serif)' }}>{formatFecha(String(a.fecha).split('T')[0])}</td>
                    <td>{a.materia_nombre}</td>
                    <td><span className={`chip chip-${info.color}`}>{info.label}</span></td>
                    <td style={{ color: 'var(--ink-light)', fontSize: '.85rem' }}>{a.justificacion || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {/* Tab: Mis solicitudes de permiso */}
      {tab === 'permisos' && (
        <>
          <div className="section-head">
            <h2>Mis solicitudes de permiso</h2>
            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
              <span className="count">{permisos.length} solicitudes</span>
              <button className="btn btn-primary" style={{ fontSize: '.78rem' }} onClick={abrirModalPermiso}>
                + Nueva solicitud
              </button>
            </div>
          </div>

          {permisos.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--line-strong)' }}>
              <p className="display-italic" style={{ color: 'var(--ink-light)' }}>Sin solicitudes enviadas</p>
              <p style={{ fontSize: '.85rem', color: 'var(--ink-light)', marginTop: '.5rem' }}>
                Sus solicitudes serán revisadas por el jefe de carrera.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {permisos.map(p => (
              <div key={p.id} style={{
                padding: '.9rem 1.1rem', background: 'var(--paper-dark)', borderRadius: '2px',
                borderLeft: `4px solid ${p.tipo === 'carta_permiso' ? 'var(--gold)' : 'var(--ink)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, marginBottom: '.25rem' }}>
                      {p.materia_nombre}
                    </div>
                    <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>
                      {p.materia_codigo} · Grupo {p.materia_grupo}
                    </div>
                  </div>
                  <span className={`chip ${p.tipo === 'carta_permiso' ? 'chip-gold' : 'chip-ink'}`}>
                    {SOLICITUD_LABEL[p.tipo] || p.tipo}
                  </span>
                </div>
                <div style={{ fontSize: '.85rem', marginTop: '.55rem' }}>
                  {formatFecha(p.fecha_desde)}{p.fecha_desde !== p.fecha_hasta ? ` al ${formatFecha(p.fecha_hasta)}` : ''}
                  {p.horas_detalle ? ` · ${p.horas_detalle}` : ''}
                </div>
                {p.detalle && (
                  <p style={{ fontSize: '.84rem', color: 'var(--ink-light)', marginTop: '.35rem' }}>{p.detalle}</p>
                )}
                <div style={{ marginTop: '.5rem', fontSize: '.76rem', color: 'var(--ink-light)' }}>
                  Enviada el {p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                  {p.documento_url && <span style={{ marginLeft: '.75rem', color: 'var(--forest)' }}>✓ Documento adjunto</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tab: Disciplina */}
      {tab === 'disciplina' && (
        <>
          <div className="section-head">
            <h2>Registros disciplinarios</h2>
            <span className="count">{expediente?.disciplina?.length || 0} registros</span>
          </div>
          {expediente?.disciplina?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>Sin registros disciplinarios</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {expediente?.disciplina?.map(d => (
                <div key={d.id} style={{ padding: '.875rem 1rem', borderLeft: `4px solid ${TIPO_COLOR[d.tipo] || 'var(--gold)'}`, background: 'var(--paper-dark)', borderRadius: '0 2px 2px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className={`chip ${TIPO_CHIP[d.tipo]}`}>{d.tipo}</span>
                    <span className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>
                      {formatFecha(String(d.fecha).split('T')[0])}
                    </span>
                  </div>
                  <p style={{ fontSize: '.9rem', marginTop: '.5rem', marginBottom: '.4rem' }}>{d.descripcion}</p>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>
                    {d.materia_nombre && `${d.materia_nombre} · `}
                    Registrado por: {d.registrado_nombre} {d.registrado_apellido} ({d.registrado_rol})
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Observaciones */}
      {tab === 'comentarios' && (
        <>
          <div className="section-head">
            <h2>Observaciones y comentarios</h2>
            <span className="count">{expediente?.comentarios?.length || 0} registros</span>
          </div>
          {expediente?.comentarios?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>Sin observaciones registradas</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {expediente?.comentarios?.map(c => {
                const color = COMENTARIO_COLOR[c.tipo] || 'var(--gold)';
                return (
                  <div key={c.id} style={{ padding: '.875rem 1rem', borderLeft: `4px solid ${color}`, background: 'var(--paper-dark)', borderRadius: '0 2px 2px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="text-mono" style={{ fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color }}>
                        {c.tipo}
                      </span>
                      <span className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>
                        {new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: '.95rem', marginTop: '.4rem' }}>
                      «{c.comentario}»
                    </p>
                    <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', marginTop: '.3rem' }}>
                      — {c.docente_nombre} {c.docente_apellido}
                      {c.materia_nombre && ` · ${c.materia_nombre}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal: solicitar permiso (3 pasos: form → confirm → success) */}
      <Modal
        open={modalPermiso}
        onClose={() => setModalPermiso(false)}
        title={
          permisoStep === 'confirm' ? 'Confirmar solicitud'
          : permisoStep === 'success' ? 'Solicitud enviada'
          : 'Solicitar permiso al jefe de carrera'
        }
        maxWidth="560px"
      >
        {/* ── PASO 1: Formulario ── */}
        {permisoStep === 'form' && (
          <form onSubmit={revisarPermiso} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Bloque: materia + tipo */}
            <div className="perm-block">
              <p className="perm-block-title">Información básica</p>

              <div className="perm-field">
                <label className="perm-label">Materia <span className="perm-req">*</span></label>
                <div className="perm-select-wrap">
                  <select
                    value={form.materia_id}
                    onChange={e => setForm(f => ({ ...f, materia_id: e.target.value }))}
                    required
                    className="perm-select"
                  >
                    <option value="">Seleccione una materia</option>
                    {materias.map(m => <option key={m.id} value={m.id}>{m.nombre} — Grupo {m.grupo}</option>)}
                  </select>
                  <span className="perm-select-arrow">▾</span>
                </div>
              </div>

              <div className="perm-field">
                <label className="perm-label">Tipo de solicitud <span className="perm-req">*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.625rem', marginTop: '.25rem' }}>
                  {[
                    { val: 'carta_permiso', icon: '📄', label: 'Carta de permiso', desc: 'Documento .docx adjunto' },
                    { val: 'justificacion',  icon: '✍️',  label: 'Justificación',   desc: 'Descripción escrita' },
                  ].map(opt => (
                    <label key={opt.val} className={`perm-tipo-card${form.tipo === opt.val ? ' perm-tipo-card--active' : ''}`}>
                      <input type="radio" name="tipo" value={opt.val} checked={form.tipo === opt.val}
                        onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
                      <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{opt.icon}</span>
                      <div>
                        <div className="perm-tipo-name">{opt.label}</div>
                        <div className="perm-tipo-desc">{opt.desc}</div>
                      </div>
                      {form.tipo === opt.val && (
                        <span style={{ marginLeft: 'auto', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3l2.5 2.5L8 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Bloque: período */}
            <div className="perm-block">
              <p className="perm-block-title">Período solicitado</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '.5rem', alignItems: 'end' }}>
                <div className="perm-field" style={{ marginBottom: 0 }}>
                  <label className="perm-label">Desde <span className="perm-req">*</span></label>
                  <input type="date" className="perm-input" value={form.fecha_desde}
                    onChange={e => setForm(f => ({ ...f, fecha_desde: e.target.value }))} required />
                </div>
                <span style={{ paddingBottom: '.65rem', color: 'var(--ink-light)', fontSize: '.85rem' }}>→</span>
                <div className="perm-field" style={{ marginBottom: 0 }}>
                  <label className="perm-label">Hasta <span className="perm-req">*</span></label>
                  <input type="date" className="perm-input" value={form.fecha_hasta}
                    onChange={e => setForm(f => ({ ...f, fecha_hasta: e.target.value }))} required />
                </div>
              </div>

              <div className="perm-field">
                <label className="perm-label">Horas o días solicitados</label>
                <input type="text" className="perm-input" value={form.horas_detalle}
                  onChange={e => setForm(f => ({ ...f, horas_detalle: e.target.value }))}
                  placeholder="Ej: 08:00–10:00 o 2 días" />
              </div>
            </div>

            {/* Bloque: documentación */}
            <div className="perm-block">
              <p className="perm-block-title">Documentación</p>

              <div className="perm-field">
                <label className="perm-label">
                  {form.tipo === 'justificacion' ? 'Justificación' : 'Observaciones adicionales'}
                  {form.tipo === 'justificacion' && <span className="perm-req"> *</span>}
                </label>
                <textarea className="perm-input perm-textarea" rows={3} value={form.detalle}
                  onChange={e => setForm(f => ({ ...f, detalle: e.target.value }))}
                  placeholder={form.tipo === 'justificacion' ? 'Describa el motivo de la justificación…' : 'Observaciones adicionales (opcional)…'} />
              </div>

              {form.tipo === 'carta_permiso' && (
                <div className="perm-field">
                  <label className="perm-label">Carta en Word (.docx) <span className="perm-req">*</span></label>
                  <label className={`perm-dropzone${archivo ? ' perm-dropzone--ok' : ''}`}>
                    <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{archivo ? '✅' : '📎'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="perm-dropzone-name">{archivo ? archivo.name : 'Haga clic para adjuntar'}</div>
                      <div className="perm-dropzone-hint">{archivo ? `${(archivo.size / 1024).toFixed(0)} KB` : 'Solo archivos .docx'}</div>
                    </div>
                    {archivo && (
                      <button type="button" className="perm-dropzone-remove"
                        onClick={e => { e.preventDefault(); setArchivo(null); }}>✕</button>
                    )}
                    <input type="file" accept=".docx" onChange={e => setArchivo(e.target.files[0])} style={{ display: 'none' }} />
                  </label>
                </div>
              )}
            </div>

            {formError && <div className="perm-error">{formError}</div>}

            <div className="perm-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setModalPermiso(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ gap: '.5rem' }}>
                Revisar solicitud <span style={{ opacity: .8 }}>→</span>
              </button>
            </div>
          </form>
        )}

        {/* ── PASO 2: Confirmación ── */}
        {permisoStep === 'confirm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ textAlign: 'center', paddingTop: '.75rem' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'linear-gradient(135deg,rgba(245,158,11,.2),rgba(245,158,11,.06))',
                border: '2px solid var(--gold)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto .875rem', fontSize: '1.5rem'
              }}>📨</div>
              <p style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', color: 'var(--ink)', margin: 0 }}>
                ¿Confirma el envío de la siguiente solicitud?
              </p>
            </div>

            <div style={{ background: 'var(--paper-dark)', borderRadius: '8px', border: '1px solid var(--line)', overflow: 'hidden' }}>
              {[
                { label: 'Materia',   val: materias.find(m => String(m.id) === String(form.materia_id))?.nombre || '—' },
                { label: 'Tipo',      val: SOLICITUD_LABEL[form.tipo] || form.tipo },
                { label: 'Período',   val: formatFecha(form.fecha_desde) + (form.fecha_desde !== form.fecha_hasta ? ` — ${formatFecha(form.fecha_hasta)}` : '') },
                form.horas_detalle   ? { label: 'Horario',   val: form.horas_detalle } : null,
                archivo               ? { label: 'Documento', val: archivo.name }       : null,
                form.detalle.trim()  ? { label: form.tipo === 'justificacion' ? 'Justificación' : 'Detalle', val: form.detalle } : null,
              ].filter(Boolean).map((row, i, arr) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '108px 1fr', gap: '.75rem',
                  padding: '.625rem 1rem',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                  alignItems: 'baseline'
                }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', color: 'var(--ink-light)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{row.label}</span>
                  <span style={{ fontSize: '.87rem', color: 'var(--ink)', fontWeight: 500, wordBreak: 'break-word' }}>{row.val}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '.8rem', color: 'var(--ink-light)', textAlign: 'center', margin: 0 }}>
              La solicitud quedará <strong>pendiente de revisión</strong> por el jefe de carrera.
            </p>

            {formError && <div className="perm-error">{formError}</div>}

            <div className="perm-footer">
              <button type="button" className="btn btn-ghost"
                onClick={() => { setPermisoStep('form'); setFormError(''); }}>← Editar</button>
              <button type="button" className="btn btn-primary" onClick={enviarPermiso} disabled={saving}>
                {saving ? 'Enviando…' : '✓ Confirmar y enviar'}
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 3: Éxito ── */}
        {permisoStep === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.5rem 0 .5rem', textAlign: 'center' }}>
            <div style={{
              width: '68px', height: '68px', borderRadius: '50%',
              background: 'linear-gradient(135deg,rgba(22,163,74,.18),rgba(22,163,74,.06))',
              border: '2.5px solid var(--forest)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'
            }}>✓</div>

            <div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 .35rem' }}>
                ¡Solicitud enviada con éxito!
              </h3>
              <p style={{ fontSize: '.88rem', color: 'var(--ink-light)', margin: 0, lineHeight: 1.6 }}>
                Su solicitud fue enviada al jefe de carrera.<br/>
                Puede consultar el estado en la pestaña <strong>Mis solicitudes</strong>.
              </p>
            </div>

            <div style={{
              width: '100%', background: 'var(--paper-dark)', borderRadius: '8px',
              border: '1px solid var(--line)', padding: '.75rem 1rem',
              display: 'flex', gap: '.75rem', alignItems: 'center', marginTop: '.25rem'
            }}>
              <span style={{ fontSize: '1.1rem' }}>{form.tipo === 'carta_permiso' ? '📄' : '✍️'}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--ink)' }}>
                  {materias.find(m => String(m.id) === String(form.materia_id))?.nombre}
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--ink-light)', marginTop: '.1rem' }}>
                  {SOLICITUD_LABEL[form.tipo]} · {formatFecha(form.fecha_desde)}
                  {form.fecha_desde !== form.fecha_hasta ? ` — ${formatFecha(form.fecha_hasta)}` : ''}
                </div>
              </div>
              <span className="chip chip-gold" style={{ marginLeft: 'auto', flexShrink: 0 }}>Pendiente</span>
            </div>

            <button className="btn btn-primary" style={{ marginTop: '.5rem', width: '100%' }}
              onClick={() => { setModalPermiso(false); setTab('permisos'); }}>
              Ver mis solicitudes
            </button>
          </div>
        )}
      </Modal>

      <style>{`
        /* ── Attendance charts ── */
        .res-bar { height: 6px; background: var(--paper-dark); border-radius: 2px; overflow: hidden; margin-bottom: 1rem; }
        .res-bar div { height: 100%; transition: width .5s ease; }
        .res-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; }
        .res-grid > div { display: flex; flex-direction: column; padding: .5rem; background: var(--paper-dark); border-radius: 2px; }
        .rlabel { font-family: var(--mono); font-size: .62rem; color: var(--ink-light); letter-spacing: .1em; text-transform: uppercase; }
        .rval { font-family: var(--serif); font-size: 1.25rem; font-weight: 500; margin-top: 2px; }

        /* ── Permission form ── */
        .perm-block { display: flex; flex-direction: column; gap: .75rem; }
        .perm-block-title {
          font-family: var(--mono); font-size: .62rem; letter-spacing: .13em;
          text-transform: uppercase; color: var(--ink-light);
          padding-bottom: .4rem; border-bottom: 1.5px solid var(--line);
          margin: 0;
        }
        .perm-field { display: flex; flex-direction: column; gap: .3rem; margin-bottom: 0; }
        .perm-label { font-size: .78rem; font-weight: 600; color: var(--ink); letter-spacing: .01em; }
        .perm-req { color: var(--crimson); font-weight: 700; }

        .perm-select-wrap { position: relative; }
        .perm-select {
          width: 100%; appearance: none; -webkit-appearance: none;
          padding: .6rem .875rem; padding-right: 2rem;
          border: 1.5px solid var(--line-strong); border-radius: 6px;
          background: var(--paper-light); color: var(--ink);
          font-size: .88rem; font-family: inherit; cursor: pointer;
          transition: border-color .15s, box-shadow .15s;
          outline: none;
        }
        .perm-select:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(245,158,11,.12); }
        .perm-select-arrow {
          position: absolute; right: .75rem; top: 50%; transform: translateY(-50%);
          color: var(--ink-light); pointer-events: none; font-size: .75rem;
        }

        .perm-input {
          width: 100%; padding: .6rem .875rem;
          border: 1.5px solid var(--line-strong); border-radius: 6px;
          background: var(--paper-light); color: var(--ink);
          font-size: .88rem; font-family: inherit;
          transition: border-color .15s, box-shadow .15s;
          outline: none; box-sizing: border-box;
        }
        .perm-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(245,158,11,.12); }
        .perm-textarea { resize: vertical; min-height: 80px; line-height: 1.55; }

        .perm-tipo-card {
          display: flex; align-items: center; gap: .625rem;
          padding: .75rem .875rem; border-radius: 8px; cursor: pointer;
          border: 1.5px solid var(--line-strong);
          background: var(--paper-light);
          transition: border-color .15s, background .15s, box-shadow .15s;
          user-select: none; position: relative;
        }
        .perm-tipo-card:hover { border-color: var(--gold); background: rgba(245,158,11,.04); }
        .perm-tipo-card--active {
          border-color: var(--gold); background: rgba(245,158,11,.07);
          box-shadow: 0 0 0 3px rgba(245,158,11,.1);
        }
        .perm-tipo-name { font-size: .82rem; font-weight: 700; color: var(--ink); }
        .perm-tipo-desc { font-size: .71rem; color: var(--ink-light); margin-top: .1rem; }

        .perm-dropzone {
          display: flex; align-items: center; gap: .75rem;
          padding: .8rem 1rem; border-radius: 8px; cursor: pointer;
          border: 2px dashed var(--line-strong); background: var(--paper-light);
          transition: border-color .2s, background .2s;
        }
        .perm-dropzone:hover { border-color: var(--gold); }
        .perm-dropzone--ok { border-color: var(--forest); border-style: solid; background: rgba(22,163,74,.04); }
        .perm-dropzone-name { font-size: .82rem; font-weight: 600; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .perm-dropzone-hint { font-size: .71rem; color: var(--ink-light); margin-top: .1rem; }
        .perm-dropzone-remove {
          background: none; border: none; cursor: pointer; color: var(--crimson);
          font-size: .85rem; padding: .25rem .4rem; border-radius: 4px;
          flex-shrink: 0; line-height: 1;
          transition: background .15s;
        }
        .perm-dropzone-remove:hover { background: rgba(220,38,38,.08); }

        .perm-error {
          padding: .75rem 1rem; background: rgba(220,38,38,.07);
          border-left: 3px solid var(--crimson); border-radius: 4px;
          font-size: .84rem; color: var(--crimson); line-height: 1.5;
        }
        .perm-footer {
          display: flex; justify-content: flex-end; gap: .75rem;
          padding-top: .625rem; border-top: 1.5px solid var(--line);
        }
      `}</style>
    </>
  );
}
