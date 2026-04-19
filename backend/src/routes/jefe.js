import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  miCarrera,
  listarTodosPGO, revisarPGO,
  listarTodosAvances, validarAvance,
  analisisComportamiento,
  dashboard, detalleEstudiante, listarEstudiantes,
  listarDisciplinaEstudiantes, crearDisciplinaEstudiante, eliminarDisciplinaEstudiante,
  listarDisciplinaDocentes, crearDisciplinaDocente, eliminarDisciplinaDocente,
  listarHorarios, crearHorario, eliminarHorario,
  asignarDocente, listarMaterias, crearMateria, actualizarMateria, eliminarMateria, listarDocentes
} from '../controllers/jefeController.js';

const router = Router();
router.use(verifyToken, requireRole('jefe'));

router.get('/mi-carrera', miCarrera);

router.get('/pgo', listarTodosPGO);
router.put('/pgo/:id', revisarPGO);

router.get('/avances', listarTodosAvances);
router.put('/avances/:id', validarAvance);

router.get('/comportamiento', analisisComportamiento);
router.get('/dashboard', dashboard);

router.get('/estudiantes', listarEstudiantes);
router.get('/estudiantes/:id', detalleEstudiante);

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
router.post('/materias', crearMateria);
router.put('/materias/:id', actualizarMateria);
router.delete('/materias/:id', eliminarMateria);
router.get('/docentes', listarDocentes);

export default router;
