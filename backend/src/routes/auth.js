import { Router } from 'express';
import { login, register, getProfile, updateProfile } from '../controllers/authController.js';
import { listarUnidades } from '../controllers/unidadesController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/unidades', verifyToken, listarUnidades);

export default router;
