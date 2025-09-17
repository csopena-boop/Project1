// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import "./css/register2.css";

export default function Register() {
  const navigate = useNavigate();
  const { signUp, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    doc: "",
    remember: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

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
      if (isAuthenticated) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", {
          replace: true,
          state: { justRegistered: true, email: payload.email },
        });
      }
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 409) {
        setFieldErrors({ email: "Ese correo ya está registrado." });
      } else if (status === 400 && Array.isArray(data?.details)) {
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
    <div className="div-form">
      <h1>Crear cuenta</h1>
      <p>
        ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
      </p>

      {apiError ? <div role="alert">{apiError}</div> : null}

      <form onSubmit={onSubmit} noValidate className="register-form">
        <div className="form-grid">
          Nombre
          <div>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="given-name"
              autoFocus
              value={form.name}
              onChange={onChange}
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && <small>{fieldErrors.name}</small>}
          </div>
          Apellido
          <div>
            <input
              id="surname"
              name="surname"
              type="text"
              placeholder=""
              autoComplete="family-name"
              value={form.surname}
              onChange={onChange}
              aria-invalid={!!fieldErrors.surname}
            />
            {fieldErrors.surname && <small>{fieldErrors.surname}</small>}
          </div>
          Correo electrónico
          <div>
            <input
              id="email"
              name="email"
              type="email"
              placeholder=""
              autoComplete="email"
              value={form.email}
              onChange={onChange}
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && <small>{fieldErrors.email}</small>}
          </div>
          Contraseña
          <div>
            <input
              id="password"
              name="password"
              type="password"
              placeholder=""
              autoComplete="new-password"
              value={form.password}
              onChange={onChange}
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password && <small>{fieldErrors.password}</small>}
          </div>
          Documento
          <div>
            <input
              id="doc"
              name="doc"
              type="text"
              placeholder=""
              autoComplete="off"
              value={form.doc}
              onChange={onChange}
              aria-invalid={!!fieldErrors.doc}
            />
            {fieldErrors.doc && <small>{fieldErrors.doc}</small>}
          </div>

          <div>
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={onChange}
            />
            <span>Recordarme en este dispositivo</span>
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Creando..." : "Crear cuenta"}
          </button>
        </div>
      </form>
    </div>
  );
}
