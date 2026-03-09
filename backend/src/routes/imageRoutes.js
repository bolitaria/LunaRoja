const express = require('express');
const { getAllImages, deleteImage } = require('../controllers/imageController');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

router.get('/', authMiddleware, getAllImages);
router.delete('/:id', authMiddleware, deleteImage);

module.exports = router;