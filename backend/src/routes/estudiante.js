import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { upload, uploadEntrega } from '../middleware/upload.js';
import {
  listarCursos, crearCurso, eliminarCurso,
  actualizarInfoPersonal,
  listarMateriasEstudiante, listarAsistenciasEstudiante,
  registrarAsistencia, resumenAsistencias,
  miExpediente
} from '../controllers/estudianteController.js';
import {
  listarTareasEstudiante, verArchivoTareaEstudiante, extractSlidesEstudiante,
  entregarTarea, miEntrega,
  listarGruposEstudiante, listarCompaneros, crearGrupo, salirGrupo, eliminarGrupo
} from '../controllers/tareaController.js';

const router = Router();
router.use(verifyToken, requireRole('estudiante'));

router.get('/cursos', listarCursos);
router.post('/cursos', upload.single('certificado'), crearCurso);
router.delete('/cursos/:id', eliminarCurso);

router.put('/info-personal', actualizarInfoPersonal);

router.get('/materias', listarMateriasEstudiante);
router.get('/asistencias/resumen', resumenAsistencias);
router.get('/asistencias', listarAsistenciasEstudiante);
router.post('/asistencias', registrarAsistencia);

router.get('/expediente', miExpediente);

// Tareas
router.get('/tareas', listarTareasEstudiante);
router.get('/tareas/:id/ver', verArchivoTareaEstudiante);
router.get('/tareas/:id/slides', extractSlidesEstudiante);
router.post('/tareas/:id/entrega', uploadEntrega.single('archivo'), entregarTarea);
router.get('/tareas/:id/mi-entrega', miEntrega);

// Grupos
router.get('/grupos/:tareaId', listarGruposEstudiante);
router.get('/grupos/:tareaId/companeros', listarCompaneros);
router.post('/grupos', crearGrupo);
router.delete('/grupos/:grupoId/salir', salirGrupo);
router.delete('/grupos/:grupoId', eliminarGrupo);

export default router;
