import fs from 'fs';
import zlib from 'zlib';

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_FILE_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;

const decodeXml = (value = '') => value
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, '\'')
  .replace(/&#10;/g, '\n')
  .replace(/&#13;/g, '\r')
  .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));

const normalizeText = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toUpperCase();

const titleCase = (value = '') => value
  .toLowerCase()
  .split(' ')
  .filter(Boolean)
  .map((part) => {
    if (['de', 'del', 'la', 'las', 'los', 'y'].includes(part)) return part;
    return part.charAt(0).toUpperCase() + part.slice(1);
  })
  .join(' ');

const splitStudentName = (fullName = '') => {
  const parts = fullName.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);

  if (parts.length === 0) {
    return { nombre: 'Sin nombre', apellido: 'Sin apellido' };
  }
  if (parts.length === 1) {
    const value = titleCase(parts[0]);
    return { nombre: value, apellido: value };
  }
  if (parts.length === 2) {
    return { apellido: titleCase(parts[0]), nombre: titleCase(parts[1]) };
  }

  const apellidoParts = parts.slice(0, 2);
  const nombreParts = parts.slice(2);

  return {
    apellido: titleCase(apellidoParts.join(' ')),
    nombre: titleCase(nombreParts.join(' '))
  };
};

const parseHeaderMetadata = (title = '') => {
  const clean = title.replace(/^LISTA DE ESTUDIANTES\s*-\s*/i, '').trim();
  const parts = clean.split(/\s*-\s*/).map((part) => part.trim()).filter(Boolean);

  return {
    rawTitle: title,
    carreraNombre: parts[0] || '',
    materiaNombre: parts[1] || '',
    turno: parts[2] || '',
    grupo: parts[3] || ''
  };
};

const findEndOfCentralDirectory = (buffer) => {
  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (buffer.readUInt32LE(i) === EOCD_SIGNATURE) return i;
  }
  throw new Error('No se pudo leer la estructura ZIP del archivo Excel');
};

const readZipEntries = (buffer) => {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = {};
  let offset = centralOffset;

  for (let i = 0; i < totalEntries; i += 1) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_FILE_SIGNATURE) {
      throw new Error('Directorio central ZIP inválido');
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.slice(offset + 46, offset + 46 + fileNameLength).toString('utf8');

    if (buffer.readUInt32LE(localHeaderOffset) !== LOCAL_FILE_SIGNATURE) {
      throw new Error(`Cabecera local ZIP inválida para ${fileName}`);
    }

    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressedData = buffer.slice(dataOffset, dataOffset + compressedSize);

    let dataBuffer;
    if (compressionMethod === 0) {
      dataBuffer = compressedData;
    } else if (compressionMethod === 8) {
      dataBuffer = zlib.inflateRawSync(compressedData);
    } else {
      throw new Error(`Método de compresión no soportado para ${fileName}`);
    }

    entries[fileName] = dataBuffer.toString('utf8');
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
};

const parseSharedStrings = (xml = '') => {
  const items = xml.match(/<si\b[\s\S]*?<\/si>/g) || [];
  return items.map((item) => {
    const chunks = [...item.matchAll(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g)];
    return decodeXml(chunks.map((match) => match[1]).join(''));
  });
};

const parseRows = (xml = '', sharedStrings = []) => {
  const rows = [];
  const rowMatches = [...xml.matchAll(/<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)];

  for (const [, rowNumber, rowContent] of rowMatches) {
    const cells = {};
    const cellMatches = [
      ...rowContent.matchAll(/<c\b([^>]*)\/>|<c\b([^>]*)>([\s\S]*?)<\/c>/g)
    ];

    for (const match of cellMatches) {
      const attrs = match[1] || match[2] || '';
      const inner = match[3] || '';
      const refMatch = attrs.match(/\br="([A-Z]+)\d+"/);
      if (!refMatch) continue;

      const ref = refMatch[1];
      const typeMatch = attrs.match(/\bt="([^"]+)"/);
      const cellType = typeMatch ? typeMatch[1] : '';
      const valueMatch = inner.match(/<v>([\s\S]*?)<\/v>/);
      const inlineMatch = inner.match(/<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/);

      let value = '';
      if (cellType === 's' && valueMatch) {
        value = sharedStrings[Number(valueMatch[1])] || '';
      } else if (inlineMatch) {
        value = decodeXml(inlineMatch[1]);
      } else if (valueMatch) {
        value = decodeXml(valueMatch[1]);
      }

      cells[ref] = value;
    }

    rows.push({ rowNumber: Number(rowNumber), cells });
  }

  return rows;
};

export const parseStudentImportExcel = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const entries = readZipEntries(buffer);
  const sharedStrings = parseSharedStrings(entries['xl/sharedStrings.xml'] || '');
  const rows = parseRows(entries['xl/worksheets/sheet1.xml'] || '', sharedStrings);

  const title = rows.find((row) => row.cells.A)?.cells.A || '';
  const headerRow = rows.find((row) =>
    normalizeText(row.cells.B) === 'UNICODIGO' &&
    normalizeText(row.cells.C) === 'ESTUDIANTE'
  );

  if (!headerRow) {
    throw new Error('No se encontró la cabecera esperada con UNICODIGO y ESTUDIANTE');
  }

  const students = rows
    .filter((row) => row.rowNumber > headerRow.rowNumber)
    .map((row) => ({
      numero: row.cells.A?.trim() || '',
      unicodigo: row.cells.B?.trim() || '',
      estudianteCompleto: row.cells.C?.replace(/\s+/g, ' ').trim() || ''
    }))
    .filter((row) => row.unicodigo && row.estudianteCompleto)
    .map((row) => ({
      ...row,
      ...splitStudentName(row.estudianteCompleto)
    }));

  return {
    title,
    metadata: parseHeaderMetadata(title),
    students
  };
};
