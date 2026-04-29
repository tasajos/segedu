import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const COLORS = {
  navy: [12, 47, 92],
  orange: [255, 98, 0],
  lightBlue: [228, 238, 250],
  gray: [102, 112, 133],
  green: [22, 163, 74],
  red: [220, 38, 38],
  gold: [217, 119, 6],
  blue: [37, 99, 235]
};

const STATUS_LABELS = {
  presente: 'Presente',
  falta: 'Falta',
  permiso: 'Permiso',
  tarde: 'Tarde'
};

const statusColorHex = {
  presente: '16A34A',
  falta: 'DC2626',
  permiso: 'D97706',
  tarde: '2563EB'
};

const formatDateEs = (value) => {
  if (!value) return '';
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return String(value);
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const downloadBlob = (blob, fileName) => {
  saveAs(blob, fileName);
};

const loadUnicenLogoDataUrl = async () => {
  const response = await fetch('/unicen.png');
  if (!response.ok) throw new Error('No se pudo cargar el logo de UNICEN');
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const buildRows = (records) => records.map((row, index) => ([
  index + 1,
  formatDateEs(row.fecha),
  `${row.apellido} ${row.nombre}`,
  row.codigo_estudiante || '',
  row.materia_nombre + (row.materia_grupo ? ` - ${row.materia_grupo}` : ''),
  STATUS_LABELS[row.estado] || row.estado,
  row.justificacion || 'Sin justificacion'
]));

const buildRangeLabel = ({ periodoLabel, desde, hasta, fechaBase }) => {
  if (desde && hasta && desde !== hasta) return `${periodoLabel}: ${formatDateEs(desde)} al ${formatDateEs(hasta)}`;
  if (desde) return `${periodoLabel}: ${formatDateEs(desde)}`;
  if (fechaBase) return `${periodoLabel}: ${formatDateEs(fechaBase)}`;
  return periodoLabel;
};

export const exportAttendancePdf = async ({ fileName, records, metadata }) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const logoDataUrl = await loadUnicenLogoDataUrl();

  doc.addImage(logoDataUrl, 'PNG', 14, 8, 26, 26);
  doc.setFillColor(...COLORS.navy);
  doc.roundedRect(46, 11, 237, 20, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Reporte Oficial de Asistencia', 52, 24);

  doc.setTextColor(...COLORS.navy);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Materia: ${metadata.materia}`, 14, 47);
  doc.text(`Docente: ${metadata.docente}`, 14, 54);
  doc.text(`Periodo consultado: ${metadata.rango}`, 14, 61);
  doc.text(`Emitido: ${metadata.emitido}`, 14, 68);

  doc.setFillColor(...COLORS.lightBlue);
  doc.roundedRect(185, 43, 98, 28, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${metadata.resumen.total}`, 191, 51);
  doc.setTextColor(...COLORS.green);
  doc.text(`Presentes: ${metadata.resumen.presente}`, 191, 58);
  doc.setTextColor(...COLORS.red);
  doc.text(`Faltas: ${metadata.resumen.falta}`, 225, 58);
  doc.setTextColor(...COLORS.gold);
  doc.text(`Permisos: ${metadata.resumen.permiso}`, 191, 65);
  doc.setTextColor(...COLORS.blue);
  doc.text(`Tardes: ${metadata.resumen.tarde}`, 225, 65);
  doc.setTextColor(...COLORS.navy);

  autoTable(doc, {
    startY: 77,
    head: [['N°', 'Fecha', 'Estudiante', 'Código', 'Materia', 'Estado', 'Justificación']],
    body: buildRows(records),
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.navy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.4,
      textColor: [40, 40, 40]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { cellWidth: 46 },
      3: { cellWidth: 24 },
      4: { cellWidth: 46 },
      5: { halign: 'center', cellWidth: 24 },
      6: { cellWidth: 90 }
    },
    didParseCell: (hook) => {
      if (hook.section === 'body' && hook.column.index === 5) {
        const raw = records[hook.row.index]?.estado;
        const color = raw ? statusColorHex[raw] : null;
        if (color) {
          hook.cell.styles.textColor = color.match(/.{1,2}/g).map((item) => parseInt(item, 16));
          hook.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text('SEGEDU - UNICEN', 14, 200);

  doc.save(fileName);
};

export const exportAttendanceExcel = async ({ fileName, records, metadata }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SEGEDU';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Asistencia', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
  });

  const logoDataUrl = await loadUnicenLogoDataUrl();
  const imageId = workbook.addImage({
    base64: logoDataUrl,
    extension: 'png'
  });

  sheet.addImage(imageId, {
    tl: { col: 0, row: 3 },
    ext: { width: 92, height: 92 }
  });

  sheet.mergeCells('B2:G3');
  const titleCell = sheet.getCell('B2');
  titleCell.value = 'Reporte Oficial de Asistencia';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0C2F5C' }
  };

  const infoRows = [
    ['Materia', metadata.materia],
    ['Docente', metadata.docente],
    ['Periodo consultado', metadata.rango],
    ['Emitido', metadata.emitido]
  ];

  infoRows.forEach((row, index) => {
    const number = 10 + index;
    sheet.getCell(`A${number}`).value = row[0];
    sheet.getCell(`A${number}`).font = { bold: true, color: { argb: 'FF0C2F5C' } };
    sheet.getCell(`B${number}`).value = row[1];
    sheet.mergeCells(`B${number}:G${number}`);
  });

  const summaryStart = 10;
  const summaryData = [
    ['Total', metadata.resumen.total, 'FF0C2F5C'],
    ['Presentes', metadata.resumen.presente, `FF${statusColorHex.presente}`],
    ['Faltas', metadata.resumen.falta, `FF${statusColorHex.falta}`],
    ['Permisos', metadata.resumen.permiso, `FF${statusColorHex.permiso}`],
    ['Tardes', metadata.resumen.tarde, `FF${statusColorHex.tarde}`]
  ];

  summaryData.forEach((item, index) => {
    const row = summaryStart + index;
    sheet.getCell(`I${row}`).value = item[0];
    sheet.getCell(`J${row}`).value = item[1];
    sheet.getCell(`I${row}`).font = { bold: true, color: { argb: item[2] } };
    sheet.getCell(`J${row}`).font = { bold: true, color: { argb: item[2] } };
  });

  const tableStart = 16;
  const headerRow = sheet.getRow(tableStart);
  headerRow.values = ['N°', 'Fecha', 'Estudiante', 'Código', 'Materia', 'Estado', 'Justificación'];
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0C2F5C' }
  };

  buildRows(records).forEach((row, index) => {
    const excelRow = sheet.getRow(tableStart + 1 + index);
    excelRow.values = row;
    excelRow.alignment = { vertical: 'middle', wrapText: true };
    if (index % 2 === 0) {
      excelRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      });
    }
    const estadoCell = sheet.getCell(`F${tableStart + 1 + index}`);
    const raw = records[index]?.estado;
    estadoCell.font = { bold: true, color: { argb: `FF${statusColorHex[raw] || '0C2F5C'}` } };
  });

  sheet.columns = [
    { width: 7 },
    { width: 14 },
    { width: 28 },
    { width: 18 },
    { width: 28 },
    { width: 16 },
    { width: 45 },
    { width: 4 },
    { width: 16 },
    { width: 12 }
  ];

  for (let row = tableStart; row <= tableStart + records.length; row += 1) {
    for (let col = 1; col <= 7; col += 1) {
      const cell = sheet.getRow(row).getCell(col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD6DCE5' } },
        left: { style: 'thin', color: { argb: 'FFD6DCE5' } },
        bottom: { style: 'thin', color: { argb: 'FFD6DCE5' } },
        right: { style: 'thin', color: { argb: 'FFD6DCE5' } }
      };
    }
  }

  sheet.views = [{ state: 'frozen', ySplit: tableStart }];

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer]), fileName);
};

export const buildAttendanceExportMetadata = ({ materia, docente, periodoLabel, desde, hasta, fechaBase, resumen }) => ({
  materia: materia
    ? `${materia.nombre} (${materia.codigo}) - Grupo ${materia.grupo}`
    : 'Materia no disponible',
  docente: docente || 'Docente responsable',
  rango: buildRangeLabel({ periodoLabel, desde, hasta, fechaBase }),
  emitido: new Date().toLocaleString('es-ES'),
  resumen
});
