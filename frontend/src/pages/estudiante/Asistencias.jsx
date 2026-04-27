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
    setModalPermiso(true);
  };

  const enviarPermiso = async (e) => {
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
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (archivo) fd.append('documento', archivo);
      await api.post('/estudiante/permisos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setModalPermiso(false);
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
                  Enviada el {formatFecha(String(p.created_at).split('T')[0])}
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

      {/* Modal: solicitar permiso */}
      <Modal open={modalPermiso} onClose={() => setModalPermiso(false)} title="Solicitar permiso al jefe de carrera" maxWidth="560px">
        <form onSubmit={enviarPermiso} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '.75rem 1rem', background: 'var(--paper-dark)', borderRadius: '2px', fontSize: '.84rem', color: 'var(--ink-light)', borderLeft: '3px solid var(--gold)' }}>
            Su solicitud será enviada directamente al jefe de carrera para su revisión y autorización.
          </div>

          <div>
            <label className="label">Materia *</label>
            <select className="input" value={form.materia_id} onChange={e => setForm(f => ({ ...f, materia_id: e.target.value }))} required>
              <option value="">Seleccione una materia</option>
              {materias.map(m => <option key={m.id} value={m.id}>{m.nombre} — Grupo {m.grupo}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Tipo de solicitud *</label>
            <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              <option value="carta_permiso">Carta de permiso</option>
              <option value="justificacion">Justificación</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="label">Fecha desde *</label>
              <input type="date" className="input" value={form.fecha_desde} onChange={e => setForm(f => ({ ...f, fecha_desde: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Fecha hasta *</label>
              <input type="date" className="input" value={form.fecha_hasta} onChange={e => setForm(f => ({ ...f, fecha_hasta: e.target.value }))} required />
            </div>
          </div>

          <div>
            <label className="label">Horas o días solicitados</label>
            <input className="input" value={form.horas_detalle} onChange={e => setForm(f => ({ ...f, horas_detalle: e.target.value }))} placeholder="Ej: 08:00–10:00 o 2 días" />
          </div>

          <div>
            <label className="label">{form.tipo === 'justificacion' ? 'Justificación *' : 'Detalle complementario'}</label>
            <textarea className="input" rows={3}
              value={form.detalle}
              onChange={e => setForm(f => ({ ...f, detalle: e.target.value }))}
              placeholder={form.tipo === 'justificacion' ? 'Describa el motivo de la justificación...' : 'Observaciones adicionales (opcional)...'} />
          </div>

          {form.tipo === 'carta_permiso' && (
            <div>
              <label className="label">Carta de permiso en Word (.docx) *</label>
              <input type="file" accept=".docx" onChange={e => setArchivo(e.target.files[0])} style={{ fontSize: '.85rem' }} />
              <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', marginTop: '.4rem' }}>
                Solo se aceptan archivos Word (.docx). El jefe de carrera revisará el documento.
              </div>
            </div>
          )}

          {formError && (
            <div style={{ padding: '.75rem 1rem', background: 'rgba(220,38,38,.07)', borderLeft: '3px solid var(--crimson)', borderRadius: '2px', fontSize: '.84rem', color: 'var(--crimson)' }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', paddingTop: '.25rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setModalPermiso(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .res-bar { height: 6px; background: var(--paper-dark); border-radius: 2px; overflow: hidden; margin-bottom: 1rem; }
        .res-bar div { height: 100%; transition: width .5s ease; }
        .res-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; }
        .res-grid > div { display: flex; flex-direction: column; padding: .5rem; background: var(--paper-dark); border-radius: 2px; }
        .rlabel { font-family: var(--mono); font-size: .62rem; color: var(--ink-light); letter-spacing: .1em; text-transform: uppercase; }
        .rval { font-family: var(--serif); font-size: 1.25rem; font-weight: 500; margin-top: 2px; }
      `}</style>
    </>
  );
}
