import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/PageHeader';
import './CarpetasPedagogicas.css';

const normalizeDate = (value) => String(value || '').slice(0, 10);

const safe = (value) => value ?? '';

const fileName = (value) => String(value || 'carpeta-pedagogica')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9_-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

const parseFolderData = (detail) => detail?.carpeta?.data || {};

const buildAttendanceDates = (rows) => Array.from(new Set((rows || []).map((row) => normalizeDate(row.fecha)))).sort();

const buildAttendanceRows = (estudiantes, asistencia) => {
  const dates = buildAttendanceDates(asistencia);
  return (estudiantes || []).map((student, index) => {
    const values = dates.map((date) => {
      const found = asistencia.find((row) => Number(row.estudiante_id) === Number(student.id) && normalizeDate(row.fecha) === date);
      return found?.estado || '';
    });
    return [index + 1, `${student.apellido} ${student.nombre}`, student.codigo_estudiante || '', ...values];
  });
};

const gradeStatus = (row) => {
  const total = Number(row.nota_final || 0);
  return row.estado === 'aprobado' || total >= 51 ? 'Aprobado' : 'Reprobado';
};

const loadLogo = async () => {
  const response = await fetch('/unicen.png');
  if (!response.ok) return null;
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
};

const addHeader = (doc, logo, title, subtitle) => {
  if (logo) doc.addImage(logo, 'PNG', 12, 7, 20, 20);
  doc.setFillColor(15, 32, 68);
  doc.roundedRect(38, 9, 245, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, 43, 18);
  doc.setTextColor(15, 32, 68);
  doc.setFontSize(10);
  doc.text(subtitle, 12, 35);
};

const exportFolderPdf = async (detail) => {
  const data = parseFolderData(detail);
  const materia = detail.materia;
  const title = `Carpeta pedagogica - ${materia.nombre} G${materia.grupo}`;
  const logo = await loadLogo();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  addHeader(doc, logo, title, 'Resumen general');
  const caratula = data.caratula || {};
  autoTable(doc, {
    startY: 42,
    head: [['Campo', 'Valor']],
    body: [
      ['Docente', `${materia.docente_nombre || ''} ${materia.docente_apellido || ''}`.trim()],
      ['Materia', `${materia.nombre} (${materia.codigo}) - Grupo ${materia.grupo}`],
      ['Carrera', materia.carrera_nombre || caratula.carrera || ''],
      ['Gestion', caratula.gestion || ''],
      ['Semestre', caratula.semestre || materia.semestre || ''],
      ['Ultima actualizacion', detail.carpeta?.updated_at ? new Date(detail.carpeta.updated_at).toLocaleString('es-ES') : 'Sin carpeta guardada']
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 32, 68] }
  });

  const sections = [
    {
      title: 'Horarios',
      headers: ['Dia', 'Horario'],
      rows: (data.datos?.horario || []).map((row) => [row.dia, row.horas || ''])
    },
    {
      title: 'Seguimiento academico',
      headers: ['Semana', 'Fecha', 'Nro', 'Unidad', 'Contenidos', 'Practica', 'Estudiantes', 'Observaciones'],
      rows: (data.seguimiento?.rows || []).map((row) => [
        row.semana, row.fecha, row.numero, row.unidad, row.contenidos, row.practica, row.estudiantes, row.observaciones
      ])
    },
    {
      title: 'Bibliografia',
      headers: ['Nro', 'Titulo', 'Autor', 'Editorial', 'Edicion', 'Lugar'],
      rows: (data.bibliografia?.rows || []).map((row) => [row.numero, row.titulo, row.autor, row.editorial, row.edicion, row.lugar])
    },
    {
      title: 'Evaluacion desde acta',
      headers: ['Nro', 'Estudiante', 'Codigo', 'Modalidad', '1P', '2P', 'Final', 'Recuperacion', 'Total', 'Estado'],
      rows: (detail.evaluacion || []).map((row, index) => [
        index + 1,
        `${row.apellido} ${row.nombre}`,
        row.codigo_estudiante || '',
        row.modalidad || '',
        safe(row.primer_parcial),
        safe(row.segundo_parcial),
        safe(row.examen_final),
        safe(row.examen_recuperacion),
        safe(row.nota_final),
        gradeStatus(row)
      ])
    },
    {
      title: 'Asistencia',
      headers: ['Nro', 'Estudiante', 'Codigo', ...buildAttendanceDates(detail.asistencia || [])],
      rows: buildAttendanceRows(detail.estudiantes || [], detail.asistencia || [])
    }
  ];

  sections.forEach((section) => {
    doc.addPage();
    addHeader(doc, logo, title, section.title);
    autoTable(doc, {
      startY: 42,
      head: [section.headers],
      body: section.rows.length ? section.rows : [['Sin registros']],
      theme: 'grid',
      headStyles: { fillColor: [15, 32, 68], fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' }
    });
  });

  doc.save(`${fileName(title)}.pdf`);
};

export default function JefeCarpetasPedagogicas() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/jefe/carpetas-pedagogicas');
      setItems(data);
    } catch (err) {
      setItems([]);
      setError(err.response?.data?.error || 'No se pudieron cargar las carpetas pedagogicas. Verifique que el backend este actualizado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = status === 'todos' || item.estado_carpeta === status;
      const haystack = [
        item.materia_nombre,
        item.materia_codigo,
        item.materia_grupo,
        item.docente_nombre,
        item.docente_apellido
      ].join(' ').toLowerCase();
      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [items, query, status]);

  const openDetail = async (item, shouldDownload = false) => {
    setSelected(item);
    setDetailLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/jefe/carpetas-pedagogicas/${item.materia_id}`);
      setDetail(data);
      if (shouldDownload) await exportFolderPdf(data);
    } catch (err) {
      setDetail(null);
      setError(err.response?.data?.error || 'No se pudo cargar el detalle de la carpeta pedagogica.');
    } finally {
      setDetailLoading(false);
    }
  };

  const ready = items.filter((item) => item.estado_carpeta === 'completa').length;
  const pending = items.length - ready;

  return (
    <>
      <PageHeader
        num="16"
        eyebrow="Supervision academica"
        title={<>Carpetas <span className="display-italic">pedagogicas</span></>}
        lead="Revise las carpetas por docente, materia y grupo, y descargue versiones listas para imprimir."
      />

      <div className="jefe-folders">
        <div className="grid-3">
          <div className="jefe-preview-metric"><strong>{items.length}</strong><span>Total carpetas</span></div>
          <div className="jefe-preview-metric"><strong>{ready}</strong><span>Guardadas</span></div>
          <div className="jefe-preview-metric"><strong>{pending}</strong><span>Pendientes</span></div>
        </div>

        <div className="jefe-folders-toolbar">
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>Buscar</label>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Docente, materia, codigo o grupo" />
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label>Estado</label>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="todos">Todos</option>
              <option value="completa">Guardadas</option>
              <option value="pendiente">Pendientes</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="jefe-empty">Cargando carpetas pedagogicas...</div>
        ) : error ? (
          <div className="jefe-empty">
            <strong>No se pudo cargar</strong>
            <div style={{ marginTop: '.35rem' }}>{error}</div>
            <button className="btn btn-primary btn-sm" type="button" onClick={loadItems} style={{ marginTop: '.9rem' }}>
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="jefe-empty">No hay carpetas pedagogicas para los filtros seleccionados.</div>
        ) : (
          <div className="jefe-folders-grid">
            {filtered.map((item) => (
              <article key={item.materia_id} className={`jefe-folder-card ${item.estado_carpeta === 'completa' ? 'ready' : 'pending'}`}>
                <div className="jefe-folder-title">
                  <h3>{item.materia_nombre}</h3>
                  <span className={`chip ${item.estado_carpeta === 'completa' ? 'chip-forest' : 'chip-gold'}`}>
                    {item.estado_carpeta}
                  </span>
                </div>
                <div className="jefe-folder-meta">
                  <span>{item.materia_codigo} - Grupo {item.materia_grupo}</span>
                  <span>{item.docente_nombre ? `${item.docente_nombre} ${item.docente_apellido}` : 'Sin docente asignado'}</span>
                  <span>{item.total_estudiantes} estudiantes - {item.total_fechas_asistencia} fechas asistencia</span>
                  <span>{item.tiene_acta ? 'Con acta de notas' : 'Sin acta de notas'}</span>
                </div>
                <div className="jefe-folder-actions">
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => openDetail(item)}>
                    Ver
                  </button>
                  <button className="btn btn-primary btn-sm" type="button" onClick={() => openDetail(item, true)}>
                    PDF
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => { setSelected(null); setDetail(null); }}
        title={selected ? `${selected.materia_nombre} - Grupo ${selected.materia_grupo}` : 'Carpeta pedagogica'}
        maxWidth="980px"
      >
        {detailLoading || !detail ? (
          <div className="jefe-empty">Cargando detalle...</div>
        ) : (
          <div className="jefe-preview">
            <div className="jefe-preview-head">
              <div className="jefe-preview-metric"><strong>{detail.estudiantes.length}</strong><span>Estudiantes</span></div>
              <div className="jefe-preview-metric"><strong>{buildAttendanceDates(detail.asistencia).length}</strong><span>Fechas asistencia</span></div>
              <div className="jefe-preview-metric"><strong>{detail.evaluacion.length}</strong><span>Notas acta</span></div>
              <div className="jefe-preview-metric"><strong>{detail.carpeta ? 'Si' : 'No'}</strong><span>Carpeta guardada</span></div>
            </div>

            <div className="jefe-preview-section">
              <h3>Datos generales</h3>
              <table className="data-table">
                <tbody>
                  <tr><td>Docente</td><td>{detail.materia.docente_nombre} {detail.materia.docente_apellido}</td></tr>
                  <tr><td>Materia</td><td>{detail.materia.nombre} ({detail.materia.codigo}) - Grupo {detail.materia.grupo}</td></tr>
                  <tr><td>Carrera</td><td>{detail.materia.carrera_nombre}</td></tr>
                  <tr><td>Ultima actualizacion</td><td>{detail.carpeta?.updated_at ? new Date(detail.carpeta.updated_at).toLocaleString('es-ES') : 'Sin carpeta guardada'}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="jefe-preview-section">
              <h3>Horarios registrados</h3>
              <table className="data-table">
                <thead><tr><th>Dia</th><th>Horario</th></tr></thead>
                <tbody>
                  {(parseFolderData(detail).datos?.horario || []).map((row) => (
                    <tr key={row.dia}><td>{row.dia}</td><td>{row.horas || '-'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" type="button" onClick={() => exportFolderPdf(detail)}>
                Descargar PDF para imprimir
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
