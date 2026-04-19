import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureTaskTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pgo_tareas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pgo_id INT NOT NULL,
      materia_id INT NOT NULL,
      docente_id INT NOT NULL,
      unidad_codigo VARCHAR(30),
      unidad_nombre VARCHAR(255),
      titulo VARCHAR(255) NOT NULL,
      orden INT NOT NULL DEFAULT 1,
      estado ENUM('pendiente', 'completado') DEFAULT 'pendiente',
      fecha_completado DATE NULL,
      avance_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pgo_id) REFERENCES pgo(id) ON DELETE CASCADE,
      FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
      FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE,
      FOREIGN KEY (avance_id) REFERENCES avance_materia(id) ON DELETE SET NULL
    )
  `);
};

const decodeXmlText = (value) => value
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

const normalizeLine = (line) => line
  .replace(/\u00a0/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const extractDocumentText = async (docxPath) => {
  const escapedPath = docxPath.replace(/'/g, "''");
  const { stdout } = await execFileAsync(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      [
        '$ErrorActionPreference = "Stop"',
        'Add-Type -AssemblyName System.IO.Compression.FileSystem',
        `$zip = [System.IO.Compression.ZipFile]::OpenRead('${escapedPath}')`,
        "$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }",
        'if (-not $entry) { throw "No se encontro word/document.xml en el documento" }',
        '$reader = New-Object System.IO.StreamReader($entry.Open())',
        '$xml = $reader.ReadToEnd()',
        '$reader.Close()',
        '$zip.Dispose()',
        '$bytes = [System.Text.Encoding]::UTF8.GetBytes($xml)',
        '$base64 = [Convert]::ToBase64String($bytes)',
        'Write-Output $base64'
      ].join('; ')
    ],
    { windowsHide: true, maxBuffer: 1024 * 1024 * 20 }
  );

  const xml = Buffer.from(stdout.trim(), 'base64').toString('utf8');
  const text = decodeXmlText(
    xml
      .replace(/<\/w:(p|tr|tc)>/g, '\n')
      .replace(/<w:tab\/>/g, ' ')
      .replace(/<w:br[^>]*\/>/g, '\n')
      .replace(/<[^>]+>/g, ' ')
  );

  return text
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean);
};

const parseTaskTitle = (line) => {
  const match = line.match(/^\d+\s*\.\s*\d+\s*\.?\s*(.+)$/);
  if (!match) return null;
  return normalizeLine(match[1]);
};

const parsePgoTasksFromLines = (lines) => {
  const unitMap = new Map();
  const tasks = [];
  let collectingUnitCode = null;
  let currentUnitCode = null;
  let currentUnitName = '';
  let order = 1;

  for (const line of lines) {
    const unitHeader = line.match(/^UNIDAD\s+([IVXLC]+)\s*:\s*(.+)$/i);
    if (unitHeader) {
      currentUnitCode = unitHeader[1].toUpperCase();
      currentUnitName = normalizeLine(unitHeader[2]);
      unitMap.set(currentUnitCode, currentUnitName);
    }

    const contentHeader = line.match(/^CONTENIDOS\s+DE\s+LA\s+UNIDAD\s+([IVXLC]+)/i);
    if (contentHeader) {
      collectingUnitCode = contentHeader[1].toUpperCase();
      continue;
    }

    if (!collectingUnitCode) continue;

    if (
      /^EVIDENCIAS\s+DEL\s+APRENDIZAJE/i.test(line) ||
      /^COMPETENCIA\s+DE\s+LA\s+UNIDAD/i.test(line) ||
      /^INDICADOR\s+DE\s+LA\s+COMPETENCIA/i.test(line) ||
      /^METODOLOG/i.test(line) ||
      /^EVALUACI/i.test(line) ||
      /^CRONOGRAMA/i.test(line)
    ) {
      collectingUnitCode = null;
      continue;
    }

    const title = parseTaskTitle(line);
    if (!title) continue;

    tasks.push({
      unidad_codigo: `Unidad ${collectingUnitCode}`,
      unidad_nombre: unitMap.get(collectingUnitCode) || `Unidad ${collectingUnitCode}`,
      titulo: title,
      orden: order++
    });
  }

  return tasks;
};

const resolveUploadPath = (archivoUrl) => {
  if (!archivoUrl) return null;
  const fileName = path.basename(archivoUrl);

  const candidates = [
    path.resolve(process.cwd(), 'uploads', fileName),
    path.resolve(process.cwd(), 'backend', 'uploads', fileName),
    path.resolve(__dirname, '..', '..', 'uploads', fileName)
  ];

  return candidates[0];
};

export const ensurePgoTaskSchema = ensureTaskTable;

export const generarTareasDesdePgo = async (pgoId) => {
  await ensureTaskTable();

  const [[pgo]] = await pool.query(
    `SELECT p.id, p.materia_id, p.docente_id, p.archivo_url, p.estado
     FROM pgo p
     WHERE p.id = ?`,
    [pgoId]
  );

  if (!pgo || pgo.estado !== 'aprobado' || !pgo.archivo_url) {
    return { creadas: 0, motivo: 'Sin archivo o no aprobado' };
  }

  const [[existing]] = await pool.query(
    'SELECT COUNT(*) as total FROM pgo_tareas WHERE pgo_id = ?',
    [pgoId]
  );

  if (existing?.total > 0) {
    return { creadas: 0, motivo: 'Las tareas ya fueron generadas' };
  }

  const filePath = resolveUploadPath(pgo.archivo_url);
  const existingPath = await (async () => {
    for (const candidate of [
      path.resolve(process.cwd(), 'uploads', path.basename(pgo.archivo_url)),
      path.resolve(process.cwd(), 'backend', 'uploads', path.basename(pgo.archivo_url)),
      path.resolve(__dirname, '..', '..', 'uploads', path.basename(pgo.archivo_url))
    ]) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }
    return filePath;
  })();
  const lines = await extractDocumentText(existingPath);
  const tasks = parsePgoTasksFromLines(lines);

  if (!tasks.length) {
    return { creadas: 0, motivo: 'No se encontraron contenidos de unidad en el documento' };
  }

  for (const task of tasks) {
    await pool.query(
      `INSERT INTO pgo_tareas (pgo_id, materia_id, docente_id, unidad_codigo, unidad_nombre, titulo, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [pgoId, pgo.materia_id, pgo.docente_id, task.unidad_codigo, task.unidad_nombre, task.titulo, task.orden]
    );
  }

  return { creadas: tasks.length };
};
