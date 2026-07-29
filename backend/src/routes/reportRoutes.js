const express = require('express');
const router = express.Router();
const { authenticate: authMiddleware } = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const reportController = require('../controllers/reportController');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET / y /:id accesibles para cualquier admin
router.get('/', reportController.getAllReports);
router.get('/:id', reportController.getReportById);

// POST y PUT: pueden hacerlo superadmin, blog_admin
const canEditReports = (req, res, next) => {
  const allowedRoles = ['superadmin', 'blog_admin'];
  if (allowedRoles.includes(req.user.role)) return next();
  res.status(403).json({ message: 'No tienes permiso para modificar reportes' });
};

router.post('/', canEditReports, reportController.createReport);
router.put('/:id', canEditReports, reportController.updateReport);

// DELETE: solo superadmin
router.delete('/:id', isSuperAdmin, reportController.deleteReport);

module.exports = router;
