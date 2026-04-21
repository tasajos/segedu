import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  listarMateriasDocente, listarEstudiantesPorMateria,
  listarPGO, crearPGO, eliminarPGO,
  listarAvance, crearAvance, listarPgoTareas, actualizarEstadoPgoTarea,
  listarComentarios, crearComentario,
  registrarListaAsistencia, listarSesionesAsistencia, listarAsistenciaSesion, listarReporteAsistencia,
  listarSolicitudesPermisoDocente,
  listarNotificacionesPendientesDocente, revisarNotificacionesDocente,
  misDisciplina
} from '../controllers/docenteController.js';

const router = Router();
router.use(verifyToken, requireRole('docente'));

router.get('/materias', listarMateriasDocente);
router.get('/materias/:materia_id/estudiantes', listarEstudiantesPorMateria);

router.get('/pgo', listarPGO);
router.post('/pgo', upload.single('archivo'), crearPGO);
router.delete('/pgo/:id', eliminarPGO);

router.get('/avance', listarAvance);
router.post('/avance', crearAvance);
router.get('/pgo-tareas', listarPgoTareas);
router.put('/pgo-tareas/:id', actualizarEstadoPgoTarea);

router.get('/comentarios', listarComentarios);
router.post('/comentarios', crearComentario);

router.post('/asistencia/lista', registrarListaAsistencia);
router.get('/asistencia/sesiones', listarSesionesAsistencia);
router.get('/asistencia/sesion', listarAsistenciaSesion);
router.get('/asistencia/reporte', listarReporteAsistencia);
router.get('/asistencia/permisos', listarSolicitudesPermisoDocente);
router.get('/notificaciones/pendientes', listarNotificacionesPendientesDocente);
router.post('/notificaciones/revisar', revisarNotificacionesDocente);

router.get('/mi-disciplina', misDisciplina);

export default router;
