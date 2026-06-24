const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middlewares/auth');        
const { isSuperAdmin } = require('../middlewares/authorize');
const upload = require('../middlewares/upload');

// Obtener documentos (requiere autenticación)
router.get('/', authMiddleware, documentController.getDocuments);
// Subir documento (requiere autenticación)
router.post('/', authMiddleware, upload.single('file'), documentController.uploadDocument);
// Eliminar documento (solo superadmin)
router.delete('/:id', authMiddleware, isSuperAdmin, documentController.deleteDocument);

module.exports = router;