import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  dashboard,
  listarCarreras, crearCarrera, actualizarCarrera, eliminarCarrera,
  listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario,
  listarJefes, resetPassword,
  listarMaterias, crearMateria, actualizarMateria, eliminarMateria,
  listarDocentesAdmin
} from '../controllers/adminController.js';

const router = Router();
router.use(verifyToken, requireRole('admin'));

router.get('/dashboard', dashboard);

router.get('/carreras', listarCarreras);
router.post('/carreras', crearCarrera);
router.put('/carreras/:id', actualizarCarrera);
router.delete('/carreras/:id', eliminarCarrera);

router.get('/usuarios', listarUsuarios);
router.post('/usuarios', crearUsuario);
router.put('/usuarios/:id', actualizarUsuario);
router.delete('/usuarios/:id', eliminarUsuario);
router.put('/usuarios/:id/reset-password', resetPassword);

router.get('/jefes', listarJefes);

router.get('/materias', listarMaterias);
router.post('/materias', crearMateria);
router.put('/materias/:id', actualizarMateria);
router.delete('/materias/:id', eliminarMateria);
router.get('/docentes', listarDocentesAdmin);

export default router;
