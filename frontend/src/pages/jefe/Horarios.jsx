import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const EMPTY = {
  materia_id: '',
  docente_id: '',
  dia_semana: 'Lunes',
  hora_inicio: '08:00',
  hora_fin: '10:00',
  aula: '',
  periodo: '2026-I'
};

export default function JefeHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [modal, setModal] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [asigForm, setAsigForm] = useState({ materia_id: '', docente_id: '' });
  const [saving, setSaving] = useState(false);
  const [filtroDia, setFiltroDia] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [editingId, setEditingId] = useState(null);

  const cargar = () => Promise.all([
    api.get('/jefe/horarios').then((r) => setHorarios(r.data)),
    api.get('/jefe/materias').then((r) => setMaterias(r.data)),
    api.get('/jefe/docentes').then((r) => setDocentes(r.data))
  ]);

  useEffect(() => {
    cargar();
  }, []);

  const crearHorario = async () => {
    if (!form.materia_id || !form.docente_id) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/jefe/horarios/${editingId}`, form);
      } else {
        await api.post('/jefe/horarios', form);
      }
      setModal(false);
      setEditingId(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo guardar el horario');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('Eliminar este horario?')) return;
    await api.delete(`/jefe/horarios/${id}`);
    cargar();
  };

  const asignarDocente = async () => {
    if (!asigForm.materia_id) return;
    setSaving(true);
    try {
      await api.post('/jefe/asignar-docente', asigForm);
      setModalAsignar(false);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo asignar el docente');
    } finally {
      setSaving(false);
    }
  };

  const filtrados = filtroDia ? horarios.filter((h) => h.dia_semana === filtroDia) : horarios;
  const filtradosPorGrupo = filtroGrupo
    ? filtrados.filter((h) => String(h.materia_grupo || h.grupo || '') === String(filtroGrupo))
    : filtrados;
  const f = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const horariosPorDia = DIAS.map((dia) => ({
    dia,
    items: filtradosPorGrupo.filter((h) => h.dia_semana === dia)
  }));
  const grupos = [...new Set(materias.map((m) => m.grupo).filter(Boolean))].sort();

  const abrirEdicion = (horario) => {
    setEditingId(horario.id);
    setForm({
      materia_id: String(horario.materia_id),
      docente_id: String(horario.docente_id),
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio?.slice(0, 5) || '08:00',
      hora_fin: horario.hora_fin?.slice(0, 5) || '10:00',
      aula: horario.aula || '',
      periodo: horario.periodo || '2026-I'
    });
    setModal(true);
  };

  return (
    <>
      <PageHeader
        num="06"
        eyebrow="Planificacion academica"
        title={<>Horarios y <span className="display-italic">asignaciones</span></>}
        lead="Asigne docentes a materias y configure los horarios de clases del periodo academico."
      />

      <div className="flex gap-4 mb-6" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div className="flex gap-3">
          <select
            value={filtroDia}
            onChange={(e) => setFiltroDia(e.target.value)}
            style={{
              padding: '.65rem 1rem',
              border: '1px solid var(--line-strong)',
              borderRadius: '2px',
              background: 'var(--paper-light)',
              fontFamily: 'var(--mono)',
              fontSize: '.85rem'
            }}
          >
            <option value="">Todos los dias</option>
            {DIAS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select
            value={filtroGrupo}
            onChange={(e) => setFiltroGrupo(e.target.value)}
            style={{
              padding: '.65rem 1rem',
              border: '1px solid var(--line-strong)',
              borderRadius: '2px',
              background: 'var(--paper-light)',
              fontFamily: 'var(--mono)',
              fontSize: '.85rem'
            }}
          >
            <option value="">Todos los grupos</option>
            {grupos.map((g) => <option key={g} value={g}>Grupo {g}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setAsigForm({ materia_id: '', docente_id: '' });
              setModalAsignar(true);
            }}
          >
            Asignar docente a materia
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY);
              setModal(true);
            }}
          >
            + Nuevo horario
          </button>
        </div>
      </div>

      {materias.filter((m) => !m.docente_nombre).length > 0 && (
        <div
          style={{
            padding: '1rem 1.25rem',
            background: '#fff8e1',
            border: '1px solid var(--gold)',
            borderRadius: '2px',
            marginBottom: '1.5rem',
            fontSize: '.9rem'
          }}
        >
          <strong>Materias sin docente asignado:</strong>{' '}
          {materias.filter((m) => !m.docente_nombre).map((m) => `${m.nombre} - Grupo ${m.grupo}`).join(', ')}
        </div>
      )}

      <div
        className="card"
        style={{
          padding: '1rem',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,247,250,0.95))',
          border: '1px solid rgba(18, 50, 89, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 18px 34px rgba(18, 50, 89, 0.06)'
        }}
      >
        <div className="section-head" style={{ marginBottom: '1rem' }}>
          <h2>Calendario semanal</h2>
          <span className="count">{filtradosPorGrupo.length} bloques</span>
        </div>

        {filtradosPorGrupo.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic', color: 'var(--ink-light)' }}>
            Sin horarios registrados
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              alignItems: 'start'
            }}
          >
            {horariosPorDia.map(({ dia, items }) => (
              <div
                key={dia}
                style={{
                  minHeight: '220px',
                  borderRadius: '14px',
                  background: items.length
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,244,235,0.9))'
                    : 'linear-gradient(180deg, rgba(248,250,253,0.95), rgba(245,247,250,0.9))',
                  border: '1px solid rgba(18, 50, 89, 0.08)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    padding: '.9rem 1rem',
                    background: 'linear-gradient(135deg, rgba(18, 50, 89, 0.96), rgba(38, 84, 146, 0.92))',
                    color: 'white'
                  }}
                >
                  <div className="text-mono" style={{ fontSize: '.68rem', letterSpacing: '.12em', opacity: 0.7 }}>
                    DIA
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginTop: '.15rem' }}>{dia}</div>
                </div>

                <div style={{ display: 'grid', gap: '.75rem', padding: '.9rem' }}>
                  {items.length === 0 ? (
                    <div style={{ padding: '.8rem', color: 'var(--ink-light)', fontStyle: 'italic', fontSize: '.88rem' }}>
                      Sin clases programadas
                    </div>
                  ) : (
                    items.map((h) => (
                      <div
                        key={h.id}
                        style={{
                          padding: '.9rem',
                          borderRadius: '12px',
                          background: 'white',
                          border: '1px solid rgba(18, 50, 89, 0.08)',
                          boxShadow: '0 10px 22px rgba(18, 50, 89, 0.05)',
                          display: 'grid',
                          gap: '.45rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.75rem', alignItems: 'center' }}>
                          <span className="chip chip-ink">{h.hora_inicio?.slice(0, 5)} - {h.hora_fin?.slice(0, 5)}</span>
                          <span className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>{h.periodo || '-'}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '.95rem', lineHeight: 1.25 }}>
                          {h.materia_nombre} - Grupo {h.materia_grupo || '-'}
                        </div>
                        <div className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>
                          {h.materia_codigo}
                        </div>
                        <div style={{ fontSize: '.84rem', color: 'var(--ink)' }}>
                          Docente: {h.docente_nombre} {h.docente_apellido}
                        </div>
                        <div style={{ fontSize: '.84rem', color: 'var(--ink-light)' }}>
                          Aula: {h.aula || '-'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '.2rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => abrirEdicion(h)} style={{ marginRight: '.5rem' }}>
                            Editar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => eliminar(h.id)}>Eliminar</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <div className="section-head">
          <h2>Materias y docentes asignados</h2>
          <span className="count">{materias.length} materias</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '.75rem', marginTop: '1rem' }}>
          {materias.map((m) => (
            <div
              key={m.id}
              style={{
                padding: '1rem 1.25rem',
                background: 'var(--paper-dark)',
                borderRadius: '2px',
                borderLeft: `3px solid ${m.docente_nombre ? 'var(--forest)' : 'var(--crimson)'}`
              }}
            >
              <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 600 }}>
                {m.nombre} - Grupo {m.grupo}
              </div>
              <div className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)', marginTop: '.2rem' }}>
                {m.codigo} · Sem. {m.semestre} · {m.creditos} cred.
              </div>
              <div style={{ marginTop: '.5rem', fontSize: '.85rem' }}>
                {m.docente_nombre ? (
                  <span style={{ color: 'var(--forest)' }}>- {m.docente_nombre} {m.docente_apellido}</span>
                ) : (
                  <span style={{ color: 'var(--crimson)', fontStyle: 'italic' }}>Sin docente asignado</span>
                )}
              </div>
              <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', marginTop: '.3rem' }}>
                {m.total_estudiantes} estudiantes inscritos
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setEditingId(null); }} title={editingId ? 'Editar horario de clase' : 'Nuevo horario de clase'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Materia *</label>
            <select className="form-input" value={form.materia_id} onChange={(e) => f('materia_id', e.target.value)}>
              <option value="">- Seleccionar -</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre} ({m.codigo}) - Grupo {m.grupo}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Docente *</label>
            <select className="form-input" value={form.docente_id} onChange={(e) => f('docente_id', e.target.value)}>
              <option value="">- Seleccionar -</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre} {d.apellido}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Dia</label>
            <select className="form-input" value={form.dia_semana} onChange={(e) => f('dia_semana', e.target.value)}>
              {DIAS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Aula</label>
            <input className="form-input" value={form.aula} onChange={(e) => f('aula', e.target.value)} placeholder="Ej: Aula 101" />
          </div>
          <div>
            <label className="form-label">Hora inicio</label>
            <input className="form-input" type="time" value={form.hora_inicio} onChange={(e) => f('hora_inicio', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Hora fin</label>
            <input className="form-input" type="time" value={form.hora_fin} onChange={(e) => f('hora_fin', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Periodo</label>
            <input className="form-input" value={form.periodo} onChange={(e) => f('periodo', e.target.value)} placeholder="Ej: 2026-I" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => { setModal(false); setEditingId(null); }}>Cancelar</button>
          <button className="btn btn-primary" onClick={crearHorario} disabled={saving}>
            {saving ? 'Guardando...' : editingId ? 'Actualizar horario' : 'Guardar horario'}
          </button>
        </div>
      </Modal>

      <Modal open={modalAsignar} onClose={() => setModalAsignar(false)} title="Asignar docente a materia">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Materia *</label>
            <select
              className="form-input"
              value={asigForm.materia_id}
              onChange={(e) => setAsigForm((p) => ({ ...p, materia_id: e.target.value }))}
            >
              <option value="">- Seleccionar -</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} - Grupo {m.grupo} - actual: {m.docente_nombre || 'ninguno'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Docente</label>
            <select
              className="form-input"
              value={asigForm.docente_id}
              onChange={(e) => setAsigForm((p) => ({ ...p, docente_id: e.target.value }))}
            >
              <option value="">- Sin docente -</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre} {d.apellido} - {d.especialidad || 'General'}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setModalAsignar(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={asignarDocente} disabled={saving}>
            {saving ? 'Asignando...' : 'Asignar'}
          </button>
        </div>
      </Modal>
    </>
  );
}
