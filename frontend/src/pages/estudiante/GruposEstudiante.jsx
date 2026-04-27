import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';

const formatFecha = (val) => {
  if (!val) return '—';
  const s = String(val).split('T')[0];
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

export default function EstudianteGrupos() {
  const { user } = useAuth();
  const estudianteId = user?.estudiante_id;

  const [tareas, setTareas] = useState([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [miGrupoId, setMiGrupoId] = useState(null);
  const [companeros, setCompaneros] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalCrear, setModalCrear] = useState(false);
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [miembrosSeleccionados, setMiembrosSeleccionados] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load all tasks
  useEffect(() => {
    api.get('/estudiante/tareas').then(r => setTareas(r.data));
  }, []);

  // Load groups when task selected
  const cargarGrupos = async (tareaId) => {
    if (!tareaId) return;
    setLoading(true);
    try {
      const [gRes, cRes] = await Promise.all([
        api.get(`/estudiante/grupos/${tareaId}`),
        api.get(`/estudiante/grupos/${tareaId}/companeros`)
      ]);
      setGrupos(gRes.data.grupos);
      setMiGrupoId(gRes.data.mi_grupo_id);
      setCompaneros(cRes.data);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarTarea = (tarea) => {
    setTareaSeleccionada(tarea);
    setGrupos([]);
    setMiGrupoId(null);
    setMiembrosSeleccionados([]);
    setError('');
    cargarGrupos(tarea.id);
  };

  const toggleMiembro = (id) => {
    setMiembrosSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const crearGrupo = async (e) => {
    e.preventDefault();
    if (!nombreGrupo.trim()) return;
    setError('');
    setSaving(true);
    try {
      await api.post('/estudiante/grupos', {
        tarea_id: tareaSeleccionada.id,
        nombre_grupo: nombreGrupo.trim(),
        miembros: miembrosSeleccionados
      });
      setModalCrear(false);
      setNombreGrupo('');
      setMiembrosSeleccionados([]);
      cargarGrupos(tareaSeleccionada.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el grupo');
    } finally {
      setSaving(false);
    }
  };

  const salirGrupo = async (grupoId) => {
    if (!window.confirm('¿Seguro que deseas salir de este grupo?')) return;
    try {
      await api.delete(`/estudiante/grupos/${grupoId}/salir`);
      cargarGrupos(tareaSeleccionada.id);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al salir del grupo');
    }
  };

  const eliminarGrupo = async (grupoId) => {
    if (!window.confirm('¿Eliminar el grupo? Todos los miembros serán removidos.')) return;
    try {
      await api.delete(`/estudiante/grupos/${grupoId}`);
      cargarGrupos(tareaSeleccionada.id);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar el grupo');
    }
  };

  const miGrupo = grupos.find(g => g.id === miGrupoId);
  const soyCreador = miGrupo && miGrupo.creado_por === estudianteId;

  return (
    <>
      <PageHeader
        num="06"
        eyebrow="Trabajo colaborativo"
        title={<>Grupos de <span className="display-italic">trabajo</span></>}
        lead="Cree grupos con sus compañeros para tareas específicas. Un estudiante solo puede pertenecer a un grupo por tarea."
      />

      {/* Selector de tarea */}
      <div className="section-head">
        <h2>Seleccione una tarea</h2>
        <span className="count">{tareas.length} tareas</span>
      </div>

      {tareas.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--line-strong)', marginBottom: '2rem' }}>
          <p className="display-italic" style={{ color: 'var(--ink-light)' }}>No hay tareas asignadas</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginBottom: '2.5rem' }}>
        {tareas.map(t => (
          <button
            key={t.id}
            onClick={() => seleccionarTarea(t)}
            style={{
              textAlign: 'left', padding: '1rem 1.2rem', border: '1px solid var(--line)',
              borderLeft: `3px solid ${tareaSeleccionada?.id === t.id ? 'var(--ink)' : 'transparent'}`,
              background: tareaSeleccionada?.id === t.id ? 'var(--paper-dark)' : 'var(--paper)',
              borderRadius: '2px', cursor: 'pointer', transition: 'all .15s'
            }}
          >
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: '.95rem' }}>{t.titulo}</div>
            <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
              {t.materia_codigo} · {t.materia_nombre}
              {t.fecha_entrega && ` · Entrega: ${formatFecha(t.fecha_entrega)}`}
            </div>
          </button>
        ))}
      </div>

      {/* Sección de grupos para la tarea seleccionada */}
      {tareaSeleccionada && (
        <>
          <div className="section-head">
            <h2>Grupos — {tareaSeleccionada.titulo}</h2>
            {!miGrupoId && (
              <button className="btn btn-primary" onClick={() => { setModalCrear(true); setError(''); setMiembrosSeleccionados([]); setNombreGrupo(''); }}>
                ＋ Crear grupo
              </button>
            )}
          </div>

          {!miGrupoId && (
            <div style={{ marginBottom: '1rem', padding: '.75rem 1rem', background: 'var(--paper-dark)', borderRadius: '2px', fontSize: '.84rem', color: 'var(--ink-light)', borderLeft: '3px solid var(--gold)' }}>
              No perteneces a ningún grupo en esta tarea. Puedes crear uno o esperar a que un compañero te invite.
            </div>
          )}

          {miGrupoId && miGrupo && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem 1.2rem', background: 'rgba(22,163,74,.07)', border: '1px solid rgba(22,163,74,.25)', borderRadius: '2px', borderLeft: '3px solid var(--forest)' }}>
              <div style={{ fontWeight: 600, marginBottom: '.3rem' }}>Tu grupo: <span style={{ fontFamily: 'var(--serif)', fontSize: '1rem' }}>{miGrupo.nombre_grupo}</span></div>
              <div style={{ fontSize: '.8rem', color: 'var(--ink-light)', marginBottom: '.8rem' }}>
                {miGrupo.total_miembros} miembro(s) · Creado por {miGrupo.creador_nombre} {miGrupo.creador_apellido}
              </div>
              <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
                {miGrupo.miembros.map(m => (
                  <span key={m.estudiante_id} style={{ padding: '.3rem .7rem', background: 'var(--paper)', borderRadius: '20px', fontSize: '.8rem', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--ink-xlight)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 700, color: 'var(--ink)' }}>
                      {m.nombre[0]}{m.apellido[0]}
                    </span>
                    {m.nombre} {m.apellido}
                    {m.estudiante_id === estudianteId && <span style={{ color: 'var(--forest)', fontSize: '.7rem' }}>(tú)</span>}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '.75rem' }}>
                <button className="btn btn-ghost" style={{ fontSize: '.78rem', color: 'var(--crimson)' }} onClick={() => salirGrupo(miGrupoId)}>
                  Salir del grupo
                </button>
                {soyCreador && (
                  <button className="btn btn-ghost" style={{ fontSize: '.78rem', color: 'var(--crimson)' }} onClick={() => eliminarGrupo(miGrupoId)}>
                    Eliminar grupo
                  </button>
                )}
              </div>
            </div>
          )}

          {loading && <p style={{ color: 'var(--ink-light)' }}>Cargando grupos...</p>}

          {!loading && grupos.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--line-strong)' }}>
              <p className="display-italic" style={{ color: 'var(--ink-light)' }}>Sin grupos creados aún</p>
            </div>
          )}

          {!loading && grupos.map((g, idx) => (
            <div key={g.id} className="card" style={{ marginBottom: '.85rem', borderLeft: g.id === miGrupoId ? '3px solid var(--forest)' : '3px solid transparent' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: '1rem', alignItems: 'start' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', color: 'var(--ink-xlight)', fontStyle: 'italic' }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--serif)', fontSize: '1rem', marginBottom: '.3rem' }}>
                    {g.nombre_grupo}
                    {g.id === miGrupoId && <span className="chip chip-forest" style={{ marginLeft: '.5rem', fontSize: '.65rem' }}>Mi grupo</span>}
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--ink-light)', marginBottom: '.6rem' }}>
                    Creado por {g.creador_nombre} {g.creador_apellido} · {g.total_miembros} miembro(s)
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    {(g.miembros || []).map(m => (
                      <span key={m.estudiante_id} style={{ padding: '.25rem .6rem', background: 'var(--paper-dark)', borderRadius: '20px', fontSize: '.76rem', border: '1px solid var(--line)' }}>
                        {m.nombre} {m.apellido}
                        {m.estudiante_id === estudianteId && <span style={{ color: 'var(--forest)', marginLeft: '.3rem' }}>(tú)</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Modal: crear grupo */}
      <Modal open={modalCrear} onClose={() => setModalCrear(false)} title="Crear nuevo grupo" maxWidth="580px">
        <form onSubmit={crearGrupo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="label">Nombre del grupo *</label>
            <input className="input" value={nombreGrupo} onChange={e => setNombreGrupo(e.target.value)} required placeholder="Ej: Equipo Alpha" />
          </div>

          <div>
            <label className="label">Seleccionar compañeros</label>
            <div style={{ fontSize: '.78rem', color: 'var(--ink-light)', marginBottom: '.6rem' }}>
              Usted quedará como creador del grupo. Los compañeros con <span style={{ color: 'var(--crimson)' }}>✗</span> ya pertenecen a otro grupo en esta tarea.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', maxHeight: '260px', overflowY: 'auto', padding: '.25rem', border: '1px solid var(--line)', borderRadius: '2px' }}>
              {companeros.length === 0 && (
                <p style={{ color: 'var(--ink-light)', padding: '.75rem', textAlign: 'center', fontSize: '.85rem' }}>Sin compañeros inscritos en esta materia.</p>
              )}
              {companeros.map(c => {
                const ocupado = c.ya_en_grupo;
                const seleccionado = miembrosSeleccionados.includes(c.estudiante_id);
                return (
                  <label
                    key={c.estudiante_id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.6rem .75rem',
                      background: seleccionado ? 'var(--paper-dark)' : 'transparent',
                      borderRadius: '2px', cursor: ocupado ? 'not-allowed' : 'pointer',
                      opacity: ocupado ? .5 : 1, userSelect: 'none'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={seleccionado}
                      disabled={ocupado}
                      onChange={() => !ocupado && toggleMiembro(c.estudiante_id)}
                      style={{ accentColor: 'var(--ink)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{c.nombre} {c.apellido}</div>
                      <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)' }}>{c.codigo_estudiante}</div>
                    </div>
                    {ocupado && <span style={{ fontSize: '.72rem', color: 'var(--crimson)' }}>Ya en un grupo</span>}
                  </label>
                );
              })}
            </div>
            {miembrosSeleccionados.length > 0 && (
              <div style={{ marginTop: '.5rem', fontSize: '.78rem', color: 'var(--ink-light)' }}>
                {miembrosSeleccionados.length} compañero(s) seleccionado(s) + tú = {miembrosSeleccionados.length + 1} miembro(s) en total
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: '.75rem 1rem', background: 'rgba(220,38,38,.07)', borderLeft: '3px solid var(--crimson)', borderRadius: '2px', fontSize: '.84rem', color: 'var(--crimson)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', paddingTop: '.25rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setModalCrear(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !nombreGrupo.trim()}>
              {saving ? 'Creando...' : 'Crear grupo'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
