// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import "./css/register.css";             // usa la misma hoja que el register
import logo from "../../content/Logo.png";



export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({}); // { email: "msg", password: "msg" }

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  async function onSubmit(e) {
    e.preventDefault();
    setApiError("");
    setFieldErrors({});
    setLoading(true);

    try {
      await login(email, password, remember);
      navigate(from === "/" ? "/dashboard" : from, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      // Si tu backend devuelve 401 con mensaje genérico
      if (status === 401) {
        setApiError(data?.error || data?.message || "Credenciales inválidas");
        // Marcamos ambos campos en rojo para que el usuario note dónde mirar
        setFieldErrors({ email: "Revisá el correo", password: "Revisá la contraseña" });
      } else if (status === 400 && data?.errors) {
        // Si llegaran errores por campo (raro en login, pero por las dudas)
        setFieldErrors(data.errors);
      } else {
        setApiError(data?.error || "Algo salió mal. Probá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-container">
      <h1>Login</h1>

      <img
        src={logo}
        alt="Logo"
        className="logo"
        style={{ display: "block", margin: "0 auto 16px", maxWidth: 120 }}
      />

      {apiError && <div role="alert" className="error-msg" style={{ marginBottom: 8 }}>{apiError}</div>}

      <form onSubmit={onSubmit} noValidate>
        Email
        <input
          type="email"
          placeholder="Correo electrónico"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldErrors.email ? "input-error" : ""}
          aria-invalid={!!fieldErrors.email}
        />
        {fieldErrors.email && <small className="error-msg">{fieldErrors.email}</small>}

        Contraseña
        <input
          type="password"
          placeholder="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={fieldErrors.password ? "input-error" : ""}
          aria-invalid={!!fieldErrors.password}
        />
        {fieldErrors.password && <small className="error-msg">{fieldErrors.password}</small>}

        <label className="remember" htmlFor="remember">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Recordarme
        </label>

        <button className="login-button" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p>
          ¿Todavia no tenés una cuenta? <Link to="/register">Registrate</Link>
        </p>
    </div>
  );
}
