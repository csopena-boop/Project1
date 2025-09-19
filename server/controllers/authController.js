// controllers/authController.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const argon2 = require("argon2");
const env = require("../config/env");
const User = require("../models/User");
const Session = require("../models/session");

// Helpers
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const now = () => Date.now();
const addMs = (ms) => new Date(now() + ms);

function ttlToMs(ttl) {
  const m = ttl?.toString()?.match?.(/^(\d+)([mhd])$/i);
  if (!m) return Number(ttl) || 0;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  return u === "m" ? n * 60_000 : u === "h" ? n * 3_600_000 : n * 86_400_000;
}

const ACCESS_MS = ttlToMs(env.ACCESS_TTL);     // ej "15m"
const REFRESH_MS = ttlToMs(env.REFRESH_TTL);   // ej "30d"

// Tokens
function signAccess(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      roles: user.roles,
      pca: user.passwordChangedAt?.getTime?.() || Date.now(), // invalidar access si cambió password
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: Math.floor(ACCESS_MS / 1000) }
  );
}

function signRefresh(userId, familyId) {
  // jti random para evitar tokens idénticos si chocan en el mismo segundo
  return jwt.sign(
    { sub: userId, fam: familyId, jti: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    { expiresIn: Math.floor(REFRESH_MS / 1000) }
  );
}

// Cookie del refresh (mismos flags para setear y limpiar)
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: REFRESH_MS,
  };
}

// ============ Controllers ============

async function register(req, res, next) {
  try {
    const { _id, id, ...body } = req.body || {};
    const { email, password, name, surname, doc, phone } = body;
    if (!email || !password || !name || !surname) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    const normEmail = String(email).trim().toLowerCase();
    const normDoc = doc != null ? String(doc).replace(/\D/g, "") : undefined;
    const normTel = phone != null ? String(phone).replace(/\D/g, "") : undefined;

    const exists = await User.findOne({ email: normEmail }).lean();
    if (exists) return res.status(409).json({ message: "Email en uso" });

    const passwordHash = await argon2.hash(password);

    const user = await User.create({
      email: normEmail,
      passwordHash,
      name: String(name).trim(),
      surname: String(surname).trim(),
      ...(normDoc && { doc: normDoc }),
      ...(normTel && { phone: normTel }),
    });

    // Si querés autologin al registrar, descomentá abajo:
    // const access = signAccess(user);
    // const familyId = crypto.randomUUID();
    // const refresh = signRefresh(user._id.toString(), familyId);
    // await Session.create({
    //   user: user._id,
    //   tokenHash: sha256(refresh),
    //   familyId,
    //   userAgent: req.headers["user-agent"],
    //   ip: req.ip,
    //   expiresAt: addMs(REFRESH_MS),
    // });
    // res.cookie(env.COOKIE_NAME_REFRESH, refresh, refreshCookieOptions());
    // return res.status(201).json({ access, user: sanitize(user) });

    return res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
        name: user.name,
        surname: user.surname,
        doc: user.doc,
        phone: user.phone,
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      const key = Object.keys(err.keyPattern || {})[0] || "clave";
      return res.status(409).json({ message: `${key} en uso` });
    }
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Invalid" });

    const normEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normEmail });
    if (!user) return res.status(401).json({ message: "Revisa los datos nuevamente" });

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) return res.status(401).json({ message: "Revisa los datos nuevamente" });

    const access = signAccess(user);
    const familyId = crypto.randomUUID();
    const refresh = signRefresh(user._id.toString(), familyId);

    await Session.create({
      user: user._id,
      tokenHash: sha256(refresh),
      familyId,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      expiresAt: addMs(REFRESH_MS),
    });

    res.cookie(env.COOKIE_NAME_REFRESH, refresh, refreshCookieOptions());
    res.json({
      access,
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
        name: user.name,
        surname: user.surname,
        doc: user.doc,
        phone: user.phone,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[env.COOKIE_NAME_REFRESH];
    if (!token) return res.status(401).json({ message: "No refresh" });

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch (_e) {
      res.clearCookie(env.COOKIE_NAME_REFRESH, refreshCookieOptions());
      return res.status(401).json({ message: "Invalid refresh" });
    }

    const oldHash = sha256(token);
    const session = await Session.findOne({ tokenHash: oldHash });
    if (!session) {
      // posible replay: revocar toda la familia
      await Session.updateMany(
        { user: payload.sub, familyId: payload.fam, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
      res.clearCookie(env.COOKIE_NAME_REFRESH, refreshCookieOptions());
      return res.status(401).json({ message: "Reused/unknown refresh" });
    }
    if (session.revokedAt) {
      res.clearCookie(env.COOKIE_NAME_REFRESH, refreshCookieOptions());
      return res.status(401).json({ message: "Revoked refresh" });
    }

    const user = await User.findById(session.user);
    if (!user) {
      res.clearCookie(env.COOKIE_NAME_REFRESH, refreshCookieOptions());
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    // Generar nuevo refresh
    const newRefresh = signRefresh(user._id.toString(), session.familyId);
    const newHash = sha256(newRefresh);
    const newExp = addMs(REFRESH_MS);

    // Rotación ATÓMICA en la MISMA doc, evita E11000
    const upd = await Session.updateOne(
      { _id: session._id, tokenHash: oldHash, revokedAt: null },
      { $set: { tokenHash: newHash, expiresAt: newExp } }
    );
    if (!upd.matchedCount) {
      // alguien ya rotó en paralelo
      return res.status(409).json({ message: "refresh replay" });
    }

    res.cookie(env.COOKIE_NAME_REFRESH, newRefresh, refreshCookieOptions());
    const access = signAccess(user);

    return res.json({
      access,
      user: { id: user._id, email: user.email, roles: user.roles, name: user.name, surname: user.surname },
    });
  } catch (err) {
    // por si llega igual un duplicado por algo raro
    if (err?.code === 11000) {
      return res.status(409).json({ message: "refresh dup key" });
    }
    next(err);
  }
}

async function logout(req, res, _next) {
  const token = req.cookies?.[env.COOKIE_NAME_REFRESH];
  if (token) {
    await Session.updateOne({ tokenHash: sha256(token) }, { $set: { revokedAt: new Date() } });
  }
  res.clearCookie(env.COOKIE_NAME_REFRESH, refreshCookieOptions());
  res.status(204).end();
}

async function me(req, res, next) {
  try {
    // req.user viene de tu middleware requireAuth
    const user = await User.findById(req.user.id)
      .select("email roles name surname doc phone")
      .lean();

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    return res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, me };
