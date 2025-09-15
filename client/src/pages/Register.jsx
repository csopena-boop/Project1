// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function Register() {
  const navigate = useNavigate();
  const { signUp, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    doc:"",
    remember: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");        // errores generales
  const [fieldErrors, setFieldErrors] = useState({});  // { name: "...", email: "...", ... }

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setApiError("");
    setFieldErrors({});

    const payload = {
      name: form.name.trim(),
      surname: form.surname.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      remember: form.remember,
      doc: String(form.doc || "").trim(),
    };

    try {
      await signUp(payload);

      // Si tu backend hace autologin, isAuthenticated queda true y te mando a /dashboard.
      // Si no hace autologin, te mando a /login.
      if (isAuthenticated) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true, state: { justRegistered: true, email: payload.email } });
      }
    } catch (err) {
      // Distintos sabores de error. Adaptá si tu backend devuelve otra forma.
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 409) {
        setFieldErrors({ email: "Ese correo ya está registrado." });
      } else if (status === 400 && Array.isArray(data?.details)) {
        // Espero algo como: details: [{ path: "email", message: "..." }, ...]
        const mapped = {};
        for (const d of data.details) {
          const key = d.path || d.field || "general";
          mapped[key] = d.message || "Dato inválido.";
        }
        setFieldErrors(mapped);
        if (mapped.general) setApiError(mapped.general);
      } else {
        setApiError(data?.error || "Algo falló. Probá de nuevo más tarde.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="register-page" style={{ maxWidth: 420, margin: "48px auto" }}>
      <h1 style={{ marginBottom: 8 }}>Crear cuenta</h1>
      <p style={{ marginBottom: 24 }}>
        ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
      </p>

      {apiError ? (
        <div role="alert" style={{ background: "#fee2e2", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {apiError}
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="given-name"
              autoFocus
              value={form.name}
              onChange={onChange}
              aria-invalid={!!fieldErrors.name}
              style={{ width: "100%" }}
            />
            {fieldErrors.name && <small style={{ color: "#b91c1c" }}>{fieldErrors.name}</small>}
          </div>

          <div>
            <label htmlFor="surname">Apellido</label>
            <input
              id="surname"
              name="surname"
              type="text"
              autoComplete="family-name"
              value={form.surname}
              onChange={onChange}
              aria-invalid={!!fieldErrors.surname}
              style={{ width: "100%" }}
            />
            {fieldErrors.surname && <small style={{ color: "#b91c1c" }}>{fieldErrors.surname}</small>}
          </div>

          <div>
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={onChange}
              aria-invalid={!!fieldErrors.email}
              style={{ width: "100%" }}
            />
            {fieldErrors.email && <small style={{ color: "#b91c1c" }}>{fieldErrors.email}</small>}
          </div>

          <div>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={onChange}
              aria-invalid={!!fieldErrors.password}
              style={{ width: "100%" }}
            />
            {fieldErrors.password && <small style={{ color: "#b91c1c" }}>{fieldErrors.password}</small>}
          </div>

          <div>
            <label htmlFor="doc">Numero de Documento</label>
            <input
              id="doc"
              name="doc"
              type="text"
              autoComplete="off"
              value={form.doc}
              onChange={onChange}
              aria-invalid={!!fieldErrors.doc}
              style={{ width: "100%" }}
            />
            {fieldErrors.doc && <small style={{ color: "#b91c1c" }}>{fieldErrors.doc}</small>}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={onChange}
            />
            Recordarme en este dispositivo
          </label>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #111",
              background: submitting ? "#ddd" : "#111",
              color: "#fff",
              cursor: submitting ? "not-allowed" : "pointer",
              marginTop: 8,
            }}
          >
            {submitting ? "Creando..." : "Crear cuenta"}
          </button>
        </div>
      </form>
    </div>
  );
}
