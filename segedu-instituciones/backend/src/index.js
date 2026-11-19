import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import estudianteRoutes from './routes/estudiante.js';
import docenteRoutes from './routes/docente.js';
import jefeRoutes from './routes/jefe.js';
import adminRoutes from './routes/admin.js';
import auditorRoutes from './routes/auditor.js';
import plataformaRoutes from './routes/plataforma.js';
import { ensureAuditorSchema } from './utils/auditorAccess.js';
import { resolverInstitucion } from './tenancy/resolver.js';
import { multiInstitucionActiva } from './tenancy/contexto.js';
import { servirUploads } from './tenancy/uploads.js';
import { asegurarEsquemaPlataforma } from './plataforma/db.js';
import { contexto } from './plataforma/controlador.js';

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('Falta JWT_SECRET en .env (mínimo 16 caracteres). El sistema no puede iniciar sin él.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Institución de la petición según el subdominio (después de express.json: el cuerpo ya está leído
// cuando arranca el contexto, así no se pierde dentro de los eventos del stream).
app.use(resolverInstitucion);

// Archivos subidos por usuarios, en la carpeta de cada institución
app.use('/uploads', servirUploads);

// Frontend build — busca en public/ o public/dist/ según lo que exista
const publicDir = fs.existsSync(path.join(__dirname, '..', 'public', 'index.html'))
  ? path.join(__dirname, '..', 'public')
  : path.join(__dirname, '..', 'public', 'dist');

// Assets con hash (JS/CSS de Vite) → caché de 1 año
// index.html → sin caché para que siempre cargue la versión más reciente
app.use(express.static(publicDir, {
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'segedu-instituciones-api' }));

app.get('/api/contexto', contexto);
app.use('/api/plataforma', plataformaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/estudiante', estudianteRoutes);
app.use('/api/docente', docenteRoutes);
app.use('/api/jefe', jefeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auditor', auditorRoutes);

// React Router: cualquier ruta no-API devuelve index.html (sin caché)
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`SEGEDU Instituciones API corriendo en http://localhost:${PORT}`);
  const initializers = [
    ['Auditor', ensureAuditorSchema],
    ...(multiInstitucionActiva() ? [['Plataforma multi-institución', asegurarEsquemaPlataforma]] : [])
  ];

  // En producción el usuario MySQL puede no tener permisos DDL. Una migración
  // pendiente debe quedar en el log, pero nunca derribar toda la aplicación.
  for (const [name, initializer] of initializers) {
    try {
      await initializer();
    } catch (error) {
      console.error(`[Inicialización pendiente] ${name}:`, error.message);
    }
  }
});
