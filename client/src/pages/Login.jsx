// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import './css/register.css';
import logo from "../../content/Logo.png";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, remember);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="register-container">
      <h1>Login</h1>
      <img src={logo} alt="Logo" />
      <form onSubmit={onSubmit}>
        <image src="../content/logo.png" alt=""></image>
        {error && <p>{error}</p>}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <label className="remember" htmlFor="remember">
            Recordarme
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
        </label>

        <button className="login-button" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <button className="register-button" type="button" onClick={() => navigate("/register")}>
        ¿Todavia no tienes una cuenta? Registrate
      </button>
       </div>
    </div>
  );
}
