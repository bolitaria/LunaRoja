const express = require('express');
const router = express.Router();
const { authenticate: authMiddleware } = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');
const { isSuperAdmin } = require('../middlewares/authorize');
const cache = require('../middlewares/cache');
const bdsController = require('../controllers/bdsController');
const uploadEntity = require('../middlewares/uploadEntity');

router.get('/', optionalAuth, cache(60, 'bds'), bdsController.getAllBDS);
router.get('/:id', optionalAuth, cache(60, 'bds'), bdsController.getBDSById);

router.post('/', authMiddleware, isSuperAdmin, uploadEntity, bdsController.createBDS);
router.put('/:id', authMiddleware, isSuperAdmin, uploadEntity, bdsController.updateBDS);
router.delete('/:id', authMiddleware, isSuperAdmin, bdsController.deleteBDS);

module.exports = router;
