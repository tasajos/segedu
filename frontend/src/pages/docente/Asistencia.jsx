import { useEffect, useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import mammoth from 'mammoth';
import { useAuth } from '../../context/AuthContext';
import {
  buildAttendanceExportMetadata,
  exportAttendanceExcel,
  exportAttendancePdf
} from '../../services/attendanceExport';

const ESTADOS = ['presente', 'falta', 'permiso', 'tarde'];
const ESTADO_COLOR = {
  presente: '#16a34a',
  falta: '#dc2626',
  permiso: '#d97706',
  tarde: '#2563eb'
};
const ESTADO_BG = {
  presente: '#f0fdf4',
  falta: '#fef2f2',
  permiso: '#fffbeb',
  tarde: '#eff6ff'
};
const ESTADO_BORDER = {
  presente: '#bbf7d0',
  falta: '#fecaca',
  permiso: '#fde68a',
  tarde: '#bfdbfe'
};
const ESTADO_LABEL = {
  presente: 'Presente',
  falta: 'Falta',
  permiso: 'Permiso',
  tarde: 'Tarde'
};

const getTodayLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateEs = (value, withWeekday = false) => {
  if (!value) return '';
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', withWeekday
    ? { weekday: 'short', day: 'numeric', month: 'short' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function DocenteAsistencia() {
  const { user } = useAuth();
  const today = getTodayLocal();
  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState('');
  const [fecha, setFecha] = useState(today);
  const [estudiantes, setEstudiantes] = useState([]);
  const [estados, setEstados] = useState({});
  const [justificaciones, setJustificaciones] = useState({});
  const [permisosSolicitados, setPermisosSolicitados] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [reporte, setReporte] = useState({ registros: [], resumen: { total: 0, presente: 0, falta: 0, permiso: 0, tarde: 0 } });
  const [saving, setSaving] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [vista, setVista] = useState('llamar');
  const [mensajeError, setMensajeError] = useState('');
  const [listaBloqueada, setListaBloqueada] = useState(false);
  const [periodoHistorial, setPeriodoHistorial] = useState('dia');
  const [fechaHistorial, setFechaHistorial] = useState(today);
  const [desdeHistorial, setDesdeHistorial] = useState(today);
  const [hastaHistorial, setHastaHistorial] = useState(today);
  const [estadoHistorial, setEstadoHistorial] = useState('');
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [exporting, setExporting] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    api.get('/docente/materias').then((r) => {
      setMaterias(r.data);
      if (r.data.length > 0) setMateriaId(String(r.data[0].id));
    });
  }, []);

  useEffect(() => {
    if (!materiaId) return;
    api.get(`/docente/materias/${materiaId}/estudiantes`).then((r) => {
      setEstudiantes(r.data);
      const initEstados = {};
      r.data.forEach((e) => {
        initEstados[e.id] = 'presente';
      });
      setEstados(initEstados);
      setJustificaciones({});
    });
  }, [materiaId]);

  useEffect(() => {
    if (!materiaId || estudiantes.length === 0) return;

    api.get('/docente/asistencia/sesion', { params: { materia_id: materiaId, fecha } }).then((r) => {
      const rows = r.data || [];
      if (rows.length === 0) {
        const initEstados = {};
        estudiantes.forEach((e) => {
          initEstados[e.id] = 'presente';
        });
        setEstados(initEstados);
        setJustificaciones({});
        setListaBloqueada(false);
        setMensajeError('');
        return;
      }

      const nextEstados = {};
      const nextJustificaciones = {};
      estudiantes.forEach((estudiante) => {
        nextEstados[estudiante.id] = 'presente';
      });
      rows.forEach((row) => {
        nextEstados[row.estudiante_id] = row.estado;
        nextJustificaciones[row.estudiante_id] = row.justificacion || '';
      });
      setEstados(nextEstados);
      setJustificaciones(nextJustificaciones);
      setListaBloqueada(true);
      setMensajeError('La asistencia de esta materia ya fue registrada para la fecha seleccionada.');
    });
  }, [materiaId, fecha, estudiantes]);

  useEffect(() => {
    if (!materiaId || !fecha) return;
    api.get('/docente/asistencia/permisos', { params: { materia_id: materiaId, fecha } })
      .then((r) => setPermisosSolicitados(r.data || []))
      .catch(() => setPermisosSolicitados([]));
  }, [materiaId, fecha]);

  useEffect(() => {
    if (!materiaId) return;

    const params = { materia_id: materiaId };
    if (periodoHistorial === 'rango') {
      params.desde = desdeHistorial;
      params.hasta = hastaHistorial;
      params.periodo = 'rango';
    } else {
      params.periodo = periodoHistorial;
      params.fecha = fechaHistorial;
    }
    if (estadoHistorial) params.estado = estadoHistorial;

    setLoadingHistorial(true);
    Promise.all([
      api.get('/docente/asistencia/sesiones', { params }),
      api.get('/docente/asistencia/reporte', { params })
    ]).then(([sesionesResp, reporteResp]) => {
      setSesiones(sesionesResp.data?.sesiones || []);
      setReporte(reporteResp.data || { registros: [], resumen: { total: 0, presente: 0, falta: 0, permiso: 0, tarde: 0 } });
    }).finally(() => setLoadingHistorial(false));
  }, [materiaId, periodoHistorial, fechaHistorial, desdeHistorial, hastaHistorial, estadoHistorial]);

  const setEstado = (estId, val) => {
    if (listaBloqueada) return;
    setEstados((prev) => ({ ...prev, [estId]: val }));
  };

  const setJustif = (estId, val) => {
    if (listaBloqueada) return;
    setJustificaciones((prev) => ({ ...prev, [estId]: val }));
  };

  const marcarTodos = (estado) => {
    if (listaBloqueada) return;
    const next = {};
    estudiantes.forEach((e) => {
      next[e.id] = estado;
    });
    setEstados(next);
  };

  const aplicarPermisoSolicitado = (solicitud) => {
    if (listaBloqueada) return;
    setEstados((prev) => ({ ...prev, [solicitud.estudiante_id]: 'permiso' }));
    setJustificaciones((prev) => ({
      ...prev,
      [solicitud.estudiante_id]: solicitud.detalle || solicitud.horas_detalle || 'Permiso respaldado'
    }));
  };

  const openDocumentPreview = (item) => {
    if (!item?.documento_url) return;
    const absoluteUrl = item.documento_url.startsWith('http')
      ? item.documento_url
      : `${window.location.origin}${item.documento_url}`;
    const extension = absoluteUrl.split('.').pop()?.toLowerCase().split('?')[0] || '';
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

    setPreviewLoading(true);
    setPreviewError('');
    setPreviewDoc({
      title: `${item.nombre} ${item.apellido}`,
      sourceUrl: absoluteUrl,
      extension,
      type: extension === 'pdf' ? 'pdf' : imageExtensions.includes(extension) ? 'image' : extension === 'docx' ? 'docx' : 'unsupported',
      html: '',
      previewUrl: absoluteUrl
    });

    if (extension === 'docx') {
      fetch(absoluteUrl)
        .then((resp) => {
          if (!resp.ok) throw new Error('No se pudo cargar el documento');
          return resp.arrayBuffer();
        })
        .then((buffer) => mammoth.convertToHtml({ arrayBuffer: buffer }))
        .then((result) => {
          setPreviewDoc((prev) => prev ? { ...prev, html: result.value } : prev);
        })
        .catch(() => {
          setPreviewError('No se pudo renderizar el archivo DOCX en linea. Puede abrirlo en otra pestaña.');
        })
        .finally(() => setPreviewLoading(false));
      return;
    }

    if (extension === 'pdf' || imageExtensions.includes(extension)) {
      setPreviewLoading(false);
      return;
    }

    setPreviewError('Este tipo de archivo no admite vista previa interna. Puede abrirlo en otra pestaña.');
    setPreviewLoading(false);
  };

  const guardar = async () => {
    if (!materiaId || !fecha || estudiantes.length === 0 || listaBloqueada) return;
    setSaving(true);
    setGuardado(false);
    setMensajeError('');

    try {
      const registros = estudiantes.map((e) => ({
        estudiante_id: e.id,
        estado: estados[e.id] || 'presente',
        justificacion: justificaciones[e.id] || null
      }));
      await api.post('/docente/asistencia/lista', { materia_id: materiaId, fecha, registros });
      setGuardado(true);
      setListaBloqueada(true);
      setMensajeError('La asistencia fue registrada y quedo cerrada para esta fecha.');

      const historyParams = periodoHistorial === 'rango'
        ? { materia_id: materiaId, periodo: 'rango', desde: desdeHistorial, hasta: hastaHistorial, estado: estadoHistorial || undefined }
        : { materia_id: materiaId, periodo: periodoHistorial, fecha: fechaHistorial, estado: estadoHistorial || undefined };

      const [sesionesResp, reporteResp] = await Promise.all([
        api.get('/docente/asistencia/sesiones', { params: historyParams }),
        api.get('/docente/asistencia/reporte', { params: historyParams })
      ]);
      setSesiones(sesionesResp.data?.sesiones || []);
      setReporte(reporteResp.data || { registros: [], resumen: { total: 0, presente: 0, falta: 0, permiso: 0, tarde: 0 } });
      setTimeout(() => setGuardado(false), 3000);
    } catch (error) {
      setMensajeError(error?.response?.data?.error || 'No se pudo registrar la asistencia');
      if (error?.response?.status === 409) setListaBloqueada(true);
    } finally {
      setSaving(false);
    }
  };

  const materia = materias.find((m) => String(m.id) === materiaId);
  const presentes = Object.values(estados).filter((v) => v === 'presente').length;
  const faltas = Object.values(estados).filter((v) => v === 'falta').length;
  const permisos = Object.values(estados).filter((v) => v === 'permiso').length;
  const tardes = Object.values(estados).filter((v) => v === 'tarde').length;
  const exportBaseName = (() => {
    if (!materia) return 'asistencia_unicen';
    if (periodoHistorial === 'rango') return `asistencia_unicen_${materia.codigo}_${desdeHistorial}_a_${hastaHistorial}`;
    return `asistencia_unicen_${materia.codigo}_${periodoHistorial}_${fechaHistorial}`;
  })();
  const periodoLabel = periodoHistorial === 'rango'
    ? 'Rango de fechas'
    : periodoHistorial === 'semana'
      ? 'Reporte semanal'
      : periodoHistorial === 'mes'
        ? 'Reporte mensual'
        : 'Reporte diario';
  const exportMetadata = buildAttendanceExportMetadata({
    materia,
    docente: user ? `${user.nombre} ${user.apellido}` : 'Docente responsable',
    periodoLabel,
    desde: periodoHistorial === 'rango' ? desdeHistorial : reporte?.rango?.desde,
    hasta: periodoHistorial === 'rango' ? hastaHistorial : reporte?.rango?.hasta,
    fechaBase: periodoHistorial === 'rango' ? null : fechaHistorial,
    resumen: reporte.resumen || { total: 0, presente: 0, falta: 0, permiso: 0, tarde: 0 }
  });

  const handleExportPdf = async () => {
    if (!reporte.registros?.length) return;
    setExporting('pdf');
    try {
      await exportAttendancePdf({
        fileName: `${exportBaseName}.pdf`,
        records: reporte.registros,
        metadata: exportMetadata
      });
    } finally {
      setExporting('');
    }
  };

  const handleExportExcel = async () => {
    if (!reporte.registros?.length) return;
    setExporting('excel');
    try {
      await exportAttendanceExcel({
        fileName: `${exportBaseName}.xlsx`,
        records: reporte.registros,
        metadata: exportMetadata
      });
    } finally {
      setExporting('');
    }
  };

  return (
    <>
      <PageHeader
        num="05"
        eyebrow="Control de asistencia"
        title={<>Lista de <span className="display-italic">asistencia</span></>}
        lead="Registre una sola lista por dia para cada materia y consulte el historial detallado por periodos exportables."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginBottom: '1.5rem', alignItems: 'end' }}>
        <div>
          <label className="form-label">Materia</label>
          <select className="form-input" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.codigo}) - Grupo {m.grupo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Fecha de la sesion</label>
          <input className="form-input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button
            className={`btn ${vista === 'llamar' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setVista('llamar')}
          >
            Llamar lista
          </button>
          <button
            className={`btn ${vista === 'historial' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setVista('historial')}
          >
            Historial
          </button>
        </div>
      </div>

      {vista === 'llamar' && (
        <>
          {mensajeError && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '1rem 1.1rem',
                borderRadius: '12px',
                border: `1px solid ${listaBloqueada ? '#fde68a' : '#fecaca'}`,
                background: listaBloqueada ? '#fffbeb' : '#fef2f2',
                color: '#7c2d12'
              }}
            >
              {mensajeError}
            </div>
          )}

          {permisosSolicitados.length > 0 && (
            <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem', borderTop: '4px solid var(--gold)' }}>
              <div className="section-head" style={{ marginBottom: '.85rem' }}>
                <h2>Permisos</h2>
                <span className="count">{permisosSolicitados.length} solicitudes</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
                {permisosSolicitados.map((item) => (
                  <div key={item.id} style={{ padding: '.85rem 1rem', background: 'var(--paper-dark)', borderRadius: '2px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '.96rem' }}>
                        {item.nombre} {item.apellido}
                        <span className="text-mono" style={{ fontSize: '.7rem', color: 'var(--ink-light)', marginLeft: '.5rem' }}>
                          {item.codigo_estudiante}
                        </span>
                      </div>
                      <div style={{ fontSize: '.83rem', color: 'var(--ink-light)', marginTop: '.25rem' }}>
                        {item.tipo === 'carta_permiso' ? 'Carta de permiso' : 'Justificacion'}
                        {item.horas_detalle ? ` · ${item.horas_detalle}` : ''}
                      </div>
                      <div style={{ fontSize: '.82rem', marginTop: '.25rem' }}>
                        {item.detalle || 'Sin detalle adicional'}
                      </div>
                      <div style={{ display: 'flex', gap: '.75rem', marginTop: '.35rem', fontSize: '.8rem' }}>
                        <span>{formatDateEs(item.fecha_desde)} {item.fecha_desde !== item.fecha_hasta ? `al ${formatDateEs(item.fecha_hasta)}` : ''}</span>
                        {item.documento_url ? (
                          <button
                            type="button"
                            onClick={() => openDocumentPreview(item)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--blue-600)',
                              cursor: 'pointer',
                              padding: 0,
                              textDecoration: 'underline',
                              fontSize: '.8rem'
                            }}
                          >
                            Ver documento
                          </button>
                        ) : <span>Sin documento</span>}
                      </div>
                    </div>
                    <button className="btn btn-secondary" onClick={() => aplicarPermisoSolicitado(item)} disabled={listaBloqueada}>
                      Marcar permiso
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {estudiantes.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.75rem', marginBottom: '1.5rem' }}>
              {ESTADOS.map((est) => {
                const count = Object.values(estados).filter((v) => v === est).length;
                return (
                  <div
                    key={est}
                    style={{
                      padding: '1rem 1.1rem',
                      background: ESTADO_BG[est],
                      borderRadius: '10px',
                      border: `1px solid ${ESTADO_BORDER[est]}`,
                      boxShadow: 'var(--shadow-sm)',
                      cursor: listaBloqueada ? 'default' : 'pointer',
                      opacity: listaBloqueada ? 0.8 : 1
                    }}
                    onClick={() => marcarTodos(est)}
                  >
                    <div className="text-serif" style={{ fontSize: '2rem', lineHeight: 1, color: ESTADO_COLOR[est] }}>{count}</div>
                    <div className="text-mono" style={{ fontSize: '.68rem', color: ESTADO_COLOR[est], textTransform: 'uppercase', letterSpacing: '.1em', marginTop: '.35rem', fontWeight: 700 }}>
                      {ESTADO_LABEL[est]}
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.35rem' }}>
                      {listaBloqueada ? 'lista cerrada' : 'clic para marcar todos'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 mb-4" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.85rem', color: 'var(--ink-light)' }}>Marcar todos como:</span>
            {ESTADOS.map((est) => (
              <button
                key={est}
                onClick={() => marcarTodos(est)}
                disabled={listaBloqueada}
                style={{
                  padding: '.5rem .95rem',
                  borderRadius: '999px',
                  border: `1px solid ${ESTADO_BORDER[est]}`,
                  background: ESTADO_BG[est],
                  color: ESTADO_COLOR[est],
                  fontWeight: 700,
                  fontSize: '.8rem',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: listaBloqueada ? 0.65 : 1,
                  cursor: listaBloqueada ? 'not-allowed' : 'pointer'
                }}
              >
                {ESTADO_LABEL[est]}
              </button>
            ))}
          </div>

          {estudiantes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
              Sin estudiantes inscritos en esta materia
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.5rem' }}>
              {estudiantes.map((est, i) => (
                <div
                  key={est.id}
                  style={{
                    padding: '1rem 1.1rem',
                    background: ESTADO_BG[estados[est.id] || 'presente'],
                    borderRadius: '12px',
                    border: `1px solid ${ESTADO_BORDER[estados[est.id] || 'presente']}`,
                    borderLeft: `4px solid ${ESTADO_COLOR[estados[est.id] || 'presente']}`,
                    transition: 'border-color .2s, background .2s',
                    boxShadow: 'var(--shadow-sm)',
                    opacity: listaBloqueada ? 0.88 : 1
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: '1rem', alignItems: 'center' }}>
                    <span className="text-mono" style={{ fontSize: '.75rem', color: 'var(--ink-light)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem' }}>{est.nombre} {est.apellido}</div>
                      <div className="text-mono" style={{ fontSize: '.72rem', color: 'var(--ink-light)' }}>{est.codigo_estudiante}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {ESTADOS.map((estado) => (
                        <button
                          key={estado}
                          onClick={() => setEstado(est.id, estado)}
                          disabled={listaBloqueada}
                          style={{
                            padding: '.45rem .8rem',
                            border: '1px solid',
                            borderColor: estados[est.id] === estado ? ESTADO_COLOR[estado] : ESTADO_BORDER[estado],
                            background: estados[est.id] === estado ? ESTADO_COLOR[estado] : '#fff',
                            color: estados[est.id] === estado ? '#fff' : ESTADO_COLOR[estado],
                            borderRadius: '999px',
                            cursor: listaBloqueada ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--sans)',
                            fontSize: '.75rem',
                            fontWeight: 700,
                            transition: 'all .15s',
                            minWidth: '88px',
                            boxShadow: estados[est.id] === estado ? 'var(--shadow-sm)' : 'none',
                            opacity: listaBloqueada ? 0.7 : 1
                          }}
                        >
                          {ESTADO_LABEL[estado]}
                        </button>
                      ))}
                    </div>
                    <div style={{ width: '160px' }}>
                      {(estados[est.id] === 'permiso' || estados[est.id] === 'falta') && (
                        <input
                          type="text"
                          placeholder="Justificacion..."
                          disabled={listaBloqueada}
                          value={justificaciones[est.id] || ''}
                          onChange={(e) => setJustif(est.id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '.3rem .5rem',
                            fontSize: '.78rem',
                            border: '1px solid var(--line-strong)',
                            borderRadius: '2px',
                            background: 'var(--paper-light)',
                            fontFamily: 'var(--sans)',
                            opacity: listaBloqueada ? 0.7 : 1
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {estudiantes.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--ink)', color: 'var(--paper)', borderRadius: '2px', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="text-mono" style={{ fontSize: '.8rem' }}>
                {materia?.nombre} - Grupo {materia?.grupo} - {fecha} - {presentes} presentes, {faltas} faltas, {permisos} permisos, {tardes} tardes
              </div>
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                {guardado && (
                  <span style={{ color: '#7ecb87', fontFamily: 'var(--mono)', fontSize: '.8rem' }}>
                    Lista guardada
                  </span>
                )}
                <button className="btn btn-primary" onClick={guardar} disabled={saving || listaBloqueada}>
                  {saving ? 'Guardando...' : listaBloqueada ? 'Lista cerrada' : 'Registrar lista'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {vista === 'historial' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: '1rem', marginBottom: '1rem', alignItems: 'end' }}>
            <div>
              <label className="form-label">Periodo</label>
              <select className="form-input" value={periodoHistorial} onChange={(e) => setPeriodoHistorial(e.target.value)}>
                <option value="dia">Diario</option>
                <option value="semana">Semanal</option>
                <option value="mes">Mensual</option>
                <option value="rango">Rango de fechas</option>
              </select>
            </div>

            {periodoHistorial === 'rango' ? (
              <>
                <div>
                  <label className="form-label">Desde</label>
                  <input className="form-input" type="date" value={desdeHistorial} onChange={(e) => setDesdeHistorial(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Hasta</label>
                  <input className="form-input" type="date" value={hastaHistorial} onChange={(e) => setHastaHistorial(e.target.value)} />
                </div>
              </>
            ) : (
              <div>
                <label className="form-label">Fecha base</label>
                <input className="form-input" type="date" value={fechaHistorial} onChange={(e) => setFechaHistorial(e.target.value)} />
              </div>
            )}

            <div>
              <label className="form-label">Estado</label>
              <select className="form-input" value={estadoHistorial} onChange={(e) => setEstadoHistorial(e.target.value)}>
                <option value="">Todos</option>
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>{ESTADO_LABEL[estado]}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={handleExportExcel}
                disabled={!reporte.registros?.length || !!exporting}
              >
                {exporting === 'excel' ? 'Generando Excel...' : 'Exportar Excel'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExportPdf}
                disabled={!reporte.registros?.length || !!exporting}
              >
                {exporting === 'pdf' ? 'Generando PDF...' : 'Exportar PDF'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.75rem', marginBottom: '1.25rem' }}>
            {ESTADOS.map((estado) => (
              <button
                key={estado}
                onClick={() => setEstadoHistorial((prev) => (prev === estado ? '' : estado))}
                style={{
                  padding: '1rem 1.1rem',
                  background: ESTADO_BG[estado],
                  borderRadius: '12px',
                  border: `1px solid ${ESTADO_BORDER[estado]}`,
                  boxShadow: 'var(--shadow-sm)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  outline: estadoHistorial === estado ? `2px solid ${ESTADO_COLOR[estado]}` : 'none'
                }}
              >
                <div className="text-serif" style={{ fontSize: '2rem', lineHeight: 1, color: ESTADO_COLOR[estado] }}>
                  {reporte.resumen?.[estado] || 0}
                </div>
                <div className="text-mono" style={{ fontSize: '.68rem', color: ESTADO_COLOR[estado], textTransform: 'uppercase', letterSpacing: '.1em', marginTop: '.35rem', fontWeight: 700 }}>
                  {ESTADO_LABEL[estado]}
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: '.35rem' }}>
                  {estadoHistorial === estado ? 'mostrando solo este estado' : 'clic para filtrar'}
                </div>
              </button>
            ))}
          </div>

          <div className="section-head" style={{ marginBottom: '1rem' }}>
            <h2>Sesiones registradas</h2>
            <span className="count">{sesiones.length} sesiones</span>
          </div>

          {loadingHistorial ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-light)' }}>
              Cargando historial...
            </div>
          ) : sesiones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
              Sin sesiones registradas para este filtro
            </div>
          ) : (
            <table className="data-table" style={{ marginBottom: '1.5rem' }}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Materia</th>
                  <th>Total</th>
                  <th>Presentes</th>
                  <th>Faltas</th>
                  <th>Permisos</th>
                  <th>Tardes</th>
                </tr>
              </thead>
              <tbody>
                {sesiones.map((s, i) => (
                  <tr key={`${s.materia_id}-${s.fecha}-${i}`}>
                    <td className="text-mono" style={{ fontSize: '.85rem' }}>
                      {formatDateEs(s.fecha, true)}
                    </td>
                    <td style={{ fontSize: '.9rem' }}>
                      {s.materia_nombre}{s.grupo ? ` - Grupo ${s.grupo}` : ''}
                    </td>
                    <td className="text-mono">{s.total_registros}</td>
                    <td><span className="chip chip-forest">{s.presentes}</span></td>
                    <td><span className="chip chip-crimson">{s.faltas}</span></td>
                    <td><span className="chip chip-gold">{s.permisos}</span></td>
                    <td><span className="chip chip-ink">{s.tardes}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="section-head" style={{ marginBottom: '1rem' }}>
            <h2>Lista detallada</h2>
            <span className="count">{reporte.registros?.length || 0} registros</span>
          </div>

          {!reporte.registros?.length ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-light)', fontStyle: 'italic' }}>
              No hay registros para mostrar con el filtro actual
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estudiante</th>
                  <th>Codigo</th>
                  <th>Materia</th>
                  <th>Estado</th>
                  <th>Justificacion</th>
                </tr>
              </thead>
              <tbody>
                {reporte.registros.map((row, index) => (
                  <tr key={`${row.estudiante_id}-${row.fecha}-${index}`}>
                    <td className="text-mono" style={{ fontSize: '.85rem' }}>{formatDateEs(row.fecha)}</td>
                    <td style={{ fontSize: '.9rem' }}>{row.apellido} {row.nombre}</td>
                    <td className="text-mono" style={{ fontSize: '.8rem' }}>{row.codigo_estudiante}</td>
                    <td style={{ fontSize: '.9rem' }}>{row.materia_nombre}{row.materia_grupo ? ` - ${row.materia_grupo}` : ''}</td>
                    <td>
                      <span
                        className={`chip ${
                          row.estado === 'presente'
                            ? 'chip-forest'
                            : row.estado === 'falta'
                              ? 'chip-crimson'
                              : row.estado === 'permiso'
                                ? 'chip-gold'
                                : 'chip-ink'
                        }`}
                      >
                        {ESTADO_LABEL[row.estado] || row.estado}
                      </span>
                    </td>
                    <td style={{ fontSize: '.85rem' }}>{row.justificacion || 'Sin justificacion'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <Modal
        open={!!previewDoc}
        onClose={() => {
          setPreviewDoc(null);
          setPreviewLoading(false);
          setPreviewError('');
        }}
        title={previewDoc ? `Documento - ${previewDoc.title}` : 'Documento'}
        maxWidth="960px"
      >
        {previewDoc && (
          <div style={{ display: 'grid', gap: '.75rem' }}>
            <div style={{ fontSize: '.82rem', color: 'var(--ink-light)' }}>
              Vista previa del respaldo cargado para permiso o justificacion.
            </div>
            <div style={{ border: '1px solid var(--line-strong)', borderRadius: '2px', overflow: 'hidden', background: '#fff' }}>
              {previewLoading ? (
                <div style={{ height: '70vh', display: 'grid', placeItems: 'center', color: 'var(--ink-light)' }}>
                  Cargando vista previa...
                </div>
              ) : previewDoc.type === 'pdf' ? (
                <iframe
                  title="Vista previa de PDF"
                  src={previewDoc.previewUrl}
                  style={{ width: '100%', height: '70vh', border: 'none' }}
                />
              ) : previewDoc.type === 'image' ? (
                <div style={{ height: '70vh', overflow: 'auto', background: '#f8fafc', display: 'grid', placeItems: 'center' }}>
                  <img src={previewDoc.previewUrl} alt="Documento" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                </div>
              ) : previewDoc.type === 'docx' && previewDoc.html ? (
                <div
                  style={{ height: '70vh', overflow: 'auto', padding: '1.5rem', background: '#fff' }}
                  dangerouslySetInnerHTML={{ __html: previewDoc.html }}
                />
              ) : (
                <div style={{ height: '70vh', display: 'grid', placeItems: 'center', color: 'var(--ink-light)', padding: '2rem', textAlign: 'center' }}>
                  No hay vista previa disponible para este archivo.
                </div>
              )}
            </div>
            {previewError && (
              <div style={{ fontSize: '.78rem', color: 'var(--ink-light)' }}>
                {previewError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <a href={previewDoc.sourceUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                Abrir en otra pestaña
              </a>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
