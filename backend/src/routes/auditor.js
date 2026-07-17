import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { listarCarrerasAuditor, seleccionarCarreraAuditor, listarPersonasAuditoria, seleccionarPersonaAuditoria } from '../controllers/auditorController.js';

const router = Router();
router.use(verifyToken, requireRole('auditor'));
router.get('/carreras', listarCarrerasAuditor);
router.post('/carrera-activa', seleccionarCarreraAuditor);
router.get('/docentes', listarPersonasAuditoria('docente'));
router.post('/docente-activo', seleccionarPersonaAuditoria('docente'));
router.get('/estudiantes', listarPersonasAuditoria('estudiante'));
router.post('/estudiante-activo', seleccionarPersonaAuditoria('estudiante'));
export default router;
