import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import mammoth from 'mammoth';

const ESTADO_LABEL = {
  presente: 'Presente',
  falta: 'Falta',
  permiso: 'Permiso',
  tarde: 'Tarde',
  sin_registro: 'Sin registro'
};

const ESTADO_COLOR = {
  presente: 'chip-forest',
  falta: 'chip-crimson',
  permiso: 'chip-gold',
  tarde: 'chip-ink',
  sin_registro: 'chip-ink'
};

const SOLICITUD_TIPO = {
  carta_permiso: 'Carta de permiso',
  justificacion: 'Justificacion'
};

const EMPTY_EDIT = {
  id: null,
  estado: 'permiso',
  justificacion: '',
  respaldo: null
};

const EMPTY_REQUEST = {
  estudiante_id: '',
  materia_id: '',
  tipo: 'carta_permiso',
  fecha_desde: new Date().toISOString().slice(0, 10),
  fecha_hasta: new Date().toISOString().slice(0, 10),
  horas_detalle: '',
  detalle: '',
  documento: null
};

const formatDateEs = (value, withWeekday = false) => {
  if (!value) return '';
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(
    'es-ES',
    withWeekday
      ? { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' }
  );
};

const today = new Date().toISOString().slice(0, 10);

export default function JefeAsistencias() {
  const [tab, setTab] = useState('reportes');
  const [materias, setMaterias] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudiantesMateria, setEstudiantesMateria] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [reporte, setReporte] = useState({
    registros: [],
    sesiones: [],
    resumen: { total: 0, presente: 0, falta: 0, permiso: 0, tarde: 0 }
  });
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
  const [modalDoc, setModalDoc] = useState(null); // { url, nombre }
  const [modalEstado, setModalEstado] = useState(null); // { solicitud, accion: 'aprobado'|'rechazado' }
  const [obsJefe, setObsJefe] = useState('');
  const [savingEstado, setSavingEstado] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_EDIT);
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST);
  const [saving, setSaving] = useState(false);
  const [savingRequest, setSavingRequest] = useState(false);
  const [error, setError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [detailSearch, setDetailSearch] = useState('');
  const [inscritosReporte, setInscritosReporte] = useState([]);
  const [filters, setFilters] = useState({
    materia_id: '',
    estado: '',
    periodo: 'dia',
    fecha: today,
    desde: today,
    hasta: today
  });

  const params = useMemo(() => {
    const next = {};
    if (filters.materia_id) next.materia_id = filters.materia_id;
    if (filters.estado) next.estado = filters.estado;
    if (filters.periodo === 'rango') {
      next.periodo = 'rango';
      next.desde = filters.desde;
      next.hasta = filters.hasta;
    } else {
      next.periodo = filters.periodo;
      next.fecha = filters.fecha;
    }
    return next;
  }, [filters]);

  const cargarBase = async () => {
    const [materiasResp, estudiantesResp] = await Promise.all([
      api.get('/jefe/materias'),
      api.get('/jefe/estudiantes')
    ]);
    setMaterias(materiasResp.data);
    setEstudiantes(estudiantesResp.data);
  };

  const cargarReportes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/jefe/asistencias', { params });
      setReporte(data);
    } finally {
      setLoading(false);
    }
  };

  const cargarSolicitudes = async () => {
    setLoadingSolicitudes(true);
    try {
      const { data } = await api.get('/jefe/solicitudes-permiso');
      setSolicitudes(data);
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  useEffect(() => {
    Promise.all([cargarBase(), cargarSolicitudes()]).then(() => cargarReportes());
  }, []);

  useEffect(() => {
    cargarReportes();
  }, [params]);

  useEffect(() => {
    if (!filters.materia_id) {
      setInscritosReporte([]);
      return;
    }
    api.get(`/jefe/materias/${filters.materia_id}/estudiantes`)
      .then((resp) => setInscritosReporte(resp.data?.inscritos || []))
      .catch(() => setInscritosReporte([]));
  }, [filters.materia_id]);

  useEffect(() => {
    if (!requestForm.materia_id) {
      setEstudiantesMateria([]);
      setStudentSearch('');
      return;
    }

    api.get(`/jefe/materias/${requestForm.materia_id}/estudiantes`)
      .then((resp) => setEstudiantesMateria(resp.data?.inscritos || []))
      .catch(() => setEstudiantesMateria([]));
  }, [requestForm.materia_id]);

  useEffect(() => {
    if (!requestForm.estudiante_id) return;
    if (!estudiantesMateria.some((student) => String(student.id) === String(requestForm.estudiante_id))) {
      setRequestForm((prev) => ({ ...prev, estudiante_id: '' }));
    }
  }, [estudiantesMateria, requestForm.estudiante_id]);

  const openEdit = (row) => {
    setError('');
    setForm({
      id: row.id,
      estado: row.estado === 'tarde' ? 'tarde' : 'permiso',
      justificacion: row.justificacion || '',
      respaldo: null,
      original: row
    });
    setModalOpen(true);
  };

  const closeEdit = () => {
    setModalOpen(false);
    setForm(EMPTY_EDIT);
    setError('');
  };

  const saveEdit = async () => {
    if (!form.id) return;
    if (form.estado === 'permiso' && !form.respaldo) {
      setError('Debe adjuntar un documento de respaldo para registrar permiso.');
      return;
    }
    if (form.estado === 'tarde' && !String(form.justificacion || '').trim()) {
      setError('Debe escribir un justificativo para marcar tarde.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const body = new FormData();
      body.append('estado', form.estado);
      body.append('justificacion', form.justificacion || '');
      if (form.respaldo) body.append('respaldo', form.respaldo);

      await api.put(`/jefe/asistencias/${form.id}`, body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      closeEdit();
      await cargarReportes();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar la asistencia');
    } finally {
      setSaving(false);
    }
  };

  const saveRequest = async () => {
    if (!requestForm.estudiante_id || !requestForm.materia_id || !requestForm.fecha_desde || !requestForm.fecha_hasta) {
      setRequestError('Debe completar estudiante, materia y rango de fechas.');
      return;
    }
    if (requestForm.tipo === 'carta_permiso' && !requestForm.documento) {
      setRequestError('Debe adjuntar la carta de permiso.');
      return;
    }
    if (requestForm.tipo === 'justificacion' && !String(requestForm.detalle || '').trim()) {
      setRequestError('Debe escribir la justificacion.');
      return;
    }

    setSavingRequest(true);
    setRequestError('');
    try {
      const body = new FormData();
      Object.entries(requestForm).forEach(([key, value]) => {
        if (key === 'documento') return;
        body.append(key, value || '');
      });
      if (requestForm.documento) body.append('documento', requestForm.documento);

      await api.post('/jefe/solicitudes-permiso', body, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setRequestForm({
        ...EMPTY_REQUEST,
        fecha_desde: today,
        fecha_hasta: today
      });
      await cargarSolicitudes();
    } catch (err) {
      setRequestError(err.response?.data?.error || 'No se pudo registrar la solicitud');
    } finally {
      setSavingRequest(false);
    }
  };

  const deleteRequest = async (id) => {
    if (!confirm('Eliminar esta solicitud de permiso o justificacion?')) return;
    try {
      await api.delete(`/jefe/solicitudes-permiso/${id}`);
      await cargarSolicitudes();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar la solicitud');
    }
  };

  const confirmarEstado = (solicitud, accion) => {
    setObsJefe('');
    setModalEstado({ solicitud, accion });
  };

  const guardarEstado = async () => {
    if (!modalEstado) return;
    setSavingEstado(true);
    try {
      await api.put(`/jefe/solicitudes-permiso/${modalEstado.solicitud.id}/estado`, {
        estado: modalEstado.accion,
        observacion_jefe: obsJefe
      });
      setModalEstado(null);
      await cargarSolicitudes();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar la solicitud');
    } finally {
      setSavingEstado(false);
    }
  };

  const estudiantesFiltrados = estudiantesMateria.filter((student) => {
    const target = studentSearch.trim().toLowerCase();
    if (!target) return true;
    return (
      `${student.nombre} ${student.apellido}`.toLowerCase().includes(target) ||
      String(student.codigo_estudiante || '').toLowerCase().includes(target) ||
      String(student.email || '').toLowerCase().includes(target)
    );
  });

  const registrosVisibles = useMemo(() => {
    const rows = [...(reporte.registros || [])];
    const query = detailSearch.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => (
      `${row.nombre} ${row.apellido}`.toLowerCase().includes(query) ||
      `${row.apellido} ${row.nombre}`.toLowerCase().includes(query) ||
      String(row.codigo_estudiante || '').toLowerCase().includes(query) ||
      String(row.materia_nombre || '').toLowerCase().includes(query)
    ));
  }, [reporte.registros, detailSearch]);

  const resumenEstudiantes = useMemo(() => {
    const rows = reporte.registros || [];
    const byStudent = new Map();

    rows.forEach((row) => {
      if (!byStudent.has(row.estudiante_id)) {
        byStudent.set(row.estudiante_id, {
          id: row.id,
          estudiante_id: row.estudiante_id,
          codigo_estudiante: row.codigo_estudiante,
          nombre: row.nombre,
          apellido: row.apellido,
          materia_nombre: row.materia_nombre,
          materia_grupo: row.materia_grupo,
          presente: 0,
          falta: 0,
          permiso: 0,
          tarde: 0,
          total: 0,
          ultimo_estado: row.estado,
          ultima_fecha: row.fecha,
          justificacion: row.justificacion || '',
          respaldo_url: row.respaldo_url || ''
        });
      }
      const current = byStudent.get(row.estudiante_id);
      current.total += 1;
      current[row.estado] += 1;
      if (!current.ultima_fecha || row.fecha >= current.ultima_fecha) {
        current.id = row.id;
        current.ultima_fecha = row.fecha;
        current.ultimo_estado = row.estado;
        current.justificacion = row.justificacion || '';
        current.respaldo_url = row.respaldo_url || '';
      }
    });

    if (filters.periodo === 'dia' && filters.materia_id && inscritosReporte.length) {
      return inscritosReporte
        .map((student) => {
          const found = rows.find((row) => Number(row.estudiante_id) === Number(student.id));
          if (found) {
            return {
              id: found.id,
              ...byStudent.get(found.estudiante_id),
              display_estado: found.estado
            };
          }
          return {
            estudiante_id: student.id,
            codigo_estudiante: student.codigo_estudiante,
            nombre: student.nombre,
            apellido: student.apellido,
            materia_nombre: materias.find((m) => String(m.id) === String(filters.materia_id))?.nombre || '',
            materia_grupo: materias.find((m) => String(m.id) === String(filters.materia_id))?.grupo || '',
            presente: 0,
            falta: 0,
            permiso: 0,
            tarde: 0,
            total: 0,
            ultimo_estado: 'sin_registro',
            ultima_fecha: filters.fecha,
            display_estado: 'sin_registro',
            justificacion: '',
            respaldo_url: ''
          };
        })
        .filter((row) => {
          const query = detailSearch.trim().toLowerCase();
          if (!query) return true;
          return (
            `${row.nombre} ${row.apellido}`.toLowerCase().includes(query) ||
            `${row.apellido} ${row.nombre}`.toLowerCase().includes(query) ||
            String(row.codigo_estudiante || '').toLowerCase().includes(query)
          );
        });
    }

    const values = Array.from(byStudent.values());
    const query = detailSearch.trim().toLowerCase();
    return values.filter((row) => {
      if (!query) return true;
      return (
        `${row.nombre} ${row.apellido}`.toLowerCase().includes(query) ||
        `${row.apellido} ${row.nombre}`.toLowerCase().includes(query) ||
        String(row.codigo_estudiante || '').toLowerCase().includes(query) ||
        String(row.materia_nombre || '').toLowerCase().includes(query)
      );
    });
  }, [reporte.registros, inscritosReporte, filters.periodo, filters.materia_id, filters.fecha, materias, detailSearch]);

  return (
    <>
      <PageHeader
        num="06"
        eyebrow="Supervision academica"
        title={<>Asistencias <span className="display-italic">y permisos</span></>}
        lead="Controle la asistencia estudiantil y gestione cartas de permiso o justificaciones visibles para los docentes al pasar lista."
      />

      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
        <button className={`btn ${tab === 'reportes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('reportes')}>
          Reportes
        </button>
        <button className={`btn ${tab === 'permisos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('permisos')}>
          Permisos
        </button>
      </div>

      {tab === 'reportes' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="form-label">Materia</label>
              <select className="form-input" value={filters.materia_id} onChange={(e) => setFilters((p) => ({ ...p, materia_id: e.target.value }))}>
                <option value="">Todas</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre} ({m.codigo}) - G{m.grupo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Estado</label>
              <select className="form-input" value={filters.estado} onChange={(e) => setFilters((p) => ({ ...p, estado: e.target.value }))}>
                <option value="">Todos</option>
                {Object.entries(ESTADO_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Periodo</label>
              <select className="form-input" value={filters.periodo} onChange={(e) => setFilters((p) => ({ ...p, periodo: e.target.value }))}>
                <option value="dia">Diario</option>
                <option value="semana">Semanal</option>
                <option value="mes">Mensual</option>
                <option value="rango">Rango</option>
              </select>
            </div>
            {filters.periodo === 'rango' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div>
                  <label className="form-label">Desde</label>
                  <input className="form-input" type="date" value={filters.desde} onChange={(e) => setFilters((p) => ({ ...p, desde: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Hasta</label>
                  <input className="form-input" type="date" value={filters.hasta} onChange={(e) => setFilters((p) => ({ ...p, hasta: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div>
                <label className="form-label">Fecha base</label>
                <input className="form-input" type="date" value={filters.fecha} onChange={(e) => setFilters((p) => ({ ...p, fecha: e.target.value }))} />
              </div>
            )}
          </div>

          <div className="grid-4 mb-6">
            {['presente', 'falta', 'permiso', 'tarde'].map((estado, index) => {
              const colors = ['var(--success)', 'var(--danger)', 'var(--warning)', 'var(--blue-600)'];
              return (
                <div key={estado} className="card" style={{ padding: '1rem', borderTop: `4px solid ${colors[index]}` }}>
                  <div className="text-serif" style={{ fontSize: '2rem', lineHeight: 1 }}>{reporte.resumen?.[estado] || 0}</div>
                  <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '.35rem' }}>
                    {ESTADO_LABEL[estado]}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="card"
            style={{
              padding: '1.25rem',
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, rgba(18, 50, 89, 0.98), rgba(28, 74, 128, 0.94))',
              color: 'white',
              borderRadius: '18px',
              boxShadow: '0 20px 40px rgba(18, 50, 89, 0.14)'
            }}
          >
            <div className="text-mono" style={{ fontSize: '.7rem', letterSpacing: '.14em', opacity: 0.75 }}>
              REPORTE DE ASISTENCIA ESTUDIANTIL
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr repeat(3, .8fr)', gap: '1rem', alignItems: 'end', marginTop: '.55rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.7rem', lineHeight: 1.05 }}>
                  {filters.periodo === 'rango'
                    ? `${formatDateEs(filters.desde)} al ${formatDateEs(filters.hasta)}`
                    : formatDateEs(filters.fecha, true)}
                </div>
                <div style={{ marginTop: '.35rem', opacity: 0.86, fontSize: '.95rem' }}>
                  Visualizacion clara por sesiones, estados y estudiantes con opcion de edicion inmediata.
                </div>
              </div>
              <div>
                <div className="text-serif" style={{ fontSize: '1.8rem' }}>{reporte.resumen?.total || 0}</div>
                <div className="text-mono" style={{ fontSize: '.68rem', opacity: 0.72 }}>ASISTENCIAS REGISTRADAS</div>
              </div>
              <div>
                <div className="text-serif" style={{ fontSize: '1.8rem' }}>{inscritosReporte.length || 0}</div>
                <div className="text-mono" style={{ fontSize: '.68rem', opacity: 0.72 }}>ESTUDIANTES DE LA MATERIA</div>
              </div>
              <div>
                <div className="text-serif" style={{ fontSize: '1.8rem' }}>
                  {reporte.resumen?.total ? `${Math.round(((reporte.resumen?.presente || 0) / reporte.resumen.total) * 100)}%` : '0%'}
                </div>
                <div className="text-mono" style={{ fontSize: '.68rem', opacity: 0.72 }}>ASISTENCIA</div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-dots"><span /><span /><span /></div>
          ) : (
            <>
              <div className="section-head" style={{ marginBottom: '1rem' }}>
                <h2>Asistencia de estudiantes</h2>
                <span className="count">{resumenEstudiantes.length || 0} estudiantes</span>
              </div>

              <div className="card" style={{ padding: '1rem', marginBottom: '1rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,248,250,0.96))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', letterSpacing: '.08em' }}>
                      MATERIA Y FECHA
                    </div>
                    <div style={{ fontSize: '.95rem', marginTop: '.2rem' }}>
                      {filters.materia_id
                        ? `${materias.find((m) => String(m.id) === String(filters.materia_id))?.nombre || 'Materia seleccionada'} - ${filters.periodo === 'rango' ? `${formatDateEs(filters.desde)} al ${formatDateEs(filters.hasta)}` : formatDateEs(filters.fecha, true)}`
                        : 'Seleccione una materia para ver la asistencia de sus estudiantes.'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                    <input
                      className="form-input"
                      type="text"
                      value={detailSearch}
                      onChange={(e) => setDetailSearch(e.target.value)}
                      placeholder="Buscar estudiante, codigo o materia..."
                      style={{ minWidth: '280px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '.85rem' }}>
                {resumenEstudiantes.map((row) => (
                  <div
                    key={row.estudiante_id}
                    className="card"
                    style={{
                      padding: '1rem',
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 1fr auto',
                      gap: '1rem',
                      alignItems: 'center',
                      borderLeft: `4px solid ${
                        (row.display_estado || row.ultimo_estado) === 'presente'
                          ? 'var(--success)'
                          : (row.display_estado || row.ultimo_estado) === 'falta'
                            ? 'var(--danger)'
                            : (row.display_estado || row.ultimo_estado) === 'permiso'
                              ? 'var(--warning)'
                              : 'var(--blue-600)'
                      }`
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem' }}>
                        {row.apellido} {row.nombre}
                      </div>
                      <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)', marginTop: '.15rem' }}>
                        {row.codigo_estudiante} · {formatDateEs(row.ultima_fecha || filters.fecha)} · {row.materia_nombre} - G{row.materia_grupo}
                      </div>
                      <div style={{ fontSize: '.85rem', color: 'var(--ink-light)', marginTop: '.35rem' }}>
                        {filters.periodo === 'dia' ? 'Registro de asistencia del estudiante para la fecha seleccionada' : `Resumen acumulado en ${row.total} registro(s)`}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: '.4rem' }}>
                      <div>
                        <span className={`chip ${ESTADO_COLOR[row.display_estado || row.ultimo_estado] || 'chip-ink'}`}>
                          {ESTADO_LABEL[row.display_estado || row.ultimo_estado] || row.display_estado || row.ultimo_estado}
                        </span>
                      </div>
                      {filters.periodo === 'dia' ? (
                        <>
                          <div style={{ fontSize: '.85rem' }}>
                            <strong>Justificativo:</strong> {row.justificacion || 'Sin justificativo'}
                          </div>
                          <div style={{ fontSize: '.82rem' }}>
                            <strong>Respaldo:</strong>{' '}
                            {row.respaldo_url ? <a href={row.respaldo_url} target="_blank" rel="noreferrer">Ver archivo</a> : 'Sin respaldo'}
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                          <span className="chip chip-forest">{row.presente} presentes</span>
                          <span className="chip chip-crimson">{row.falta} faltas</span>
                          <span className="chip chip-gold">{row.permiso} permisos</span>
                          <span className="chip chip-ink">{row.tarde} tardes</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {row.id ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(row)}>
                          Cambiar a permiso/tarde
                        </button>
                      ) : (
                        <span className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>
                          Aun no registrado
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {resumenEstudiantes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
                    No hay estudiantes o registros que coincidan con el filtro aplicado.
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'permisos' && (
        <>
          <div className="grid-2 mb-6">
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="section-head">
                <h2>Nueva solicitud</h2>
                <span className="count">permiso o justificacion</span>
              </div>
              <div style={{ display: 'grid', gap: '.9rem', marginTop: '1rem' }}>
                <div>
                  <label className="form-label">Materia</label>
                  <select
                    className="form-input"
                    value={requestForm.materia_id}
                    onChange={(e) => setRequestForm((p) => ({ ...p, materia_id: e.target.value, estudiante_id: '' }))}
                  >
                    <option value="">Seleccione una materia</option>
                    {materias.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} ({m.codigo}) - Grupo {m.grupo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Buscar estudiante</label>
                  <input
                    className="form-input"
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder={requestForm.materia_id ? 'Buscar por nombre o codigo...' : 'Seleccione una materia primero'}
                    disabled={!requestForm.materia_id}
                  />
                </div>

                <div>
                  <label className="form-label">Estudiante</label>
                  <select
                    className="form-input"
                    value={requestForm.estudiante_id}
                    onChange={(e) => setRequestForm((p) => ({ ...p, estudiante_id: e.target.value }))}
                    disabled={!requestForm.materia_id}
                  >
                    <option value="">
                      {requestForm.materia_id ? 'Seleccione un estudiante inscrito' : 'Seleccione una materia primero'}
                    </option>
                    {estudiantesFiltrados.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.nombre} {student.apellido} - {student.codigo_estudiante}
                      </option>
                    ))}
                  </select>
                  {requestForm.materia_id && (
                    <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)', marginTop: '.35rem' }}>
                      {estudiantesFiltrados.length} estudiante(s) del grupo seleccionado
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">Tipo de solicitud</label>
                  <select className="form-input" value={requestForm.tipo} onChange={(e) => setRequestForm((p) => ({ ...p, tipo: e.target.value }))}>
                    <option value="carta_permiso">Carta de permiso</option>
                    <option value="justificacion">Justificacion</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <div>
                    <label className="form-label">Fecha desde</label>
                    <input className="form-input" type="date" value={requestForm.fecha_desde} onChange={(e) => setRequestForm((p) => ({ ...p, fecha_desde: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Fecha hasta</label>
                    <input className="form-input" type="date" value={requestForm.fecha_hasta} onChange={(e) => setRequestForm((p) => ({ ...p, fecha_hasta: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="form-label">Horas o dias solicitados</label>
                  <input
                    className="form-input"
                    type="text"
                    value={requestForm.horas_detalle}
                    onChange={(e) => setRequestForm((p) => ({ ...p, horas_detalle: e.target.value }))}
                    placeholder="Ej. 08:00-10:00 o 2 dias"
                  />
                </div>

                <div>
                  <label className="form-label">{requestForm.tipo === 'justificacion' ? 'Justificacion' : 'Detalle complementario'}</label>
                  <textarea
                    className="form-input"
                    rows="4"
                    value={requestForm.detalle}
                    onChange={(e) => setRequestForm((p) => ({ ...p, detalle: e.target.value }))}
                    placeholder={requestForm.tipo === 'justificacion' ? 'Describa la justificacion...' : 'Observaciones adicionales...'}
                  />
                </div>

                {requestForm.tipo === 'carta_permiso' && (
                  <div>
                    <label className="form-label">Documento Word o PDF</label>
                    <input type="file" className="form-input" onChange={(e) => setRequestForm((p) => ({ ...p, documento: e.target.files?.[0] || null }))} />
                  </div>
                )}

                {requestError && (
                  <div style={{ padding: '.85rem 1rem', border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: '2px' }}>
                    {requestError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={saveRequest} disabled={savingRequest}>
                    {savingRequest ? 'Guardando...' : 'Registrar solicitud'}
                  </button>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="section-head">
                <h2>Solicitudes cargadas</h2>
                <span className="count">{solicitudes.length} registros</span>
              </div>
              {loadingSolicitudes ? (
                <div className="loading-dots" style={{ marginTop: '2rem' }}><span /><span /><span /></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginTop: '1rem', maxHeight: '560px', overflowY: 'auto' }}>
                  {solicitudes.map((item) => {
                    const esEstudiante = item.registrado_rol === 'estudiante';
                    const estadoBorderColor = item.estado === 'aprobado' ? 'var(--success)' : item.estado === 'rechazado' ? 'var(--danger)' : 'var(--warning)';
                    return (
                    <div key={item.id} style={{ padding: '.9rem 1rem', background: 'var(--paper-dark)', borderRadius: '2px', borderLeft: `4px solid ${estadoBorderColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                            <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem' }}>
                              {item.estudiante_nombre} {item.estudiante_apellido}
                            </div>
                            {esEstudiante && (
                              <span className="chip chip-forest" style={{ fontSize: '.65rem' }}>Enviada por estudiante</span>
                            )}
                          </div>
                          <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>
                            {item.codigo_estudiante} · {item.materia_nombre} ({item.materia_codigo}) - G{item.materia_grupo}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className={`chip ${item.estado === 'aprobado' ? 'chip-forest' : item.estado === 'rechazado' ? 'chip-crimson' : 'chip-gold'}`} style={{ fontSize: '.7rem' }}>
                            {item.estado === 'aprobado' ? 'Aprobado' : item.estado === 'rechazado' ? 'Rechazado' : 'Pendiente'}
                          </span>
                          <span className={`chip ${item.tipo === 'carta_permiso' ? 'chip-gold' : 'chip-ink'}`}>
                            {SOLICITUD_TIPO[item.tipo] || item.tipo}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '.84rem', marginTop: '.55rem' }}>
                        {formatDateEs(item.fecha_desde)} {item.fecha_desde !== item.fecha_hasta ? `al ${formatDateEs(item.fecha_hasta)}` : ''}
                        {item.horas_detalle ? ` · ${item.horas_detalle}` : ''}
                      </div>
                      <div style={{ fontSize: '.84rem', color: 'var(--ink-light)', marginTop: '.45rem' }}>
                        {item.detalle || 'Sin detalle adicional'}
                      </div>
                      {item.observacion_jefe && (
                        <div style={{ fontSize: '.82rem', marginTop: '.4rem', padding: '.4rem .6rem', background: 'rgba(0,0,0,.06)', borderRadius: '2px', fontStyle: 'italic', color: 'var(--ink-light)' }}>
                          Obs. jefe: {item.observacion_jefe}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.6rem', fontSize: '.8rem', flexWrap: 'wrap', gap: '.5rem' }}>
                        <span>Registrado por {item.registrado_nombre} {item.registrado_apellido}</span>
                        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {item.documento_url
                            ? <button className="btn btn-outline btn-sm" style={{ fontSize: '.76rem' }}
                                onClick={() => setModalDoc({ url: item.documento_url, nombre: `Permiso — ${item.estudiante_nombre} ${item.estudiante_apellido}` })}>
                                Ver carta
                              </button>
                            : <span style={{ color: 'var(--ink-light)' }}>Sin documento</span>
                          }
                          {item.estado !== 'aprobado' && (
                            <button className="btn btn-sm" style={{ fontSize: '.76rem', background: 'var(--success)', color: '#fff', border: 'none' }}
                              onClick={() => confirmarEstado(item, 'aprobado')}>
                              Aprobar
                            </button>
                          )}
                          {item.estado !== 'rechazado' && (
                            <button className="btn btn-sm" style={{ fontSize: '.76rem', background: 'var(--danger)', color: '#fff', border: 'none' }}
                              onClick={() => confirmarEstado(item, 'rechazado')}>
                              Rechazar
                            </button>
                          )}
                          {item.estado !== 'pendiente' && (
                            <button className="btn btn-outline btn-sm" style={{ fontSize: '.76rem' }}
                              onClick={() => confirmarEstado(item, 'pendiente')}>
                              Pendiente
                            </button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => deleteRequest(item.id)}>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  )})}
                  {solicitudes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
                      No hay solicitudes registradas
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={closeEdit} title="Editar asistencia del estudiante" maxWidth="640px">
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ fontSize: '.9rem', color: 'var(--ink-light)' }}>
            Solo se permite cambiar el registro del estudiante a <strong>permiso</strong> o <strong>tarde</strong>.
          </div>
          <div>
            <label className="form-label">Nuevo estado</label>
            <select className="form-input" value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}>
              <option value="permiso">Permiso</option>
              <option value="tarde">Tarde</option>
            </select>
          </div>
          <div>
            <label className="form-label">{form.estado === 'tarde' ? 'Justificativo de tardanza' : 'Observacion / detalle del permiso'}</label>
            <textarea
              className="form-input"
              rows="4"
              value={form.justificacion}
              onChange={(e) => setForm((p) => ({ ...p, justificacion: e.target.value }))}
              placeholder={form.estado === 'tarde' ? 'Detalle del motivo de la tardanza...' : 'Detalle del permiso...'}
            />
          </div>
          {form.estado === 'permiso' && (
            <div>
              <label className="form-label">Documento de respaldo</label>
              <input type="file" className="form-input" onChange={(e) => setForm((p) => ({ ...p, respaldo: e.target.files?.[0] || null }))} />
            </div>
          )}
          {error && (
            <div style={{ padding: '.85rem 1rem', border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', borderRadius: '2px' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem' }}>
            <button className="btn btn-secondary" onClick={closeEdit} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambio'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: visor inline de carta de permiso (Word) */}
      <Modal open={!!modalDoc} onClose={() => setModalDoc(null)} title={modalDoc?.nombre || 'Carta de permiso'} maxWidth="820px">
        {modalDoc && <VisorCartaWord url={modalDoc.url} nombre={modalDoc.nombre} />}
      </Modal>

      {/* Modal: confirmar aprobacion / rechazo de solicitud */}
      <Modal
        open={!!modalEstado}
        onClose={() => setModalEstado(null)}
        title={modalEstado?.accion === 'aprobado' ? 'Aprobar solicitud' : modalEstado?.accion === 'rechazado' ? 'Rechazar solicitud' : 'Restablecer a pendiente'}
        maxWidth="480px"
      >
        {modalEstado && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ fontSize: '.9rem', color: 'var(--ink-light)' }}>
              {modalEstado.accion === 'aprobado'
                ? 'Al aprobar, el docente podrá ver este permiso al registrar asistencia.'
                : modalEstado.accion === 'rechazado'
                ? 'La solicitud quedará rechazada y el docente no la verá al registrar asistencia.'
                : 'La solicitud volverá a estado pendiente.'}
            </div>
            <div>
              <label className="form-label">Observacion (opcional)</label>
              <textarea
                className="form-input"
                rows="3"
                value={obsJefe}
                onChange={(e) => setObsJefe(e.target.value)}
                placeholder="Comentario para el registro..."
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setModalEstado(null)} disabled={savingEstado}>Cancelar</button>
              <button
                className="btn"
                style={{
                  background: modalEstado.accion === 'aprobado' ? 'var(--success)' : modalEstado.accion === 'rechazado' ? 'var(--danger)' : 'var(--warning)',
                  color: '#fff', border: 'none'
                }}
                onClick={guardarEstado}
                disabled={savingEstado}
              >
                {savingEstado ? 'Guardando...' : modalEstado.accion === 'aprobado' ? 'Confirmar aprobacion' : modalEstado.accion === 'rechazado' ? 'Confirmar rechazo' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function VisorCartaWord({ url, nombre }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setHtml(''); setError(''); setLoading(true);
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('No se pudo cargar el archivo');
        return r.arrayBuffer();
      })
      .then(buf => mammoth.convertToHtml({ arrayBuffer: buf }))
      .then(result => setHtml(result.value))
      .catch(() => setError('No se pudo cargar el documento. Verifique que el archivo existe.'))
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-light)' }}>
      Cargando documento...
    </div>
  );

  if (error) return (
    <div style={{ padding: '1.5rem', color: 'var(--danger)', background: 'rgba(220,38,38,.06)', borderRadius: '2px', borderLeft: '3px solid var(--danger)' }}>
      {error}
    </div>
  );

  return (
    <div>
      {/* Barra con botón de descarga */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '.75rem' }}>
        <a
          href={url}
          download={nombre + '.docx'}
          className="btn btn-outline"
          style={{ fontSize: '.78rem' }}
        >
          Descargar documento
        </a>
      </div>
      {/* Contenido Word renderizado */}
      <div
        style={{
          maxHeight: '65vh', overflowY: 'auto',
          padding: '1.5rem 2rem',
          background: '#fff', borderRadius: '2px',
          border: '1px solid var(--line)',
          lineHeight: 1.75, color: '#111', fontSize: '.95rem'
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
