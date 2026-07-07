import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import './CarpetaPedagogica.css';

const TABS = [
  { key: 'caratula', label: 'Caratula' },
  { key: 'datos', label: 'Datos grles.' },
  { key: 'seguimiento', label: 'Seguimiento' },
  { key: 'asistencia', label: 'Asistencia' },
  { key: 'bibliografia', label: 'Bibliografia' },
  { key: 'diagnostica', label: 'Ev. diag.' },
  { key: 'evaluacion', label: 'Evaluacion' },
  { key: 'primer', label: '1er parcial' },
  { key: 'segundo', label: '2do parcial' },
  { key: 'final', label: 'Final' }
];

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const SCHEDULE_PRESETS = [
  { label: '07:00 - 08:30', start: '07:00', end: '08:30' },
  { label: '08:30 - 10:00', start: '08:30', end: '10:00' },
  { label: '10:00 - 11:30', start: '10:00', end: '11:30' },
  { label: '18:40 - 20:10', start: '18:40', end: '20:10' },
  { label: '20:10 - 21:40', start: '20:10', end: '21:40' },
  { label: '21:40 - 23:10', start: '21:40', end: '23:10' }
];
const MODALIDADES = [
  'Examen teorico',
  'Examen practico',
  'Investigacion',
  'Tareas y/o exposiciones',
  'Asistencia'
];
const ATTENDANCE_STATUS = [
  { value: 'presente', label: 'Presente' },
  { value: 'falta', label: 'Falta' },
  { value: 'permiso', label: 'Permiso' },
  { value: 'tarde', label: 'Tarde' }
];

const DIAG_QUESTIONS = [
  'Conoces algun concepto de comunicacion? Mencionalo.',
  'Que barreras de la comunicacion conoces?',
  'A que nos referimos cuando una organizacion es plana o vertical?',
  'Que es el liderazgo? Puedes mencionar algunos tipos?',
  'A que se refiere el liderazgo transaccional?'
];

const today = () => new Date().toISOString().slice(0, 10);
const normalizeDateKey = (value) => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const numberValue = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const fullName = (user) => [user?.nombre, user?.apellido].filter(Boolean).join(' ');

const sanitizeFileName = (value) => String(value || 'carpeta')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9_-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

const deepMerge = (base, saved) => {
  if (!saved || typeof saved !== 'object') return base;
  const output = Array.isArray(base) ? [...base] : { ...base };
  Object.keys(saved).forEach((key) => {
    if (Array.isArray(saved[key])) output[key] = saved[key];
    else if (saved[key] && typeof saved[key] === 'object' && base[key]) {
      output[key] = deepMerge(base[key], saved[key]);
    } else {
      output[key] = saved[key];
    }
  });
  return output;
};

const makeSeguimientoRows = () => Array.from({ length: 18 }, (_, index) => ({
  semana: String(Math.floor(index / 2) + 1),
  fecha: '',
  numero: String(index + 1),
  unidad: '',
  contenidos: '',
  practica: '',
  estudiantes: '',
  observaciones: ''
}));

const makeSeguimientoRow = (index) => ({
  semana: String(Math.floor(index / 2) + 1),
  fecha: '',
  numero: String(index + 1),
  unidad: '',
  contenidos: '',
  practica: '',
  estudiantes: '',
  observaciones: ''
});

const makeBibliografiaRows = () => Array.from({ length: 10 }, (_, index) => ({
  numero: String(index + 1),
  titulo: '',
  autor: '',
  editorial: '',
  edicion: '',
  lugar: ''
}));

const makeBibliografiaRow = (index) => ({
  numero: String(index + 1),
  titulo: '',
  autor: '',
  editorial: '',
  edicion: '',
  lugar: ''
});

const makeDiagnosticaQuestion = (index) => ({
  numero: index + 1,
  texto: ''
});

const makeInforme = (parcial) => ({
  fecha: today(),
  inscritos: '',
  rindieron: '',
  aprobados: '',
  reprobados: '',
  abandonaron: '',
  ultimoTema: '',
  clasesImpartidas: '',
  clases80: '',
  avance: '',
  asistencia: '',
  observaciones: '',
  parcial
});

const makeEvaluacionRows = (estudiantes = []) => estudiantes.map((student, index) => ({
  estudiante_id: student.id,
  numero: index + 1,
  estudiante: `${student.apellido || ''} ${student.nombre || ''}`.trim(),
  codigo: student.codigo_estudiante || '',
  p1Trabajo1: '',
  p1Trabajo2: '',
  p1Trabajo3: '',
  p1Participacion: '',
  p1Examen: '',
  p2Trabajo1: '',
  p2Trabajo2: '',
  p2Participacion: '',
  p2Examen: '',
  finalTrabajo: '',
  finalPractico: '',
  finalExamen: '',
  segundaInstancia: ''
}));

const makeActaEvaluationRows = (detalles = []) => detalles.map((row, index) => ({
  estudiante_id: row.estudiante_id,
  numero: index + 1,
  estudiante: `${row.apellido || ''} ${row.nombre || ''}`.trim(),
  codigo: row.codigo_estudiante || '',
  modalidad: row.modalidad || 'regular',
  primer_parcial: row.primer_parcial ?? '',
  segundo_parcial: row.segundo_parcial ?? '',
  examen_final: row.examen_final ?? '',
  examen_recuperacion: row.examen_recuperacion ?? '',
  nota_final: row.nota_final ?? '',
  estado: row.estado || ''
}));

const createDefaultFolder = ({ materia, user, estudiantes }) => ({
  caratula: {
    gestion: 'I-2026',
    semestre: materia?.semestre ? String(materia.semestre) : '',
    asignatura: materia?.nombre || '',
    grupo: materia?.grupo || '',
    carrera: materia?.carrera_nombre || '',
    docente: fullName(user),
    turno: '',
    fechaEntrega: today()
  },
  datos: {
    horario: DAYS.map((dia) => ({ dia, horas: '' })),
    modalidades: MODALIDADES.map((nombre) => ({
      nombre,
      primer: nombre === 'Asistencia' ? '5' : nombre === 'Tareas y/o exposiciones' ? '10' : nombre === 'Examen teorico' ? '20' : '0',
      segundo: nombre === 'Asistencia' ? '5' : nombre === 'Tareas y/o exposiciones' ? '10' : nombre === 'Examen teorico' ? '20' : '0',
      final: nombre === 'Tareas y/o exposiciones' ? '10' : nombre === 'Examen teorico' ? '20' : '0',
      segunda: nombre === 'Examen teorico' ? '100' : '0'
    })),
    fechaEntrega: today(),
    nota: 'De acuerdo a la metodologia, el docente debe detallar el puntaje de evaluacion.'
  },
  seguimiento: { rows: makeSeguimientoRows() },
  bibliografia: { rows: makeBibliografiaRows() },
  diagnostica: {
    fecha: today(),
    preguntas: DIAG_QUESTIONS.map((texto, index) => ({ numero: index + 1, texto })),
    informe: makeInforme('Diagnostica'),
    conclusiones: ''
  },
  evaluacion: { rows: makeEvaluacionRows(estudiantes) },
  informes: {
    primer: makeInforme('Primer parcial'),
    segundo: makeInforme('Segundo parcial'),
    final: makeInforme('Evaluacion final')
  }
});

const syncEvaluationStudents = (folder, estudiantes) => {
  const currentRows = folder?.evaluacion?.rows || [];
  const byId = new Map(currentRows.map((row) => [Number(row.estudiante_id), row]));
  return {
    ...folder,
    evaluacion: {
      ...folder.evaluacion,
      rows: estudiantes.map((student, index) => ({
        ...makeEvaluacionRows([student])[0],
        ...(byId.get(Number(student.id)) || {}),
        numero: index + 1,
        estudiante_id: student.id,
        estudiante: `${student.apellido || ''} ${student.nombre || ''}`.trim(),
        codigo: student.codigo_estudiante || ''
      }))
    }
  };
};

const rowTotals = (row) => {
  if (Object.prototype.hasOwnProperty.call(row, 'nota_final')) {
    const primer = numberValue(row.primer_parcial);
    const segundo = numberValue(row.segundo_parcial);
    const final = numberValue(row.examen_final);
    const total = numberValue(row.nota_final);
    return {
      primer,
      segundo,
      final,
      total,
      estado: row.estado === 'aprobado' || total >= 51 ? 'Aprobado' : 'Reprobado'
    };
  }

  const primer = numberValue(row.p1Trabajo1) + numberValue(row.p1Trabajo2) +
    numberValue(row.p1Trabajo3) + numberValue(row.p1Participacion) + numberValue(row.p1Examen);
  const segundo = numberValue(row.p2Trabajo1) + numberValue(row.p2Trabajo2) +
    numberValue(row.p2Participacion) + numberValue(row.p2Examen);
  const final = numberValue(row.finalTrabajo) + numberValue(row.finalPractico) + numberValue(row.finalExamen);
  const totalRegular = primer + segundo + final;
  const segundaInstancia = numberValue(row.segundaInstancia);
  const total = segundaInstancia > 0 ? segundaInstancia : totalRegular;
  return {
    primer,
    segundo,
    final,
    total,
    estado: total >= 51 ? 'Aprobado' : 'Reprobado'
  };
};

const partialStats = (rows, type) => {
  const getScore = (row) => {
    const totals = rowTotals(row);
    if (type === 'primer') return totals.primer;
    if (type === 'segundo') return totals.segundo;
    return totals.total;
  };
  const passScore = type === 'final' ? 51 : 18;
  const evaluated = rows.filter((row) => getScore(row) > 0);
  return {
    inscritos: rows.length,
    rindieron: evaluated.length,
    aprobados: evaluated.filter((row) => getScore(row) >= passScore).length,
    reprobados: evaluated.filter((row) => getScore(row) < passScore).length
  };
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

const addWorksheetTable = (sheet, title, headers, rows) => {
  sheet.addRow([title]);
  sheet.mergeCells(1, 1, 1, Math.max(headers.length, 2));
  sheet.getCell(1, 1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  sheet.getCell(1, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2044' } };
  sheet.getCell(1, 1).alignment = { horizontal: 'center' };
  sheet.addRow([]);
  const header = sheet.addRow(headers);
  header.font = { bold: true, color: { argb: 'FF0F2044' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
  rows.forEach((row) => sheet.addRow(row));
  sheet.columns = headers.map(() => ({ width: 22 }));
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });
};

const buildAttendanceMatrix = (estudiantes, asistenciaRecords) => {
  const dates = Array.from(new Set(asistenciaRecords.map((row) => normalizeDateKey(row.fecha)))).sort();
  return estudiantes.map((student, index) => {
    const row = {
      estudiante_id: student.id,
      numero: index + 1,
      estudiante: `${student.apellido || ''} ${student.nombre || ''}`.trim(),
      codigo: student.codigo_estudiante || ''
    };
    dates.forEach((date) => {
      const found = asistenciaRecords.find((item) => (
        Number(item.estudiante_id) === Number(student.id) && normalizeDateKey(item.fecha) === date
      ));
      row[date] = found?.estado || '';
    });
    return row;
  });
};

export default function CarpetaPedagogica() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('caratula');
  const [schedulePicker, setSchedulePicker] = useState({ index: 0, inicio: '', fin: '' });
  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);
  const [asistencia, setAsistencia] = useState([]);
  const [evaluationActa, setEvaluationActa] = useState({ acta: null, detalles: [] });
  const [newAttendanceDate, setNewAttendanceDate] = useState(today());
  const [messageModal, setMessageModal] = useState(null);
  const [folder, setFolder] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const materia = materias.find((item) => String(item.id) === String(materiaId));

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/docente/materias');
        setMaterias(data);
        if (data.length) setMateriaId(String(data[0].id));
        else setLoading(false);
      } catch {
        setMaterias([]);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!materiaId) return;
    (async () => {
      setLoading(true);
      try {
        const year = new Date().getFullYear();
        const [studentsRes, folderRes, attendanceRes, evaluationRes] = await Promise.all([
          api.get(`/docente/materias/${materiaId}/estudiantes`),
          api.get(`/docente/carpeta-pedagogica/${materiaId}`),
          api.get('/docente/asistencia/reporte', {
            params: { materia_id: materiaId, desde: `${year}-01-01`, hasta: `${year}-12-31`, periodo: 'rango' }
          }).catch(() => ({ data: { registros: [] } })),
          api.get(`/docente/carpeta-pedagogica/${materiaId}/evaluacion`).catch(() => ({ data: { acta: null, detalles: [] } }))
        ]);

        const students = studentsRes.data || [];
        const currentMateria = folderRes.data.materia || materias.find((item) => String(item.id) === String(materiaId));
        const base = createDefaultFolder({ materia: currentMateria, user, estudiantes: students });
        const merged = syncEvaluationStudents(deepMerge(base, folderRes.data.data), students);

        setEstudiantes(students);
        setFolder(merged);
        const [inicio = '', fin = ''] = String(merged.datos?.horario?.[0]?.horas || '').split(' - ');
        setSchedulePicker({ index: 0, inicio, fin });
        setUpdatedAt(folderRes.data.updated_at || null);
        setAsistencia((attendanceRes.data.registros || []).map((row) => ({
          ...row,
          fecha: normalizeDateKey(row.fecha)
        })));
        setEvaluationActa({
          acta: evaluationRes.data.acta || null,
          detalles: makeActaEvaluationRows(evaluationRes.data.detalles || [])
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [materiaId, user]);

  const evaluationRows = evaluationActa.detalles || [];
  const attendanceDates = useMemo(() => Array.from(new Set(asistencia.map((row) => normalizeDateKey(row.fecha)))).sort(), [asistencia]);
  const attendanceMatrix = useMemo(
    () => buildAttendanceMatrix(estudiantes, asistencia),
    [estudiantes, asistencia]
  );
  const stats = useMemo(() => ({
    primer: partialStats(evaluationRows, 'primer'),
    segundo: partialStats(evaluationRows, 'segundo'),
    final: partialStats(evaluationRows, 'final')
  }), [evaluationRows]);

  const updateSection = (section, key, value) => {
    setFolder((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const updateNested = (section, group, key, value) => {
    setFolder((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [group]: {
          ...prev[section][group],
          [key]: value
        }
      }
    }));
  };

  const updateArrayItem = (section, key, index, field, value) => {
    setFolder((prev) => {
      const rows = [...prev[section][key]];
      rows[index] = { ...rows[index], [field]: value };
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: rows
        }
      };
    });
  };

  const addSeguimientoRow = () => {
    setFolder((prev) => {
      const currentRows = prev.seguimiento?.rows || [];
      return {
        ...prev,
        seguimiento: {
          ...prev.seguimiento,
          rows: [
            ...currentRows,
            makeSeguimientoRow(currentRows.length)
          ]
        }
      };
    });
  };

  const addBibliografiaRow = () => {
    setFolder((prev) => {
      const currentRows = prev.bibliografia?.rows || [];
      return {
        ...prev,
        bibliografia: {
          ...prev.bibliografia,
          rows: [
            ...currentRows,
            makeBibliografiaRow(currentRows.length)
          ]
        }
      };
    });
  };

  const addDiagnosticaQuestion = () => {
    setFolder((prev) => {
      const currentRows = prev.diagnostica?.preguntas || [];
      return {
        ...prev,
        diagnostica: {
          ...prev.diagnostica,
          preguntas: [
            ...currentRows,
            makeDiagnosticaQuestion(currentRows.length)
          ]
        }
      };
    });
  };

  const updateInforme = (name, key, value) => {
    setFolder((prev) => ({
      ...prev,
      informes: {
        ...prev.informes,
        [name]: {
          ...prev.informes[name],
          [key]: value
        }
      }
    }));
  };

  const openSchedulePicker = (index) => {
    const current = folder?.datos?.horario?.[index];
    const [inicio = '', fin = ''] = String(current?.horas || '').split(' - ');
    setSchedulePicker({ index, inicio, fin });
  };

  const applySchedulePreset = (preset) => {
    setSchedulePicker((prev) => ({
      ...prev,
      inicio: preset.start,
      fin: preset.end
    }));
  };

  const applySchedulePicker = () => {
    if (!schedulePicker.inicio || !schedulePicker.fin) return;
    const horas = `${schedulePicker.inicio} - ${schedulePicker.fin}`;
    updateArrayItem('datos', 'horario', schedulePicker.index, 'horas', horas);
  };

  const clearSchedulePicker = () => {
    updateArrayItem('datos', 'horario', schedulePicker.index, 'horas', '');
    setSchedulePicker((prev) => ({ ...prev, inicio: '', fin: '' }));
  };

  const updateAttendanceCell = (estudianteId, fecha, estado) => {
    setAsistencia((prev) => {
      const targetDate = normalizeDateKey(fecha);
      const exists = prev.some((row) => Number(row.estudiante_id) === Number(estudianteId) && normalizeDateKey(row.fecha) === targetDate);
      if (exists) {
        return prev.map((row) => (
          Number(row.estudiante_id) === Number(estudianteId) && normalizeDateKey(row.fecha) === targetDate
            ? { ...row, estado }
            : row
        ));
      }

      const student = estudiantes.find((item) => Number(item.id) === Number(estudianteId));
      return [
        ...prev,
        {
          estudiante_id: estudianteId,
          materia_id: Number(materiaId),
          fecha: targetDate,
          estado,
          nombre: student?.nombre || '',
          apellido: student?.apellido || '',
          codigo_estudiante: student?.codigo_estudiante || ''
        }
      ];
    });
  };

  const addAttendanceDate = () => {
    if (!newAttendanceDate) return;
    setAsistencia((prev) => {
      const next = [...prev];
      estudiantes.forEach((student) => {
        const targetDate = normalizeDateKey(newAttendanceDate);
        const exists = next.some((row) => Number(row.estudiante_id) === Number(student.id) && normalizeDateKey(row.fecha) === targetDate);
        if (!exists) {
          next.push({
            estudiante_id: student.id,
            materia_id: Number(materiaId),
            fecha: targetDate,
            estado: 'presente',
            nombre: student.nombre,
            apellido: student.apellido,
            codigo_estudiante: student.codigo_estudiante
          });
        }
      });
      return next;
    });
  };

  const buildAttendanceSavePayload = () => asistencia
    .filter((row) => row.fecha && row.estado && row.estudiante_id)
    .map((row) => ({
      estudiante_id: row.estudiante_id,
      fecha: normalizeDateKey(row.fecha),
      estado: row.estado,
      justificacion: row.justificacion || null
    }));

  const saveFolder = async () => {
    if (!materiaId || !folder) return;
    setSaving(true);
    try {
      await api.put(`/docente/carpeta-pedagogica/${materiaId}/asistencia`, {
        registros: buildAttendanceSavePayload()
      });
      await api.put(`/docente/carpeta-pedagogica/${materiaId}`, { data: folder });
      setUpdatedAt(new Date().toISOString());
      setMessageModal({
        type: 'success',
        title: 'Carpeta guardada',
        message: 'La carpeta pedagogica y los cambios de asistencia se guardaron correctamente.'
      });
    } catch (err) {
      setMessageModal({
        type: 'error',
        title: 'No se pudo guardar',
        message: err.response?.data?.error || 'No se pudo guardar la carpeta pedagogica.'
      });
    } finally {
      setSaving(false);
    }
  };

  const exportPdf = async () => {
    if (!folder) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const logo = await loadLogo();
    const title = `Carpeta pedagogica - ${folder.caratula.asignatura || materia?.nombre || ''}`;
    const addHeader = (subtitle) => {
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

    addHeader('Caratula y datos generales');
    autoTable(doc, {
      startY: 40,
      head: [['Campo', 'Valor']],
      body: Object.entries(folder.caratula).map(([key, value]) => [key, value || '']),
      theme: 'grid',
      headStyles: { fillColor: [15, 32, 68] }
    });

    const sections = [
      {
        title: 'Datos generales de la asignatura',
        headers: ['Modalidad', '1er parcial', '2do parcial', 'Final', '2da instancia'],
        rows: folder.datos.modalidades.map((row) => [row.nombre, row.primer, row.segundo, row.final, row.segunda])
      },
      {
        title: 'Seguimiento de actividades academicas',
        headers: ['Semana', 'Fecha', 'Nro', 'Unidad', 'Contenidos', 'Practica', 'Estudiantes', 'Obs.'],
        rows: folder.seguimiento.rows.map((row) => [
          row.semana, row.fecha, row.numero, row.unidad, row.contenidos, row.practica, row.estudiantes, row.observaciones
        ])
      },
      {
        title: 'Bibliografia',
        headers: ['Nro', 'Titulo', 'Autor', 'Editorial', 'Edicion y ano', 'Lugar'],
        rows: folder.bibliografia.rows.map((row) => [row.numero, row.titulo, row.autor, row.editorial, row.edicion, row.lugar])
      },
      {
        title: 'Evaluacion diagnostica',
        headers: ['Nro', 'Pregunta'],
        rows: folder.diagnostica.preguntas.map((row) => [row.numero, row.texto])
      },
      {
        title: 'Evaluacion',
        headers: ['Nro', 'Estudiante', 'Codigo', 'Modalidad', '1P', '2P', 'Final', 'Recuperacion', 'Total', 'Estado'],
        rows: evaluationRows.map((row) => {
          const totals = rowTotals(row);
          return [
            row.numero,
            row.estudiante,
            row.codigo,
            row.modalidad,
            row.primer_parcial ?? '',
            row.segundo_parcial ?? '',
            row.examen_final ?? '',
            row.examen_recuperacion ?? '',
            totals.total,
            totals.estado
          ];
        })
      },
      {
        title: 'Asistencia',
        headers: ['Nro', 'Estudiante', 'Codigo', ...attendanceDates],
        rows: attendanceMatrix.map((row) => [row.numero, row.estudiante, row.codigo, ...attendanceDates.map((date) => row[date] || '')])
      },
      {
        title: 'Informe 1er parcial',
        headers: ['Campo', 'Valor'],
        rows: Object.entries(folder.informes.primer).map(([key, value]) => [key, value || ''])
      },
      {
        title: 'Informe 2do parcial',
        headers: ['Campo', 'Valor'],
        rows: Object.entries(folder.informes.segundo).map(([key, value]) => [key, value || ''])
      },
      {
        title: 'Informe final',
        headers: ['Campo', 'Valor'],
        rows: Object.entries(folder.informes.final).map(([key, value]) => [key, value || ''])
      }
    ];

    sections.forEach((section) => {
      doc.addPage();
      addHeader(section.title);
      autoTable(doc, {
        startY: 40,
        head: [section.headers],
        body: section.rows,
        theme: 'grid',
        headStyles: { fillColor: [15, 32, 68], fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 1.6, overflow: 'linebreak' }
      });
    });

    doc.save(`${sanitizeFileName(title)}.pdf`);
  };

  const exportExcel = async () => {
    if (!folder) return;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SEGEDU';
    workbook.created = new Date();

    addWorksheetTable(
      workbook.addWorksheet('Caratula'),
      'Carpeta pedagogica',
      ['Campo', 'Valor'],
      Object.entries(folder.caratula).map(([key, value]) => [key, value || ''])
    );
    addWorksheetTable(
      workbook.addWorksheet('Datos Grles'),
      'Datos generales',
      ['Modalidad', '1er parcial', '2do parcial', 'Final', '2da instancia'],
      folder.datos.modalidades.map((row) => [row.nombre, row.primer, row.segundo, row.final, row.segunda])
    );
    addWorksheetTable(
      workbook.addWorksheet('Seguimiento'),
      'Seguimiento de actividades academicas',
      ['Semana', 'Fecha', 'Nro', 'Unidad', 'Contenidos', 'Practica', 'Estudiantes', 'Observaciones'],
      folder.seguimiento.rows.map((row) => [row.semana, row.fecha, row.numero, row.unidad, row.contenidos, row.practica, row.estudiantes, row.observaciones])
    );
    addWorksheetTable(
      workbook.addWorksheet('Asistencia'),
      'Lista de asistencia',
      ['Nro', 'Estudiante', 'Codigo', ...attendanceDates],
      attendanceMatrix.map((row) => [row.numero, row.estudiante, row.codigo, ...attendanceDates.map((date) => row[date] || '')])
    );
    addWorksheetTable(
      workbook.addWorksheet('Bibliografia'),
      'Bibliografia',
      ['Nro', 'Titulo', 'Autor', 'Editorial', 'Edicion y ano', 'Lugar'],
      folder.bibliografia.rows.map((row) => [row.numero, row.titulo, row.autor, row.editorial, row.edicion, row.lugar])
    );
    addWorksheetTable(
      workbook.addWorksheet('Ev Diag'),
      'Evaluacion diagnostica',
      ['Nro', 'Pregunta'],
      folder.diagnostica.preguntas.map((row) => [row.numero, row.texto])
    );
    addWorksheetTable(
      workbook.addWorksheet('Evaluacion'),
      'Evaluacion',
      ['Nro', 'Estudiante', 'Codigo', 'Modalidad', '1P', '2P', 'Final', 'Recuperacion', 'Total', 'Estado'],
      evaluationRows.map((row) => {
        const totals = rowTotals(row);
        return [
          row.numero,
          row.estudiante,
          row.codigo,
          row.modalidad,
          row.primer_parcial ?? '',
          row.segundo_parcial ?? '',
          row.examen_final ?? '',
          row.examen_recuperacion ?? '',
          totals.total,
          totals.estado
        ];
      })
    );

    ['primer', 'segundo', 'final'].forEach((key) => {
      const informe = folder.informes[key];
      addWorksheetTable(
        workbook.addWorksheet(key === 'primer' ? '1erP' : key === 'segundo' ? '2doP' : 'Final'),
        informe.parcial,
        ['Campo', 'Valor'],
        Object.entries(informe).map(([field, value]) => [field, value || ''])
      );
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${sanitizeFileName(`carpeta-${folder.caratula.asignatura}`)}.xlsx`);
  };

  const renderInput = (label, value, onChange, props = {}) => (
    <div className="ped-field">
      <label>{label}</label>
      <input className="ped-input" value={value || ''} onChange={(event) => onChange(event.target.value)} {...props} />
    </div>
  );

  const renderCaratula = () => (
    <div className="ped-grid">
      {renderInput('Gestion', folder.caratula.gestion, (value) => updateSection('caratula', 'gestion', value))}
      {renderInput('Semestre', folder.caratula.semestre, (value) => updateSection('caratula', 'semestre', value))}
      {renderInput('Asignatura', folder.caratula.asignatura, (value) => updateSection('caratula', 'asignatura', value))}
      {renderInput('Grupo', folder.caratula.grupo, (value) => updateSection('caratula', 'grupo', value))}
      {renderInput('Carrera', folder.caratula.carrera, (value) => updateSection('caratula', 'carrera', value))}
      {renderInput('Docente', folder.caratula.docente, (value) => updateSection('caratula', 'docente', value))}
      {renderInput('Turno', folder.caratula.turno, (value) => updateSection('caratula', 'turno', value))}
      {renderInput('Fecha de entrega', folder.caratula.fechaEntrega, (value) => updateSection('caratula', 'fechaEntrega', value), { type: 'date' })}
    </div>
  );

  const renderDatos = () => {
    const selectedDay = folder.datos.horario[schedulePicker.index] || folder.datos.horario[0];
    return (
    <>
      <div className="ped-schedule">
        <div className="ped-schedule-list">
          <div className="ped-schedule-heading">Horario academico</div>
          {folder.datos.horario.map((row, index) => (
            <button
              key={row.dia}
              type="button"
              className={`ped-schedule-day ${schedulePicker.index === index ? 'active' : ''}`}
              onClick={() => openSchedulePicker(index)}
            >
              <span>{row.dia}</span>
              <strong>{row.horas || 'Sin horario'}</strong>
            </button>
          ))}
        </div>

        <div className="ped-time-picker">
          <div>
            <div className="text-mono" style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>DIA SELECCIONADO</div>
            <h3>{selectedDay?.dia || 'Horario'}</h3>
          </div>

          <div className="ped-time-preview">
            <span>Vista previa</span>
            <strong>{schedulePicker.inicio && schedulePicker.fin ? `${schedulePicker.inicio} - ${schedulePicker.fin}` : selectedDay?.horas || 'Seleccione un rango'}</strong>
          </div>

          <div className="ped-time-grid">
            <div className="ped-field">
              <label>Inicio</label>
              <input
                className="ped-input"
                type="time"
                value={schedulePicker.inicio}
                onChange={(event) => setSchedulePicker((prev) => ({ ...prev, inicio: event.target.value }))}
              />
            </div>
            <div className="ped-field">
              <label>Fin</label>
              <input
                className="ped-input"
                type="time"
                value={schedulePicker.fin}
                onChange={(event) => setSchedulePicker((prev) => ({ ...prev, fin: event.target.value }))}
              />
            </div>
          </div>

          <div className="ped-preset-grid">
            {SCHEDULE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`ped-preset ${schedulePicker.inicio === preset.start && schedulePicker.fin === preset.end ? 'active' : ''}`}
                onClick={() => applySchedulePreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="ped-picker-actions">
            <button className="btn btn-ghost" type="button" onClick={clearSchedulePicker}>Quitar</button>
            <button className="btn btn-primary" type="button" onClick={applySchedulePicker} disabled={!schedulePicker.inicio || !schedulePicker.fin}>
              Aplicar horario
            </button>
          </div>
          <div className="text-muted" style={{ fontSize: '.8rem' }}>
            El horario aplicado se ve de inmediato en la lista. Para guardarlo definitivamente use el boton Guardar de la carpeta.
          </div>
        </div>
      </div>

      <div className="ped-table-wrap">
        <table className="ped-table">
          <thead>
            <tr><th>Modalidad</th><th>1er parcial</th><th>2do parcial</th><th>Final</th><th>2da instancia</th></tr>
          </thead>
          <tbody>
            {folder.datos.modalidades.map((row, index) => (
              <tr key={row.nombre}>
                <td>{row.nombre}</td>
                {['primer', 'segundo', 'final', 'segunda'].map((field) => (
                  <td key={field}>
                    <input className="ped-input" type="number" value={row[field] || ''} onChange={(event) => updateArrayItem('datos', 'modalidades', index, field, event.target.value)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ped-field">
        <label>Nota metodologica</label>
        <textarea className="ped-textarea" value={folder.datos.nota || ''} onChange={(event) => updateSection('datos', 'nota', event.target.value)} />
      </div>
    </>
    );
  };

  const renderSeguimiento = () => (
    <div className="ped-stack">
      <div className="ped-section-tools">
        <div>
          <strong>{folder.seguimiento.rows.length} filas de seguimiento</strong>
          <span>Agrega las filas que necesites segun el avance real de la materia.</span>
        </div>
        <button className="btn btn-primary" type="button" onClick={addSeguimientoRow}>
          + Agregar fila
        </button>
      </div>

      <div className="ped-table-wrap">
        <table className="ped-table">
          <thead>
            <tr>
              <th>Semana</th><th>Fecha</th><th>Nro</th><th>Unidad / tema</th><th>Contenidos</th><th>Practica</th><th>Estudiantes</th><th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {folder.seguimiento.rows.map((row, index) => (
              <tr key={index}>
                {['semana', 'fecha', 'numero', 'unidad', 'contenidos', 'practica', 'estudiantes', 'observaciones'].map((field) => (
                  <td key={field}>
                    {['contenidos', 'practica', 'observaciones'].includes(field) ? (
                      <textarea className="ped-textarea" value={row[field] || ''} onChange={(event) => updateArrayItem('seguimiento', 'rows', index, field, event.target.value)} />
                    ) : (
                      <input className="ped-input" type={field === 'fecha' ? 'date' : 'text'} value={row[field] || ''} onChange={(event) => updateArrayItem('seguimiento', 'rows', index, field, event.target.value)} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAsistencia = () => (
    <>
      <div className="ped-attendance-tools">
        <div className="ped-field">
          <label>Nueva fecha de asistencia</label>
          <input className="ped-input" type="date" value={newAttendanceDate} onChange={(event) => setNewAttendanceDate(event.target.value)} />
        </div>
        <button className="btn btn-primary" type="button" onClick={addAttendanceDate} disabled={!newAttendanceDate || !estudiantes.length}>
          Agregar fecha
        </button>
      </div>
      {attendanceDates.length ? (
      <div className="ped-table-wrap">
        <table className="ped-table">
          <thead>
            <tr>
              <th>Nro</th><th>Estudiante</th><th>Codigo</th>
              {attendanceDates.map((date) => <th key={date}>{date}</th>)}
            </tr>
          </thead>
          <tbody>
            {attendanceMatrix.map((row) => (
              <tr key={row.codigo || row.numero}>
                <td>{row.numero}</td>
                <td>{row.estudiante}</td>
                <td>{row.codigo}</td>
                {attendanceDates.map((date) => (
                  <td key={date}>
                    <select
                      className={`ped-attendance-select status-${row[date] || 'presente'}`}
                      value={row[date] || 'presente'}
                      onChange={(event) => updateAttendanceCell(row.estudiante_id, date, event.target.value)}
                    >
                      {ATTENDANCE_STATUS.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : (
        <div className="ped-empty">No hay listas de asistencia registradas para esta materia en la gestion actual. Agregue una fecha para iniciar la planilla.</div>
      )}
    </>
  );

  const renderBibliografia = () => (
    <div className="ped-stack">
      <div className="ped-section-tools">
        <div>
          <strong>{folder.bibliografia.rows.length} filas de bibliografia</strong>
          <span>Agrega las referencias que el docente necesite para completar la carpeta.</span>
        </div>
        <button className="btn btn-primary" type="button" onClick={addBibliografiaRow}>
          + Agregar fila
        </button>
      </div>

      <div className="ped-table-wrap">
        <table className="ped-table">
          <thead>
            <tr><th>Nro</th><th>Titulo</th><th>Autor</th><th>Editorial</th><th>Edicion y ano</th><th>Lugar de compra</th></tr>
          </thead>
          <tbody>
            {folder.bibliografia.rows.map((row, index) => (
              <tr key={index}>
                {['numero', 'titulo', 'autor', 'editorial', 'edicion', 'lugar'].map((field) => (
                  <td key={field}>
                    <input className="ped-input" value={row[field] || ''} onChange={(event) => updateArrayItem('bibliografia', 'rows', index, field, event.target.value)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDiagnostica = () => (
    <div className="ped-stack">
      {renderInput('Fecha', folder.diagnostica.fecha, (value) => updateSection('diagnostica', 'fecha', value), { type: 'date' })}
      <div className="ped-section-tools">
        <div>
          <strong>{folder.diagnostica.preguntas.length} preguntas diagnosticas</strong>
          <span>Agrega las preguntas que se aplicaron en la evaluacion diagnostica.</span>
        </div>
        <button className="btn btn-primary" type="button" onClick={addDiagnosticaQuestion}>
          + Agregar pregunta
        </button>
      </div>

      <div className="ped-table-wrap">
        <table className="ped-table">
          <thead><tr><th>Nro</th><th>Cuestionario aplicado</th></tr></thead>
          <tbody>
            {folder.diagnostica.preguntas.map((row, index) => (
              <tr key={index}>
                <td>{row.numero}</td>
                <td>
                  <textarea className="ped-textarea" value={row.texto || ''} onChange={(event) => updateArrayItem('diagnostica', 'preguntas', index, 'texto', event.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ped-field">
        <label>Conclusiones</label>
        <textarea className="ped-textarea" value={folder.diagnostica.conclusiones || ''} onChange={(event) => updateSection('diagnostica', 'conclusiones', event.target.value)} />
      </div>
    </div>
  );

  const renderEvaluacion = () => (
    <>
      <div className="ped-readonly-banner">
        <strong>Notas recuperadas desde actas entregadas.</strong>
        <span>Esta seccion es de solo lectura para el docente.</span>
      </div>
      <div className="ped-summary">
        <div className="ped-metric"><strong>{stats.final.inscritos}</strong><span>Inscritos</span></div>
        <div className="ped-metric"><strong>{stats.final.rindieron}</strong><span>Con nota</span></div>
        <div className="ped-metric"><strong>{stats.final.aprobados}</strong><span>Aprobados</span></div>
        <div className="ped-metric"><strong>{stats.final.reprobados}</strong><span>Reprobados</span></div>
      </div>
      {evaluationRows.length ? (
        <div className="ped-table-wrap">
        <table className="ped-table">
          <thead>
            <tr>
              <th>Nro</th><th>Estudiante</th><th>Codigo</th>
              <th>Modalidad</th><th>1er parcial</th><th>2do parcial</th><th>Examen final</th><th>Recuperacion</th><th>Total</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {evaluationRows.map((row) => {
              const totals = rowTotals(row);
              return (
                <tr key={row.estudiante_id}>
                  <td>{row.numero}</td>
                  <td style={{ minWidth: 220 }}>{row.estudiante}</td>
                  <td>{row.codigo}</td>
                  <td><span className="chip chip-ink">{row.modalidad}</span></td>
                  <td>{row.primer_parcial ?? '-'}</td>
                  <td>{row.segundo_parcial ?? '-'}</td>
                  <td>{row.examen_final ?? '-'}</td>
                  <td>{row.examen_recuperacion ?? '-'}</td>
                  <td className="text-mono">{totals.total}</td>
                  <td className={totals.estado === 'Aprobado' ? 'ped-status-ok' : 'ped-status-bad'}>{totals.estado}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      ) : (
        <div className="ped-empty">No existe un acta entregada para esta materia. Cuando Jefatura cargue el acta, las notas apareceran aqui automaticamente.</div>
      )}
    </>
  );

  const renderInforme = (key, label, stat) => {
    const informe = folder.informes[key];
    return (
      <>
        <div className="ped-summary">
          <div className="ped-metric"><strong>{stat.inscritos}</strong><span>Inscritos</span></div>
          <div className="ped-metric"><strong>{stat.rindieron}</strong><span>Rindieron</span></div>
          <div className="ped-metric"><strong>{stat.aprobados}</strong><span>Aprobados</span></div>
          <div className="ped-metric"><strong>{stat.reprobados}</strong><span>Reprobados</span></div>
        </div>
        <div className="ped-grid two">
          {renderInput('Fecha', informe.fecha, (value) => updateInforme(key, 'fecha', value), { type: 'date' })}
          {renderInput('Ultimo tema de avance', informe.ultimoTema, (value) => updateInforme(key, 'ultimoTema', value))}
          {renderInput('Numero de clases impartidas', informe.clasesImpartidas, (value) => updateInforme(key, 'clasesImpartidas', value), { type: 'number' })}
          {renderInput('Clases con 80% de asistencia', informe.clases80, (value) => updateInforme(key, 'clases80', value), { type: 'number' })}
          {renderInput('Avance segun PGO (%)', informe.avance, (value) => updateInforme(key, 'avance', value), { type: 'number' })}
          {renderInput('Asistencia estudiantil (%)', informe.asistencia, (value) => updateInforme(key, 'asistencia', value), { type: 'number' })}
        </div>
        <div className="ped-field">
          <label>Observaciones del {label}</label>
          <textarea className="ped-textarea" value={informe.observaciones || ''} onChange={(event) => updateInforme(key, 'observaciones', event.target.value)} />
        </div>
      </>
    );
  };

  const renderTab = () => {
    if (!folder) return null;
    if (activeTab === 'caratula') return renderCaratula();
    if (activeTab === 'datos') return renderDatos();
    if (activeTab === 'seguimiento') return renderSeguimiento();
    if (activeTab === 'asistencia') return renderAsistencia();
    if (activeTab === 'bibliografia') return renderBibliografia();
    if (activeTab === 'diagnostica') return renderDiagnostica();
    if (activeTab === 'evaluacion') return renderEvaluacion();
    if (activeTab === 'primer') return renderInforme('primer', 'primer parcial', stats.primer);
    if (activeTab === 'segundo') return renderInforme('segundo', 'segundo parcial', stats.segundo);
    return renderInforme('final', 'final', stats.final);
  };

  const activeLabel = TABS.find((tab) => tab.key === activeTab)?.label || 'Carpeta';

  return (
    <>
      <PageHeader
        num="12"
        eyebrow="Gestion docente"
        title={<>Carpeta <span className="display-italic">pedagogica</span></>}
        lead="Registros de seguimiento, asistencia y evaluacion por materia."
      />

      <div className="ped-folder">
        <div className="ped-toolbar">
          <div className="ped-field">
            <label>Materia</label>
            <select className="ped-select" value={materiaId} onChange={(event) => setMateriaId(event.target.value)}>
              {materias.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre} - Grupo {item.grupo}
                </option>
              ))}
            </select>
          </div>
          <div className="ped-actions">
            <button className="btn btn-ghost" type="button" onClick={exportPdf} disabled={!folder || loading}>PDF</button>
            <button className="btn btn-ghost" type="button" onClick={exportExcel} disabled={!folder || loading}>Excel</button>
            <button className="btn btn-primary" type="button" onClick={saveFolder} disabled={!folder || saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>

        {updatedAt && (
          <div className="text-muted" style={{ fontSize: '.82rem' }}>
            Ultima actualizacion: {new Date(updatedAt).toLocaleString('es-ES')}
          </div>
        )}

        <div className="ped-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`ped-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <section className="ped-panel">
          <div className="ped-panel-head">
            <div>
              <h2>{activeLabel}</h2>
              <div className="text-muted" style={{ fontSize: '.82rem' }}>
                {materia ? `${materia.codigo} - Grupo ${materia.grupo} - ${estudiantes.length} estudiantes` : 'Seleccione una materia'}
              </div>
            </div>
            {loading && <span className="chip chip-blue">Cargando</span>}
          </div>
          <div className="ped-panel-body">
            {loading ? <div className="ped-empty">Preparando carpeta pedagogica...</div> : renderTab()}
          </div>
        </section>
      </div>

      <Modal
        open={Boolean(messageModal)}
        onClose={() => setMessageModal(null)}
        title={messageModal?.title || 'Mensaje'}
        maxWidth="520px"
      >
        {messageModal && (
          <div className={`ped-save-modal ${messageModal.type === 'success' ? 'success' : 'error'}`}>
            <div className="ped-save-icon">{messageModal.type === 'success' ? '✓' : '!'}</div>
            <div>
              <h3>{messageModal.title}</h3>
              <p>{messageModal.message}</p>
              <button className="btn btn-primary" type="button" onClick={() => setMessageModal(null)}>
                Entendido
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
