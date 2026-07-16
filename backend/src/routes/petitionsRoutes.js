const router = require('express').Router();
const ctrl = require('../controllers/petitionController');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { signLimiter } = require('../middlewares/rateLimiter');
const { generateToken, verifyToken } = require('../middlewares/csrf');
const uploadPetition = require('../middlewares/uploadPetition');

// Middleware que permite acceso a cualquier administrador (superadmin, campaign_admin, blog_admin)
const canManagePetitions = (req, res, next) => {
  const allowedRoles = ['superadmin', 'campaign_admin', 'blog_admin'];
  if (req.user && allowedRoles.includes(req.user.role)) return next();
  res.status(403).json({ message: 'No tienes permiso para gestionar peticiones' });
};

router.get('/csrf-token', (req, res) => {
  generateToken(req, res, () => res.json({ csrfToken: req.csrfSigned }));
});

router.get('/public', ctrl.listPublicPetitions);
router.get('/:id', ctrl.getPetition);
router.post('/:id/sign', signLimiter, verifyToken, ctrl.signPetition);

// Crear, editar, listar y eliminar peticiones (accesible para roles de administración)
router.post('/', authenticate, canManagePetitions, uploadPetition, ctrl.createPetition);
router.put('/:id', authenticate, canManagePetitions, uploadPetition, ctrl.updatePetition);
router.get('/', authenticate, canManagePetitions, ctrl.listPetitions);
router.delete('/:id', authenticate, canManagePetitions, ctrl.deletePetition);

module.exports = router;