const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();
router.get('/me', authMiddleware, getMe);

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);

module.exports = router;