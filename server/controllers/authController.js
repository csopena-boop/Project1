const jwt2 = require('jsonwebtoken');
const crypto = require('crypto');
const argon2 = require('argon2');
const env2 = require('../config/env');
const User2 = require('../models/User');
const Session = require('../models/session');

// Helpers
const hash = (s) => crypto.createHash('sha256').update(s).digest('hex');
const now = () => Date.now();
const addMs = (ms) => new Date(now() + ms);

function ttlToMs(ttl) {
  const m = ttl.match(/^(\d+)([mhd])$/i);
  if (!m) return Number(ttl) || 0;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  return u === 'm' ? n * 60_000 : u === 'h' ? n * 3_600_000 : n * 86_400_000;
}

const ACCESS_MS = ttlToMs(env2.ACCESS_TTL);
const REFRESH_MS = ttlToMs(env2.REFRESH_TTL);

function signAccess(user) {
  return jwt2.sign(
    { sub: user._id.toString(), roles: user.roles, pca: user.passwordChangedAt?.getTime?.() || Date.now() },
    env2.JWT_ACCESS_SECRET,
    { expiresIn: Math.floor(ACCESS_MS / 1000) }
  );
}

function signRefresh(userId, familyId) {
  return jwt2.sign({ sub: userId, fam: familyId }, env2.JWT_REFRESH_SECRET, {
    expiresIn: Math.floor(REFRESH_MS / 1000),
  });
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env2.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: REFRESH_MS,
  };
}

async function register(req, res) {
  // TODO: validar inputs con Zod/Joi
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Invalid' });

  const exists = await User2.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email in use' });

  const passwordHash = await argon2.hash(password);
  const user = await User2.create({ email, passwordHash });

  return res.status(201).json({ user: { id: user._id, email: user.email, roles: user.roles } });
}

async function login(req, res) {
  // TODO: rate limit en ruta
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Invalid' });

  const user = await User2.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const access = signAccess(user);
  const familyId = crypto.randomUUID();
  const refresh = signRefresh(user._id.toString(), familyId);

  await Session.create({
    user: user._id,
    tokenHash: hash(refresh),
    familyId,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    expiresAt: addMs(REFRESH_MS),
  });

  res.cookie(env2.COOKIE_NAME_REFRESH, refresh, refreshCookieOptions());
  res.json({ access, user: { id: user._id, email: user.email, roles: user.roles } });
}

async function refresh(req, res) {
  const token = req.cookies?.[env2.COOKIE_NAME_REFRESH];
  if (!token) return res.status(401).json({ message: 'No refresh' });

  let payload;
  try {
    payload = jwt2.verify(token, env2.JWT_REFRESH_SECRET);
  } catch (_e) {
    res.clearCookie(env2.COOKIE_NAME_REFRESH, refreshCookieOptions());
    return res.status(401).json({ message: 'Invalid refresh' });
  }

const tokenHash = hash(token);
const session = await Session.findOne({ tokenHash });

if (!session) {
    // posible reuso: revocar toda la familia
    await Session.updateMany({ user: payload.sub, familyId: payload.fam, revokedAt: null }, { $set: { revokedAt: new Date() } });
    res.clearCookie(env2.COOKIE_NAME_REFRESH, refreshCookieOptions());
    return res.status(401).json({ message: 'Reused/unknown refresh' });
  }

  if (session.revokedAt) {
    res.clearCookie(env2.COOKIE_NAME_REFRESH, refreshCookieOptions());
    return res.status(401).json({ message: 'Revoked refresh' });
  }

  const user = await User2.findById(session.user);
  if (!user) {
    res.clearCookie(env2.COOKIE_NAME_REFRESH, refreshCookieOptions());
    return res.status(401).json({ message: 'User not found' });
  }


  // Rotar: emitir nuevos tokens, revocar la sesión anterior
  const access = signAccess(user);
  const newRefresh = signRefresh(user._id.toString(), session.familyId);

  const newSession = await Session.create({
    user: user._id,
    tokenHash: hash(newRefresh),
    familyId: session.familyId,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    expiresAt: addMs(REFRESH_MS),
  });

  session.revokedAt = new Date();
  session.replacedBy = newSession._id.toString();
  await session.save();

  res.cookie(env2.COOKIE_NAME_REFRESH, newRefresh, refreshCookieOptions());
  res.json({ access, user: { id: user._id, email: user.email, roles: user.roles } });
}

async function logout(req, res) {
  const token = req.cookies?.[env2.COOKIE_NAME_REFRESH];
  if (token) {
    const tokenHash = hash(token);
    await Session.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
  }
  res.clearCookie(env2.COOKIE_NAME_REFRESH, refreshCookieOptions());
  res.status(204).end();
}

async function me(req, res) {
  // requiere requireAuth
  return res.json({ user: { id: req.user.id, roles: req.user.roles } });
}

module.exports = { register, login, refresh, logout, me };