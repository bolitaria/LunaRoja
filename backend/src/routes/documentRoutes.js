const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticate: authMiddleware } = require('../middlewares/auth');

/**
 * Middleware: cualquier admin autenticado.
 * El controlador aplica scope por entidad (campaign_admin solo sus campañas,
 * action_admin solo sus acciones, etc.). Aquí solo verificamos que no sea
 * un usuario anónimo.
 */
function anyAdmin(req, res, next) {
  const adminRoles = ['superadmin', 'campaign_admin', 'action_admin', 'bds_admin', 'blog_admin'];
  if (!req.user || !adminRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
}

/**
 * Rutas de documentos.
 *
 * Nota: la subida de documentos se hace DENTRO del form de cada entidad
 * (POST /api/actions, /api/campaigns, /api/bds, /api/reports) usando el
 * campo `documents[N][...]` procesado por `uploadEntity`.
 *
 * Estas rutas son solo para gestionar documentos existentes:
 *   - GET    /api/documents      → listar (con scope)
 *   - DELETE /api/documents/:id  → eliminar (con scope)
 */

router.get('/', authMiddleware, anyAdmin, documentController.getDocuments);
router.delete('/:id', authMiddleware, anyAdmin, documentController.deleteDocument);

module.exports = router;
