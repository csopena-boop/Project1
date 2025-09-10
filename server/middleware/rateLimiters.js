const rateLimit = require('express-rate-limit');


const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const refreshLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });


module.exports = { loginLimiter, refreshLimiter };