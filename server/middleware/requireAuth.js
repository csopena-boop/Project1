const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');


async function requireAuth(req, res, next) {
try {
const auth = req.headers.authorization || '';
const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
if (!token) return res.status(401).json({ message: 'Unauthorized' });


const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
const user = await User.findById(payload.sub).lean();
if (!user) return res.status(401).json({ message: 'Unauthorized' });


// invalidar si cambió la contraseña luego de emitir el token
if (user.passwordChangedAt && payload.pca && user.passwordChangedAt.getTime() > payload.pca) {
return res.status(401).json({ message: 'Token expired' });
}


req.user = { id: user._id.toString(), roles: user.roles };
next();
} catch (err) {
return res.status(401).json({ message: 'Unauthorized' });
}
}


module.exports = { requireAuth };