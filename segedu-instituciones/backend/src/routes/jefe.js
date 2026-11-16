import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  miCarrera,
  listarTodosPGO, revisarPGO, eliminarPGO,
  listarTodosAvances, validarAvance,
  analisisComportamiento, listarReportesAsistenciaDocentes, actualizarAsistenciaDocente,
  dashboard, detalleEstudiante, listarEstudiantes, promoverEstudiantes,
  listarAsistenciasEstudiante,
  indicadoresEstudiantes,
  listarSolicitudesPermiso, crearSolicitudPermiso, eliminarSolicitudPermiso, cambiarEstadoSolicitudPermiso,
  listarNotificaciones, crearNotificacion,
  obtenerActaMateria, guardarActaMateria, verificarPasswordActas, indicadoresActas,
  listarCarpetasPedagogicas, obtenerCarpetaPedagogicaJefe,
  inscribirEstudianteMateria, retirarEstudianteMateria,
  listarDisciplinaEstudiantes, crearDisciplinaEstudiante, eliminarDisciplinaEstudiante,
  listarDisciplinaDocentes, crearDisciplinaDocente, eliminarDisciplinaDocente,
  listarHorarios, crearHorario, actualizarHorario, eliminarHorario,
  asignarDocente, listarMaterias, obtenerMateria, detalleMateriaEstudiantes, crearMateria, actualizarMateria, eliminarMateria, listarDocentes
} from '../controllers/jefeController.js';

const router = Router();
router.use(verifyToken, requireRole('jefe', 'auditor'));
router.use((req, res, next) => {
  if (req.user.rol === 'auditor' && req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(403).json({ error: 'El auditor tiene acceso de solo lectura' });
  }
  next();
});

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
router.post('/actas/verificar-password', verificarPasswordActas);
router.post('/actas', upload.single('archivo'), guardarActaMateria);
router.get('/carpetas-pedagogicas', listarCarpetasPedagogicas);
router.get('/carpetas-pedagogicas/:materia_id', obtenerCarpetaPedagogicaJefe);

router.get('/estudiantes', listarEstudiantes);
router.get('/estudiantes-indicadores', indicadoresEstudiantes);
router.put('/estudiantes/promocion', promoverEstudiantes);
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

export default router;
