// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
// Usá el CSS donde definiste .register-container, .login-button, etc.
// Ajustá la ruta si tu archivo está en otro lado.
import "./css/register.css";

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

      // Si tu backend hace autologin, podrías no necesitar chequear isAuthenticated acá.
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
        // Conflicto: normalmente email duplicado
        setFieldErrors({ email: "Ese correo ya está registrado." });
      } else if (status === 400) {
        // Nuestro errorHandler manda { errors: { campo: "mensaje" } }
        if (data?.errors && typeof data.errors === "object") {
          setFieldErrors(data.errors);
        } else if (Array.isArray(data?.details)) {
          // Por si alguna ruta usa formato alterno
          const mapped = {};
          for (const d of data.details) {
            const key = d.path || d.field || "general";
            mapped[key] = d.message || "Dato inválido.";
          }
          setFieldErrors(mapped);
          if (mapped.general) setApiError(mapped.general);
        } else {
          setApiError(data?.error || "Los campos no fueron completados correctamente.");
        }
      } else {
        setApiError(data?.error || "Los campos no fueron completados correctamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="register-container">
      <h1>Crear cuenta</h1>

      <form onSubmit={onSubmit} noValidate>
        Nombre
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Nombre"
          autoComplete="given-name"
          autoFocus
          value={form.name}
          onChange={onChange}
          aria-invalid={!!fieldErrors.name}
          className={fieldErrors.name ? "input-error" : ""}
        />
        {fieldErrors.name && <small className="error-msg">{fieldErrors.name}</small>}

        Apellido
        <input
          id="surname"
          name="surname"
          type="text"
          placeholder="Apellido"
          autoComplete="family-name"
          value={form.surname}
          onChange={onChange}
          aria-invalid={!!fieldErrors.surname}
          className={fieldErrors.surname ? "input-error" : ""}
        />
        {fieldErrors.surname && <small className="error-msg">{fieldErrors.surname}</small>}

        Email
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Correo electrónico"
          autoComplete="email"
          value={form.email}
          onChange={onChange}
          aria-invalid={!!fieldErrors.email}
          className={fieldErrors.email ? "input-error" : ""}
        />
        {fieldErrors.email && <small className="error-msg">{fieldErrors.email}</small>}

        Password
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Contraseña"
          autoComplete="new-password"
          value={form.password}
          onChange={onChange}
          aria-invalid={!!fieldErrors.password}
          className={fieldErrors.password ? "input-error" : ""}
        />
        {fieldErrors.password && <small className="error-msg">{fieldErrors.password}</small>}

        Documento
        <input
          id="doc"
          name="doc"
          type="text"
          placeholder="Documento"
          autoComplete="off"
          value={form.doc}
          onChange={onChange}
          aria-invalid={!!fieldErrors.doc}
          className={fieldErrors.doc ? "input-error" : ""}
        />
        {fieldErrors.doc && <small className="error-msg">{fieldErrors.doc}</small>}

        <button type="submit" className="login-button" disabled={submitting}>
          {submitting ? "Creando..." : "Crear cuenta"}
        </button>

        <p>
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>

        {apiError ? <div role="alert">{apiError}</div> : null}
      </form>
    </div>
  );
}
