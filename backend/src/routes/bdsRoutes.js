const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');
const bdsController = require('../controllers/bdsController');

router.use(authMiddleware);
router.use(isSuperAdmin);   // solo superadmin por ahora (ajusta según necesidad)

router.get('/', bdsController.getAllBDS);
router.get('/:id', bdsController.getBDSById);
router.post('/', bdsController.createBDS);
router.put('/:id', bdsController.updateBDS);
router.delete('/:id', bdsController.deleteBDS);

module.exports = router;