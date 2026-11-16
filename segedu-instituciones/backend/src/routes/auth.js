import { Router } from 'express';
import { login, getProfile, updateProfile } from '../controllers/authController.js';
import { listarPresentaciones, listarPresentacionesPorMateria, verPresentacion, slidesPresentacion } from '../controllers/presentacionesController.js';
import { listarUsuariosEquipo } from '../controllers/adminController.js';
import { obtenerInstitucion } from '../controllers/institucionController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/institucion', obtenerInstitucion);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/presentaciones', verifyToken, listarPresentaciones);
router.get('/mis-presentaciones', verifyToken, listarPresentacionesPorMateria);
router.get('/presentaciones/:id/ver', verifyToken, verPresentacion);
router.get('/presentaciones/:id/slides', verifyToken, slidesPresentacion);
router.get('/usuarios-equipo',          verifyToken, listarUsuariosEquipo);
export default router;
