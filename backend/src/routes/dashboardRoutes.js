const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/authorize');

// Ruta temporal (luego puedes reemplazar por el controlador real)
router.get('/', authMiddleware, isSuperAdmin, (req, res) => {
  res.json({ message: 'Dashboard endpoint funcionando' });
});

module.exports = router;