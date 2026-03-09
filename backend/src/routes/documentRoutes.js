const express = require('express');
const { getDocuments, uploadDocument, deleteDocument } = require('../controllers/documentController');
const authMiddleware = require('../middlewares/auth');
const upload = require('../middlewares/uploadDocument');
const router = express.Router();

router.get('/', authMiddleware, getDocuments);
router.post('/', authMiddleware, upload.single('file'), uploadDocument);
router.delete('/:id', authMiddleware, deleteDocument);

module.exports = router;