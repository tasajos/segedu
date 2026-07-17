import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { listarCarrerasAuditor, seleccionarCarreraAuditor } from '../controllers/auditorController.js';

const router = Router();
router.use(verifyToken, requireRole('auditor'));
router.get('/carreras', listarCarrerasAuditor);
router.post('/carrera-activa', seleccionarCarreraAuditor);
export default router;
