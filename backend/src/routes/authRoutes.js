const express = require('express');
const { register, login, getMe, logout, refresh } = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

module.exports = router;