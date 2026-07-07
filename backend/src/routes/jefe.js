import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { upload, uploadMaterial } from '../middleware/upload.js';
import { listarUnidades, crearUnidad, actualizarUnidad, eliminarUnidad } from '../controllers/unidadesController.js';
import {
  listarCursosJefe, detalleCursoJefe, crearCursoJefe, actualizarCursoJefe, eliminarCursoJefe,
  listarInscritosJefe, actualizarInscripcionJefe,
  listarInstructoresJefe, crearInstructorJefe, asignarInstructorJefe,
  listarMaterialJefe, subirMaterialJefe, agregarEnlaceJefe, eliminarMaterialJefe,
  listarFechasAsistenciaJefe, listarAsistenciaJefe, registrarAsistenciaJefe,
  listarNotasJefe, guardarNotasJefe
} from '../controllers/cursosEspecialesController.js';
import {
  miCarrera,
  listarTodosPGO, revisarPGO, eliminarPGO,
  listarTodosAvances, validarAvance,
  analisisComportamiento, listarReportesAsistenciaDocentes, actualizarAsistenciaDocente,
  dashboard, detalleEstudiante, listarEstudiantes,
  listarAsistenciasEstudiante,
  indicadoresEstudiantes,
  listarSolicitudesPermiso, crearSolicitudPermiso, eliminarSolicitudPermiso, cambiarEstadoSolicitudPermiso,
  listarNotificaciones, crearNotificacion,
  obtenerActaMateria, guardarActaMateria, indicadoresActas,
  listarCarpetasPedagogicas, obtenerCarpetaPedagogicaJefe,
  inscribirEstudianteMateria, retirarEstudianteMateria,
  listarDisciplinaEstudiantes, crearDisciplinaEstudiante, eliminarDisciplinaEstudiante,
  listarDisciplinaDocentes, crearDisciplinaDocente, eliminarDisciplinaDocente,
  listarHorarios, crearHorario, actualizarHorario, eliminarHorario,
  asignarDocente, listarMaterias, obtenerMateria, detalleMateriaEstudiantes, crearMateria, actualizarMateria, eliminarMateria, listarDocentes
} from '../controllers/jefeController.js';

const router = Router();
router.use(verifyToken, requireRole('jefe'));

router.get('/mi-carrera', miCarrera);

router.get('/pgo', listarTodosPGO);
router.put('/pgo/:id', revisarPGO);
router.delete('/pgo/:id', eliminarPGO);

router.get('/avances', listarTodosAvances);
router.put('/avances/:id', validarAvance);

router.get('/comportamiento', analisisComportamiento);
router.get('/dashboard', dashboard);
router.get('/asistencias', listarReportesAsistenciaDocentes);
router.put('/asistencias/:id', upload.single('respaldo'), actualizarAsistenciaDocente);
router.get('/solicitudes-permiso', listarSolicitudesPermiso);
router.post('/solicitudes-permiso', upload.single('documento'), crearSolicitudPermiso);
router.put('/solicitudes-permiso/:id/estado', cambiarEstadoSolicitudPermiso);
router.delete('/solicitudes-permiso/:id', eliminarSolicitudPermiso);
router.get('/notificaciones', listarNotificaciones);
router.post('/notificaciones', crearNotificacion);
router.get('/actas/indicadores', indicadoresActas);
router.get('/actas/:id', obtenerActaMateria);
router.post('/actas', upload.single('archivo'), guardarActaMateria);
router.get('/carpetas-pedagogicas', listarCarpetasPedagogicas);
router.get('/carpetas-pedagogicas/:materia_id', obtenerCarpetaPedagogicaJefe);

router.get('/estudiantes', listarEstudiantes);
router.get('/estudiantes-indicadores', indicadoresEstudiantes);
router.get('/estudiantes/:id/asistencias', listarAsistenciasEstudiante);
router.get('/estudiantes/:id', detalleEstudiante);
router.post('/inscripciones', inscribirEstudianteMateria);
router.delete('/inscripciones/:estudiante_id/:materia_id', retirarEstudianteMateria);

router.get('/disciplina-estudiantes', listarDisciplinaEstudiantes);
router.post('/disciplina-estudiantes', crearDisciplinaEstudiante);
router.delete('/disciplina-estudiantes/:id', eliminarDisciplinaEstudiante);

router.get('/disciplina-docentes', listarDisciplinaDocentes);
router.post('/disciplina-docentes', crearDisciplinaDocente);
router.delete('/disciplina-docentes/:id', eliminarDisciplinaDocente);

router.get('/horarios', listarHorarios);
router.post('/horarios', crearHorario);
router.put('/horarios/:id', actualizarHorario);
router.delete('/horarios/:id', eliminarHorario);

router.post('/asignar-docente', asignarDocente);
router.get('/materias', listarMaterias);
router.get('/materias/:id/estudiantes', detalleMateriaEstudiantes);
router.get('/materias/:id', obtenerMateria);
router.post('/materias', crearMateria);
router.put('/materias/:id', actualizarMateria);
router.delete('/materias/:id', eliminarMateria);
router.get('/docentes', listarDocentes);

router.get('/unidades', listarUnidades);
router.post('/unidades', crearUnidad);
router.put('/unidades/:id', actualizarUnidad);
router.delete('/unidades/:id', eliminarUnidad);

router.get('/cursos-especiales', listarCursosJefe);
router.post('/cursos-especiales', crearCursoJefe);
router.get('/cursos-especiales/instructores', listarInstructoresJefe);
router.post('/cursos-especiales/instructores', crearInstructorJefe);
router.get('/cursos-especiales/:id', detalleCursoJefe);
router.put('/cursos-especiales/:id', actualizarCursoJefe);
router.delete('/cursos-especiales/:id', eliminarCursoJefe);
router.get('/cursos-especiales/:id/inscritos', listarInscritosJefe);
router.put('/cursos-especiales/:id/inscritos/:inscripcionId', actualizarInscripcionJefe);
router.put('/cursos-especiales/:id/instructor', asignarInstructorJefe);
router.get('/cursos-especiales/:id/material', listarMaterialJefe);
router.post('/cursos-especiales/:id/material', uploadMaterial.single('archivo'), subirMaterialJefe);
router.post('/cursos-especiales/:id/material/enlace', agregarEnlaceJefe);
router.delete('/cursos-especiales/:id/material/:materialId', eliminarMaterialJefe);
router.get('/cursos-especiales/:id/asistencia/fechas', listarFechasAsistenciaJefe);
router.get('/cursos-especiales/:id/asistencia', listarAsistenciaJefe);
router.post('/cursos-especiales/:id/asistencia', registrarAsistenciaJefe);
router.get('/cursos-especiales/:id/notas', listarNotasJefe);
router.post('/cursos-especiales/:id/notas', guardarNotasJefe);

export default router;
