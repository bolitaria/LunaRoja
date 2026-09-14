// backend/src/routes/actionRoutes.js
const express = require('express');
const {
  getAllActions,
  getActionById,
  createAction,
  updateAction,
  deleteAction,
  deleteActionImage
} = require('../controllers/actionController');
const { authenticate: authMiddleware } = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const { isSuperAdmin, canAccessAction } = require('../middlewares/authorize');
const cache = require('../middlewares/cache');
const uploadFields = require('../middlewares/uploadEntity');

const router = express.Router();

router.get('/', optionalAuth, cache(60, 'actions'), getAllActions);
router.get('/:id', optionalAuth, cache(60, 'actions'), getActionById);

router.post('/', authMiddleware, uploadFields, createAction);
router.put('/:id', authMiddleware, canAccessAction, uploadFields, updateAction);
router.delete('/:id', authMiddleware, isSuperAdmin, deleteAction);
router.delete('/:id/images/:imageId', authMiddleware, isSuperAdmin, deleteActionImage);

module.exports = router;