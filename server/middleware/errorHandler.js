function errorHandler(err, req, res, _next) {
  console.error(err);

  // 1) Validación schema (required, match, custom validate)
  if (err?.name === "ValidationError") {
    const errors = {};
    for (const field in err.errors) {
      errors[field] = err.errors[field].message || "dato inválido";
    }
    return res.status(400).json({ errors });
  }

  // 2) CastError (ObjectId o tipo inválido)
  if (err?.name === "CastError") {
    return res.status(400).json({ errors: { [err.path]: "dato inválido" } });
  }

  // 3) Duplicados por índice único
  if (err?.code === 11000 || (err?.name === "MongoServerError" && err?.code === 11000)) {
    const errors = {};
    for (const k of Object.keys(err.keyValue || err.keyPattern || {})) {
      errors[k] = `${k} ya existe`;
    }
    return res.status(409).json({ errors });
  }

  // 4) JWT
  if (err?.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "token inválido" });
  }
  if (err?.name === "TokenExpiredError") {
    return res.status(401).json({ error: "token expirado" });
  }

  // 5) Fallback
  const status = err.status || 500;
  return res.status(status).json({
    error: err.publicMessage || err.message || "Something went wrong",
  });
}

module.exports = { errorHandler };
