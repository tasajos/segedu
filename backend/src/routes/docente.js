import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  listarMateriasDocente, listarEstudiantesPorMateria,
  listarPGO, crearPGO,
  listarAvance, crearAvance,
  listarComentarios, crearComentario
} from '../controllers/docenteController.js';

const router = Router();
router.use(verifyToken, requireRole('docente'));

router.get('/materias', listarMateriasDocente);
router.get('/materias/:materia_id/estudiantes', listarEstudiantesPorMateria);

router.get('/pgo', listarPGO);
router.post('/pgo', upload.single('archivo'), crearPGO);

router.get('/avance', listarAvance);
router.post('/avance', crearAvance);

router.get('/comentarios', listarComentarios);
router.post('/comentarios', crearComentario);

export default router;
