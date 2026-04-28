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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Archivos subidos por usuarios
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Frontend build — busca en public/ o public/dist/ según lo que exista
const publicDir = fs.existsSync(path.join(__dirname, '..', 'public', 'index.html'))
  ? path.join(__dirname, '..', 'public')
  : path.join(__dirname, '..', 'public', 'dist');
app.use(express.static(publicDir));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'uni-tracking-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/estudiante', estudianteRoutes);
app.use('/api/docente', docenteRoutes);
app.use('/api/jefe', jefeRoutes);
app.use('/api/admin', adminRoutes);

// React Router: cualquier ruta no-API devuelve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🎓 SEGEDU API corriendo en http://localhost:${PORT}`);
});
