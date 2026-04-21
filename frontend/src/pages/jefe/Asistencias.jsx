import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';

const ESTADO_LABEL = {
  presente: 'Presente',
  falta: 'Falta',
  permiso: 'Permiso',
  tarde: 'Tarde'
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
  const [docentes, setDocentes] = useState([]);
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
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_EDIT);
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST);
  const [saving, setSaving] = useState(false);
  const [savingRequest, setSavingRequest] = useState(false);
  const [error, setError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [filters, setFilters] = useState({
    docente_id: '',
    materia_id: '',
    estado: '',
    periodo: 'dia',
    fecha: today,
    desde: today,
    hasta: today
  });

  const params = useMemo(() => {
    const next = {};
    if (filters.docente_id) next.docente_id = filters.docente_id;
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
    const [docentesResp, materiasResp, estudiantesResp] = await Promise.all([
      api.get('/jefe/docentes'),
      api.get('/jefe/materias'),
      api.get('/jefe/estudiantes')
    ]);
    setDocentes(docentesResp.data);
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

  const estudiantesFiltrados = estudiantesMateria.filter((student) => {
    const target = studentSearch.trim().toLowerCase();
    if (!target) return true;
    return (
      `${student.nombre} ${student.apellido}`.toLowerCase().includes(target) ||
      String(student.codigo_estudiante || '').toLowerCase().includes(target) ||
      String(student.email || '').toLowerCase().includes(target)
    );
  });

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="form-label">Docente</label>
              <select className="form-input" value={filters.docente_id} onChange={(e) => setFilters((p) => ({ ...p, docente_id: e.target.value }))}>
                <option value="">Todos</option>
                {docentes.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.nombre} {doc.apellido}</option>
                ))}
              </select>
            </div>
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
              const colors = ['var(--forest)', 'var(--crimson)', 'var(--gold)', 'var(--blue-600)'];
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

          <div className="section-head" style={{ marginBottom: '1rem' }}>
            <h2>Sesiones consolidadas</h2>
            <span className="count">{reporte.sesiones?.length || 0} sesiones</span>
          </div>

          {loading ? (
            <div className="loading-dots"><span /><span /><span /></div>
          ) : (
            <>
              <table className="data-table" style={{ marginBottom: '1.5rem' }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Docente</th>
                    <th>Materia</th>
                    <th>Total</th>
                    <th>Presentes</th>
                    <th>Faltas</th>
                    <th>Permisos</th>
                    <th>Tardes</th>
                  </tr>
                </thead>
                <tbody>
                  {(reporte.sesiones || []).map((row, index) => (
                    <tr key={`${row.materia_id}-${row.fecha}-${index}`}>
                      <td className="text-mono" style={{ fontSize: '.8rem' }}>{formatDateEs(row.fecha, true)}</td>
                      <td style={{ fontSize: '.9rem' }}>{row.docente_nombre} {row.docente_apellido}</td>
                      <td style={{ fontSize: '.9rem' }}>{row.materia_nombre} - G{row.materia_grupo}</td>
                      <td>{row.total_registros}</td>
                      <td><span className="chip chip-forest">{row.presentes}</span></td>
                      <td><span className="chip chip-crimson">{row.faltas}</span></td>
                      <td><span className="chip chip-gold">{row.permisos}</span></td>
                      <td><span className="chip chip-ink">{row.tardes}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="section-head" style={{ marginBottom: '1rem' }}>
                <h2>Detalle editable de estudiantes</h2>
                <span className="count">{reporte.registros?.length || 0} registros</span>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Estudiante</th>
                    <th>Docente</th>
                    <th>Materia</th>
                    <th>Estado</th>
                    <th>Justificativo</th>
                    <th>Respaldo</th>
                    <th style={{ textAlign: 'right' }}>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {(reporte.registros || []).map((row) => (
                    <tr key={row.id}>
                      <td className="text-mono" style={{ fontSize: '.8rem' }}>{formatDateEs(row.fecha)}</td>
                      <td style={{ fontSize: '.9rem' }}>
                        {row.apellido} {row.nombre}
                        <div className="text-mono" style={{ fontSize: '.68rem', color: 'var(--ink-light)' }}>{row.codigo_estudiante}</div>
                      </td>
                      <td style={{ fontSize: '.9rem' }}>{row.docente_nombre} {row.docente_apellido}</td>
                      <td style={{ fontSize: '.9rem' }}>{row.materia_nombre} - G{row.materia_grupo}</td>
                      <td>
                        <span className={`chip ${row.estado === 'presente' ? 'chip-forest' : row.estado === 'falta' ? 'chip-crimson' : row.estado === 'permiso' ? 'chip-gold' : 'chip-ink'}`}>
                          {ESTADO_LABEL[row.estado] || row.estado}
                        </span>
                      </td>
                      <td style={{ fontSize: '.85rem' }}>{row.justificacion || 'Sin justificativo'}</td>
                      <td style={{ fontSize: '.8rem' }}>
                        {row.respaldo_url ? <a href={row.respaldo_url} target="_blank" rel="noreferrer">Ver archivo</a> : 'Sin respaldo'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(row)}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  {solicitudes.map((item) => (
                    <div key={item.id} style={{ padding: '.9rem 1rem', background: 'var(--paper-dark)', borderRadius: '2px', borderLeft: `4px solid ${item.tipo === 'carta_permiso' ? 'var(--gold)' : 'var(--blue-600)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem' }}>
                            {item.estudiante_nombre} {item.estudiante_apellido}
                          </div>
                          <div className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)' }}>
                            {item.codigo_estudiante} · {item.materia_nombre} ({item.materia_codigo}) - G{item.materia_grupo}
                          </div>
                        </div>
                        <span className={`chip ${item.tipo === 'carta_permiso' ? 'chip-gold' : 'chip-ink'}`}>
                          {SOLICITUD_TIPO[item.tipo] || item.tipo}
                        </span>
                      </div>
                      <div style={{ fontSize: '.84rem', marginTop: '.55rem' }}>
                        {formatDateEs(item.fecha_desde)} {item.fecha_desde !== item.fecha_hasta ? `al ${formatDateEs(item.fecha_hasta)}` : ''}
                        {item.horas_detalle ? ` · ${item.horas_detalle}` : ''}
                      </div>
                      <div style={{ fontSize: '.84rem', color: 'var(--ink-light)', marginTop: '.45rem' }}>
                        {item.detalle || 'Sin detalle adicional'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.6rem', fontSize: '.8rem' }}>
                        <span>Registrado por {item.registrado_nombre} {item.registrado_apellido}</span>
                        {item.documento_url ? <a href={item.documento_url} target="_blank" rel="noreferrer">Ver documento</a> : <span>Sin documento</span>}
                      </div>
                    </div>
                  ))}
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
    </>
  );
}
