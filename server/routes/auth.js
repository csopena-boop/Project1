const router = require('express').Router();
const { register, login, refresh, logout, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/requireAuth');
const { loginLimiter, refreshLimiter } = require('../middleware/rateLimiters');

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

module.exports = router;