import multer from 'multer';
import path from 'path';
import { dirUploads } from '../tenancy/uploads.js';
import { conInstitucion, institucionActual } from '../tenancy/contexto.js';

// Cada institución guarda sus archivos en su propia carpeta (ver tenancy/uploads.js).
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dirUploads(req)),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const uploadBase = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Para tareas del docente: PDF, PPTX y Word
const uploadTareaBase = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.pptx', '.doc', '.docx'].includes(ext)) cb(null, true);
    else cb(new Error('Solo se permiten archivos PDF, PPTX o Word (DOC/DOCX)'), false);
  }
});

// Para material de cursos especiales: cualquier tipo de archivo
const uploadMaterialBase = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Guías autocontenidas para unidades de instrucción
const uploadHtmlBase = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.html', '.htm'].includes(ext)) cb(null, true);
    else cb(new Error('Solo se permiten archivos HTML (.html o .htm)'), false);
  }
});

// Para entregas de estudiantes: Word (doc / docx) o PDF
const uploadEntregaBase = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.doc', '.docx', '.pdf'].includes(ext)) cb(null, true);
    else cb(new Error('Solo se permiten archivos Word (.doc o .docx) o PDF'), false);
  }
});

// multer termina dentro de eventos del stream de la petición, donde AsyncLocalStorage
// puede perderse. Se restaura el contexto de la institución antes de seguir al controlador.
const conContexto = (mw) => (req, res, next) => {
  const inst = institucionActual() || req.institucion || null;
  mw(req, res, (err) => conInstitucion(inst, () => next(err)));
};
const envolver = (m) => ({
  single: (...a) => conContexto(m.single(...a)),
  array: (...a) => conContexto(m.array(...a)),
  fields: (...a) => conContexto(m.fields(...a)),
  none: (...a) => conContexto(m.none(...a)),
  any: (...a) => conContexto(m.any(...a))
});

export const upload = envolver(uploadBase);
export const uploadTarea = envolver(uploadTareaBase);
export const uploadMaterial = envolver(uploadMaterialBase);
export const uploadHtml = envolver(uploadHtmlBase);
export const uploadEntrega = envolver(uploadEntregaBase);
