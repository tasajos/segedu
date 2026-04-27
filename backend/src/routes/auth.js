import { Router } from 'express';
import { login, register, getProfile, updateProfile } from '../controllers/authController.js';
import { listarUnidades } from '../controllers/unidadesController.js';
import { listarPresentaciones, verPresentacion, slidesPresentacion } from '../controllers/presentacionesController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/unidades', verifyToken, listarUnidades);
router.get('/presentaciones', verifyToken, listarPresentaciones);
router.get('/presentaciones/:id/ver', verifyToken, verPresentacion);
router.get('/presentaciones/:id/slides', verifyToken, slidesPresentacion);

export default router;
