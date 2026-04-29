import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { upload, uploadTarea } from '../middleware/upload.js';
import {
  listarMateriasDocente, listarEstudiantesPorMateria,
  listarPGO, crearPGO, eliminarPGO,
  listarAvance, crearAvance, listarPgoTareas, actualizarEstadoPgoTarea,
  listarComentarios, crearComentario,
  registrarListaAsistencia, listarSesionesAsistencia, listarAsistenciaSesion, listarReporteAsistencia,
  listarSolicitudesPermisoDocente,
  listarNotificacionesPendientesDocente, revisarNotificacionesDocente,
  misDisciplina,
  actualizarInfoPersonalDocente, cambiarContrasenaDocente
} from '../controllers/docenteController.js';
import {
  listarTareasDocente, crearTarea, eliminarTarea,
  listarEntregasDocente, calificarEntrega,
  verArchivoTareaDocente, extractSlidesDocente, verEntregaDocente, descargarEntregaDocente
} from '../controllers/tareaController.js';
import { crearPresentacion, eliminarPresentacion } from '../controllers/presentacionesController.js';

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

router.put('/info-personal', actualizarInfoPersonalDocente);
router.put('/cambiar-contrasena', cambiarContrasenaDocente);

// Tareas
router.get('/tareas', listarTareasDocente);
router.post('/tareas', uploadTarea.single('archivo'), crearTarea);
router.delete('/tareas/:id', eliminarTarea);
router.get('/tareas/:id/entregas', listarEntregasDocente);
router.put('/entregas/:id/calificar', calificarEntrega);
router.get('/tareas/:id/ver', verArchivoTareaDocente);
router.get('/tareas/:id/slides', extractSlidesDocente);
router.get('/entregas/:id/ver', verEntregaDocente);
router.get('/entregas/:id/descargar', descargarEntregaDocente);

// Presentaciones
router.post('/presentaciones', uploadTarea.single('archivo'), crearPresentacion);
router.delete('/presentaciones/:id', eliminarPresentacion);

export default router;
