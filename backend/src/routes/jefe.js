import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  miCarrera,
  listarTodosPGO, revisarPGO, eliminarPGO,
  listarTodosAvances, validarAvance,
  analisisComportamiento, listarReportesAsistenciaDocentes, actualizarAsistenciaDocente,
  dashboard, detalleEstudiante, listarEstudiantes,
  indicadoresEstudiantes,
  listarSolicitudesPermiso, crearSolicitudPermiso,
  listarNotificaciones, crearNotificacion,
  obtenerActaMateria, guardarActaMateria, indicadoresActas,
  inscribirEstudianteMateria, retirarEstudianteMateria,
  listarDisciplinaEstudiantes, crearDisciplinaEstudiante, eliminarDisciplinaEstudiante,
  listarDisciplinaDocentes, crearDisciplinaDocente, eliminarDisciplinaDocente,
  listarHorarios, crearHorario, eliminarHorario,
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
router.get('/notificaciones', listarNotificaciones);
router.post('/notificaciones', crearNotificacion);
router.get('/actas/indicadores', indicadoresActas);
router.get('/actas/:id', obtenerActaMateria);
router.post('/actas', upload.single('archivo'), guardarActaMateria);

router.get('/estudiantes', listarEstudiantes);
router.get('/estudiantes-indicadores', indicadoresEstudiantes);
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
router.delete('/horarios/:id', eliminarHorario);

router.post('/asignar-docente', asignarDocente);
router.get('/materias', listarMaterias);
router.get('/materias/:id/estudiantes', detalleMateriaEstudiantes);
router.get('/materias/:id', obtenerMateria);
router.post('/materias', crearMateria);
router.put('/materias/:id', actualizarMateria);
router.delete('/materias/:id', eliminarMateria);
router.get('/docentes', listarDocentes);

export default router;
