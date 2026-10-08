// backend/src/routes/petitionsRoutes.js
const router = require('express').Router();
const ctrl = require('../controllers/petitionController');
const { authenticate } = require('../middlewares/auth');
const { signLimiter } = require('../middlewares/rateLimiter');
const { generateToken, verifyToken } = require('../middlewares/csrf');
const uploadPetition = require('../middlewares/uploadPetition');
const cache = require('../middlewares/cache');

// Middleware para gestión general (listar, editar, eliminar)
const canManagePetitions = (req, res, next) => {
  const allowedRoles = ['superadmin', 'campaign_admin', 'blog_admin'];
  if (req.user && allowedRoles.includes(req.user.role)) return next();
  res.status(403).json({ message: 'No tienes permiso para gestionar peticiones' });
};

// Middleware específico para creación: solo superadmin y campaign_admin
const canCreatePetitions = (req, res, next) => {
  const allowedRoles = ['superadmin', 'campaign_admin'];
  if (req.user && allowedRoles.includes(req.user.role)) return next();
  res.status(403).json({ message: 'No tienes permiso para crear peticiones' });
};

// CSRF
router.get('/csrf-token', (req, res) => {
  generateToken(req, res, () => res.json({ csrfToken: req.csrfSigned }));
});

// Públicas
router.get('/public', cache(60, 'petitions'), ctrl.listPublicPetitions);
router.get('/:id', cache(60, 'petitions'), ctrl.getPetition);
router.post('/:id/sign', signLimiter, verifyToken, ctrl.signPetition);

// Quota de emails (para panel admin)
router.get('/quota/today', authenticate, canManagePetitions, ctrl.getQuotaStats);

// Administración
router.get('/', authenticate, canManagePetitions, cache(60, 'petitions'), ctrl.listPetitions);
router.post('/', authenticate, canCreatePetitions, uploadPetition, ctrl.createPetition); // ⬅️ restricción de creación
router.put('/:id', authenticate, canManagePetitions, uploadPetition, ctrl.updatePetition);
router.delete('/:id', authenticate, canManagePetitions, ctrl.deletePetition);

module.exports = router;