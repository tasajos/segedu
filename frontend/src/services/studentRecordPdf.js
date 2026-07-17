import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const NAVY = [15, 32, 68];
const BLUE = [36, 84, 214];
const LIGHT = [240, 244, 251];

const safe = (value) => value == null || value === '' ? '-' : String(value);
const dateOnly = (value) => {
  if (!value) return '-';
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day).toLocaleDateString('es-BO') : raw;
};

const fileSlug = (value) => String(value || 'estudiante')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();

const loadImage = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const addHeader = (doc, logo, favicon, student, section) => {
  if (logo) doc.addImage(logo, 'PNG', 13, 7, 21, 21);
  doc.setFillColor(...NAVY);
  doc.roundedRect(39, 8, 238, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Expediente integral del estudiante', 45, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`${student.nombre || ''} ${student.apellido || ''} - ${section}`, 45, 22);
  if (favicon) doc.addImage(favicon, 'PNG', 280, 9, 14, 14);
};

const addFooter = (doc) => {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(220, 226, 237);
    doc.line(13, 199, 284, 199);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(105, 115, 135);
    doc.text(`SEGEDU - Documento generado el ${new Date().toLocaleString('es-BO')}`, 13, 204);
    doc.text(`Pagina ${page} de ${pages}`, 284, 204, { align: 'right' });
  }
};

const table = (doc, head, body, options = {}) => autoTable(doc, {
  startY: options.startY || 35,
  head: [head],
  body: body.length ? body : [['Sin registros']],
  theme: 'grid',
  headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold' },
  alternateRowStyles: { fillColor: [248, 250, 253] },
  styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak', valign: 'middle' },
  margin: { left: 13, right: 13, bottom: 13 },
  ...options
});

export const exportStudentRecordPdf = async (record) => {
  if (!record?.estudiante) return;
  const [logo, favicon] = await Promise.all([loadImage('/unicen.png'), loadImage('/ch_tr.png')]);
  const student = record.estudiante;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  addHeader(doc, logo, favicon, student, 'Informacion general');
  doc.setFillColor(...LIGHT);
  doc.roundedRect(13, 34, 271, 26, 2, 2, 'F');
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`${student.nombre || ''} ${student.apellido || ''}`.trim(), 19, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Codigo: ${safe(student.codigo_estudiante)}   |   CI: ${safe(student.ci)}   |   Semestre: ${safe(student.semestre)}`, 19, 51);
  doc.text(`Carrera: ${safe(student.carrera_nombre)}   |   Correo: ${safe(student.email)}   |   Telefono: ${safe(student.telefono)}`, 19, 57);

  const totalFaltas = (record.asistenciasPorMateria || []).reduce((sum, item) => sum + Number(item.faltas || 0), 0);
  table(doc, ['Indicador', 'Valor'], [
    ['Materias con nota', record.resumenNotas?.total_materias || 0],
    ['Materias aprobadas', record.resumenNotas?.aprobadas || 0],
    ['Materias reprobadas', record.resumenNotas?.reprobadas || 0],
    ['Faltas acumuladas', totalFaltas]
  ], { startY: 68, tableWidth: 125, columnStyles: { 1: { halign: 'center', fontStyle: 'bold', textColor: BLUE } } });

  doc.addPage();
  addHeader(doc, logo, favicon, student, 'Notas de todas las materias');
  table(doc,
    ['Materia', 'Codigo', 'Periodo', 'Modalidad', '1P', '2P', 'Final', 'Recuperacion', 'Total', 'Estado'],
    (record.notas || []).map((item) => [item.materia_nombre, item.materia_codigo, safe(item.periodo), safe(item.modalidad), safe(item.primer_parcial), safe(item.segundo_parcial), safe(item.examen_final), safe(item.examen_recuperacion), safe(item.nota_final), safe(item.estado)]),
    { columnStyles: { 0: { cellWidth: 52 }, 9: { fontStyle: 'bold' } } }
  );

  doc.addPage();
  addHeader(doc, logo, favicon, student, 'Asistencia por materia');
  table(doc,
    ['Materia', 'Codigo', 'Registros', 'Presentes', 'Faltas', 'Permisos', 'Tardanzas'],
    (record.asistenciasPorMateria || []).map((item) => [item.materia_nombre, item.materia_codigo, item.total_registros, item.presentes, item.faltas, item.permisos, item.tardanzas]),
    { columnStyles: { 0: { cellWidth: 80 }, 4: { textColor: [190, 35, 50], fontStyle: 'bold' } } }
  );

  doc.addPage();
  addHeader(doc, logo, favicon, student, 'Detalle de faltas por fecha');
  table(doc,
    ['Fecha', 'Materia', 'Estado', 'Justificacion'],
    (record.asistenciasDetalle || []).filter((item) => item.estado === 'falta').map((item) => [dateOnly(item.fecha), item.materia_nombre, 'Falta', safe(item.justificacion)]),
    { columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 75 }, 2: { cellWidth: 25, textColor: [190, 35, 50], fontStyle: 'bold' } } }
  );

  doc.addPage();
  addHeader(doc, logo, favicon, student, 'Comportamiento y disciplina');
  const behavior = [
    ...(record.comentarios || []).map((item) => ({ fecha: item.created_at, tipo: item.tipo, materia: item.materia_nombre, detalle: item.comentario, responsable: `${item.docente_nombre || ''} ${item.docente_apellido || ''}`.trim() })),
    ...(record.disciplina || []).map((item) => ({ fecha: item.fecha, tipo: item.tipo, materia: item.materia_nombre, detalle: item.descripcion, responsable: `${item.registrado_nombre || ''} ${item.registrado_apellido || ''}`.trim() }))
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  table(doc,
    ['Fecha', 'Tipo', 'Materia', 'Detalle', 'Registrado por'],
    behavior.map((item) => [dateOnly(item.fecha), safe(item.tipo), safe(item.materia || 'General'), safe(item.detalle), safe(item.responsable)]),
    { columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 28 }, 2: { cellWidth: 48 }, 3: { cellWidth: 110 } } }
  );

  addFooter(doc);
  doc.save(`expediente-${fileSlug(`${student.apellido}-${student.nombre}-${student.codigo_estudiante}`)}.pdf`);
};
