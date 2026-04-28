import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Para tareas del docente: PDF, PPTX y Word
export const uploadTarea = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.pptx', '.doc', '.docx'].includes(ext)) cb(null, true);
    else cb(new Error('Solo se permiten archivos PDF, PPTX o Word (DOC/DOCX)'), false);
  }
});

// Para entregas de estudiantes: Word (doc / docx)
export const uploadEntrega = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.doc', '.docx'].includes(ext)) cb(null, true);
    else cb(new Error('Solo se permiten archivos Word (.doc o .docx)'), false);
  }
});
