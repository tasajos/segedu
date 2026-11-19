// Panel de Chakuy Software: solo responde en el subdominio de la plataforma (ver tenancy/resolver.js).
import express from 'express';
import {
  login, verificarSuperadmin, perfil, config, subdominioDisponible,
  listar, obtener, crear, reintentar, actualizarEstado, restablecer
} from '../plataforma/controlador.js';

const router = express.Router();
const seguro = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/auth/login', seguro(login));

router.use(seguro(verificarSuperadmin));
router.get('/auth/perfil', perfil);
router.get('/config', config);
router.get('/subdominio-disponible', seguro(subdominioDisponible));
router.get('/instituciones', seguro(listar));
router.post('/instituciones', seguro(crear));
router.get('/instituciones/:id', seguro(obtener));
router.patch('/instituciones/:id', seguro(actualizarEstado));
router.post('/instituciones/:id/reintentar', seguro(reintentar));
router.post('/instituciones/:id/restablecer-admin', seguro(restablecer));

export default router;
