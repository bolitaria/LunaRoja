const express = require('express');
const router = express.Router();
delete require.cache[require.resolve('../controllers/colectivosAfinesController')]; const controller = require('../controllers/colectivosAfinesController');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { upload } = require('../middlewares/uploadColectivosAfines');

router.get('/public', controller.getAll);
router.get('/', authenticate, isAdmin, controller.getAll);
router.get('/:id', authenticate, isAdmin, controller.getById);
router.post('/', authenticate, isAdmin, upload.single('imagen'), controller.create);
router.put('/:id', authenticate, isAdmin, upload.single('imagen'), controller.update);
router.delete('/:id', authenticate, isAdmin, controller.delete);

module.exports = router;
