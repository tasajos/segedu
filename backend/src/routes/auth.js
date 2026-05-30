import { Router } from 'express';
import { login, register, getProfile, updateProfile } from '../controllers/authController.js';
import { listarUnidades } from '../controllers/unidadesController.js';
import { listarPresentaciones, listarPresentacionesPorMateria, verPresentacion, slidesPresentacion } from '../controllers/presentacionesController.js';
import { analizarNegocio, validarHipotesis, generarEscenarioPitch, evaluarPitch, construirPitch, generarCartas, construirEmpresa, buscarCandidato, generarProductos, generarEscenarioVentas, interactuarVenta } from '../controllers/geminiController.js';
import { listarBugs, crearBug, actualizarBug, eliminarBug, asignarQA, listarTestCases, crearTestCase, actualizarTestCase, ejecutarTestCase, eliminarTestCase, listarComentariosBug, crearComentarioBug, listarEquipos, crearEquipo, eliminarEquipo, listarMiembrosEquipo, agregarMiembroEquipo, eliminarMiembroEquipo, listarUsuariosQA, getDashboardStats, listarImagenesBug, subirImagenesBug, eliminarImagenBug, uploadBugImages } from '../controllers/qaController.js';
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
router.post('/generar-cartas',          verifyToken, generarCartas);
router.post('/construir-empresa',       verifyToken, construirEmpresa);
router.post('/buscar-candidato',        verifyToken, buscarCandidato);
router.post('/generar-productos',       verifyToken, generarProductos);
router.post('/generar-escenario-ventas',verifyToken, generarEscenarioVentas);
router.post('/interactuar-venta',       verifyToken, interactuarVenta);

// QA Lab
router.get('/qa/bugs',                        verifyToken, listarBugs);
router.post('/qa/bugs',                       verifyToken, crearBug);
router.put('/qa/bugs/:id',                    verifyToken, actualizarBug);
router.delete('/qa/bugs/:id',                 verifyToken, eliminarBug);
router.get('/qa/test-cases',                  verifyToken, listarTestCases);
router.post('/qa/test-cases',                 verifyToken, crearTestCase);
router.put('/qa/test-cases/:id',              verifyToken, actualizarTestCase);
router.post('/qa/test-cases/:id/ejecutar',    verifyToken, ejecutarTestCase);
router.delete('/qa/test-cases/:id',           verifyToken, eliminarTestCase);
router.post('/qa/bugs/:id/asignar',           verifyToken, asignarQA);
router.get('/qa/bugs/:id/comments',           verifyToken, listarComentariosBug);
router.post('/qa/bugs/:id/comments',          verifyToken, crearComentarioBug);
router.get('/qa/equipos',                     verifyToken, listarEquipos);
router.post('/qa/equipos',                    verifyToken, crearEquipo);
router.delete('/qa/equipos/:id',              verifyToken, eliminarEquipo);
router.get('/qa/equipos/:id/miembros',        verifyToken, listarMiembrosEquipo);
router.post('/qa/equipos/:id/miembros',       verifyToken, agregarMiembroEquipo);
router.delete('/qa/equipos/:id/miembros/:userId', verifyToken, eliminarMiembroEquipo);
router.get('/qa/usuarios',                    verifyToken, listarUsuariosQA);
router.get('/qa/dashboard',                   verifyToken, getDashboardStats);
router.get('/qa/bugs/:id/images',             verifyToken, listarImagenesBug);
router.post('/qa/bugs/:id/images',            verifyToken, uploadBugImages, subirImagenesBug);
router.delete('/qa/bugs/:bugId/images/:imageId', verifyToken, eliminarImagenBug);

export default router;
