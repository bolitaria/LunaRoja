const router = require('express').Router();
const ctrl = require('../controllers/linksController');
const { authenticate } = require('../middlewares/auth');

// Middleware que restringe la gestión a superadmin y blog_admin
const canManageLinks = (req, res, next) => {
  const allowedRoles = ['superadmin', 'blog_admin'];
  if (req.user && allowedRoles.includes(req.user.role)) return next();
  res.status(403).json({ message: 'No tienes permiso para gestionar enlaces de interés' });
};

// Ruta pública (no requiere autenticación)
router.get('/public', ctrl.publicLinks);

// Rutas protegidas
router.get('/', authenticate, canManageLinks, ctrl.listLinks);
router.post('/', authenticate, canManageLinks, ctrl.createLink);
router.put('/:id', authenticate, canManageLinks, ctrl.updateLink);
router.delete('/:id', authenticate, canManageLinks, ctrl.deleteLink);

module.exports = router;