const router = require('express').Router();
const { register, login, refresh, logout, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/requireAuth');
const { loginLimiter, refreshLimiter } = require('../middleware/rateLimiters');

const User = require("../models/User"); // asegurate de importar el modelo

// Registro de usuario
// OJO: si usás async/await, NUNCA te olvides el try/catch y pasar el error al next()
// para que lo maneje el middleware de errores. Si no, se te cuelga la app ante un error.

router.post("/register", async (req, res, next) => {
  try {
    const user = await User.create(req.body); // dispara validación del schema
    res.status(201).json({ user });           // si querés autologin, acá añadís tokens
  } catch (err) {
    return next(err); // <- IMPORTANTÍSIMO
  }
});
router.post('/login', loginLimiter, login);
router.post('/refresh', refreshLimiter, refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

module.exports = router;