import { Router } from 'express';
import { login, register, getProfile, updateProfile } from '../controllers/authController.js';
import { listarUnidades } from '../controllers/unidadesController.js';
import { listarPresentaciones, listarPresentacionesPorMateria, verPresentacion, slidesPresentacion } from '../controllers/presentacionesController.js';
import { analizarNegocio, validarHipotesis, generarEscenarioPitch, evaluarPitch, construirPitch } from '../controllers/geminiController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.get('/unidades', verifyToken, listarUnidades);
router.get('/presentaciones', verifyToken, listarPresentaciones);
router.get('/mis-presentaciones', verifyToken, listarPresentacionesPorMateria);
router.get('/presentaciones/:id/ver', verifyToken, verPresentacion);
router.get('/presentaciones/:id/slides', verifyToken, slidesPresentacion);
router.post('/analizar-negocio', verifyToken, analizarNegocio);
router.post('/validar-hipotesis',      verifyToken, validarHipotesis);
router.post('/generar-escenario-pitch', verifyToken, generarEscenarioPitch);
router.post('/evaluar-pitch',           verifyToken, evaluarPitch);
router.post('/construir-pitch',         verifyToken, construirPitch);

export default router;
