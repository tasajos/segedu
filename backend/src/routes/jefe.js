import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
  listarTodosPGO, revisarPGO,
  listarTodosAvances, validarAvance,
  analisisComportamiento,
  dashboard, detalleEstudiante, listarEstudiantes
} from '../controllers/jefeController.js';

const router = Router();
router.use(verifyToken, requireRole('jefe'));

router.get('/pgo', listarTodosPGO);
router.put('/pgo/:id', revisarPGO);

router.get('/avances', listarTodosAvances);
router.put('/avances/:id', validarAvance);

router.get('/comportamiento', analisisComportamiento);
router.get('/dashboard', dashboard);

router.get('/estudiantes', listarEstudiantes);
router.get('/estudiantes/:id', detalleEstudiante);

export default router;
