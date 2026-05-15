import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { upload, uploadEntrega } from '../middleware/upload.js';
import {
  listarCursosEstudiante, inscribirseEnCurso, cancelarInscripcion,
  misCursosAprobados, materialCursoEstudiante, miAsistenciaCurso, misNotasCurso
} from '../controllers/cursosEspecialesController.js';
import {
  listarCursos, crearCurso, eliminarCurso,
  actualizarInfoPersonal, cambiarContrasena,
  listarMateriasEstudiante, listarAsistenciasEstudiante,
  resumenAsistencias,
  miExpediente,
  solicitarPermiso, listarMisPermisos,
  rankingGrupo
} from '../controllers/estudianteController.js';
import {
  listarTareasEstudiante, verArchivoTareaEstudiante, extractSlidesEstudiante,
  entregarTarea, miEntrega,
  listarGruposEstudiante, listarCompaneros, crearGrupo, salirGrupo, eliminarGrupo,
  listarMisGruposDocente
} from '../controllers/tareaController.js';

const router = Router();
router.use(verifyToken, requireRole('estudiante'));

router.get('/cursos', listarCursos);
router.post('/cursos', upload.single('certificado'), crearCurso);
router.delete('/cursos/:id', eliminarCurso);

router.put('/info-personal', actualizarInfoPersonal);
router.put('/cambiar-contrasena', cambiarContrasena);

router.get('/ranking-grupo', rankingGrupo);

router.get('/materias', listarMateriasEstudiante);
router.get('/asistencias/resumen', resumenAsistencias);
router.get('/asistencias', listarAsistenciasEstudiante);

router.get('/expediente', miExpediente);

// Permisos — el estudiante solicita, el jefe autoriza
router.get('/permisos', listarMisPermisos);
router.post('/permisos', uploadEntrega.single('documento'), solicitarPermiso);

// Tareas
router.get('/tareas', listarTareasEstudiante);
router.get('/tareas/:id/ver', verArchivoTareaEstudiante);
router.get('/tareas/:id/slides', extractSlidesEstudiante);
router.post('/tareas/:id/entrega', uploadEntrega.single('archivo'), entregarTarea);
router.get('/tareas/:id/mi-entrega', miEntrega);

// Grupos (creados por estudiantes)
router.get('/grupos/:tareaId', listarGruposEstudiante);
router.get('/grupos/:tareaId/companeros', listarCompaneros);
router.post('/grupos', crearGrupo);
router.delete('/grupos/:grupoId/salir', salirGrupo);
router.delete('/grupos/:grupoId', eliminarGrupo);

// Grupos de trabajo creados por docente
router.get('/grupos-docente', listarMisGruposDocente);

// Cursos especiales (creados por jefe de carrera)
router.get('/cursos-especiales', listarCursosEstudiante);
router.post('/cursos-especiales/:id/inscribir', inscribirseEnCurso);
router.delete('/cursos-especiales/:id/inscripcion', cancelarInscripcion);
router.get('/mis-cursos-especiales', misCursosAprobados);
router.get('/mis-cursos-especiales/:id/material', materialCursoEstudiante);
router.get('/mis-cursos-especiales/:id/asistencia', miAsistenciaCurso);
router.get('/mis-cursos-especiales/:id/notas', misNotasCurso);

export default router;
