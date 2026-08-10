import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { auditorReadOnly, impersonateAuditorAs } from '../utils/auditorAccess.js';
import { upload, uploadTarea, uploadHtml } from '../middleware/upload.js';
import { subirGuiaHtml, reemplazarGuiaHtml, eliminarGuiaHtml } from '../controllers/unidadesController.js';
import {
  listarMateriasDocente, listarEstudiantesPorMateria,
  obtenerCarpetaPedagogica, guardarCarpetaPedagogica,
  obtenerEvaluacionCarpetaPedagogica, guardarAsistenciaCarpetaPedagogica,
  listarPGO, crearPGO, eliminarPGO,
  listarAvance, crearAvance, listarPgoTareas, actualizarEstadoPgoTarea,
  listarComentarios, crearComentario,
  registrarListaAsistencia, listarSesionesAsistencia, listarAsistenciaSesion, listarReporteAsistencia,
  listarSolicitudesPermisoDocente,
  listarNotificacionesPendientesDocente, revisarNotificacionesDocente,
  misDisciplina,
  actualizarInfoPersonalDocente, cambiarContrasenaDocente,
  listarGruposTrabajo, crearGrupoTrabajo, eliminarGrupoTrabajo, actualizarGrupoTrabajo,
  agregarMiembrosGrupoTrabajo, removerMiembroGrupoTrabajo,
  asignarTareaGrupoTrabajo, removerTareaGrupoTrabajo
} from '../controllers/docenteController.js';
import {
  listarTareasDocente, crearTarea, eliminarTarea,
  listarEntregasDocente, calificarEntrega,
  verArchivoTareaDocente, extractSlidesDocente, verEntregaDocente, descargarEntregaDocente
} from '../controllers/tareaController.js';
import {
  listarMisPresentaciones, crearPresentacion, eliminarPresentacion, moverPresentacion,
  listarCarpetas, crearCarpeta, actualizarCarpeta, eliminarCarpeta
} from '../controllers/presentacionesController.js';

const router = Router();
router.use(verifyToken, requireRole('docente', 'auditor'), auditorReadOnly, impersonateAuditorAs('docente'));

router.get('/materias', listarMateriasDocente);
router.get('/materias/:materia_id/estudiantes', listarEstudiantesPorMateria);
router.get('/carpeta-pedagogica/:materia_id', obtenerCarpetaPedagogica);
router.put('/carpeta-pedagogica/:materia_id', guardarCarpetaPedagogica);
router.get('/carpeta-pedagogica/:materia_id/evaluacion', obtenerEvaluacionCarpetaPedagogica);
router.put('/carpeta-pedagogica/:materia_id/asistencia', guardarAsistenciaCarpetaPedagogica);

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

// Guías HTML de Programación II
router.post('/unidades/programacion-ii/guias', uploadHtml.single('archivo'), subirGuiaHtml);
router.put('/unidades/programacion-ii/guias/:id', uploadHtml.single('archivo'), reemplazarGuiaHtml);
router.delete('/unidades/programacion-ii/guias/:id', eliminarGuiaHtml);

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
router.get('/mis-presentaciones', listarMisPresentaciones);
router.post('/presentaciones', uploadTarea.single('archivo'), crearPresentacion);
router.put('/presentaciones/:id/mover', moverPresentacion);
router.delete('/presentaciones/:id', eliminarPresentacion);

// Carpetas de presentaciones
router.get('/carpetas', listarCarpetas);
router.post('/carpetas', crearCarpeta);
router.put('/carpetas/:id', actualizarCarpeta);
router.delete('/carpetas/:id', eliminarCarpeta);

// Grupos de trabajo
router.get('/grupos-trabajo', listarGruposTrabajo);
router.post('/grupos-trabajo', crearGrupoTrabajo);
router.put('/grupos-trabajo/:id', actualizarGrupoTrabajo);
router.delete('/grupos-trabajo/:id', eliminarGrupoTrabajo);
router.post('/grupos-trabajo/:id/miembros', agregarMiembrosGrupoTrabajo);
router.delete('/grupos-trabajo/:id/miembros/:estudianteId', removerMiembroGrupoTrabajo);
router.post('/grupos-trabajo/:id/tareas', asignarTareaGrupoTrabajo);
router.delete('/grupos-trabajo/:id/tareas/:tareaId', removerTareaGrupoTrabajo);

export default router;
