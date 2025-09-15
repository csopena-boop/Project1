// src/context/AuthProvider.jsx
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import http, { setAccessTokenGetter } from "../api/http";


export const AuthContext = createContext(null);
const PERSIST_KEY = "auth_persist";

export function AuthProvider({ children }) {
  const [access, setAccess] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [persist, setPersistState] = useState(localStorage.getItem(PERSIST_KEY) === "true");

  useEffect(() => {
    setAccessTokenGetter(() => access);
  }, [access]);

  useEffect(() => {
    let alive = true;

    async function hydrate() {
      if (!persist) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await http.post("/api/auth/refresh");
        if (!alive) return;

        setAccess(data.access);

        const me = await http.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${data.access}` },
        });
        if (!alive) return;

        setUser(me.data.user);
      }  catch {
        setAccess(null);
        setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    hydrate();
    return () => {
      alive = false;
    };
  }, [persist]);

  async function login(email, password, remember) {
    const res = await http.post("/api/auth/login", { email, password });
    setAccess(res.data.access);
    console.log('LOGIN OK access len:', res.data.access?.length, 'user:', res.data.user?.email);
    setUser(res.data.user);

    if (remember) {
      localStorage.setItem(PERSIST_KEY, "true");
      setPersistState(true);
    } else {
      localStorage.removeItem(PERSIST_KEY);
      setPersistState(false);
    }
  }

  async function logout() {
    try {
    await http.post("/api/auth/logout");
  } catch (e) {
    void e;
  }
    setAccess(null);
    setUser(null);
    localStorage.removeItem(PERSIST_KEY);
    setPersistState(false);
  }

// dentro de AuthProvider.jsx
async function signUp({ name, surname, email, password, remember, doc }) {
  const payload = {
    name: name?.trim(),
    surname: surname?.trim(),
    email: email?.trim()?.toLowerCase(),
    password: password ?? "",
    doc: doc ?? "",
  };

  const res = await http.post("/api/auth/register", payload);
  // espero { access, user } como en login
  setAccess(res.data.access);
  setUser(res.data.user);

  if (remember) {
    localStorage.setItem(PERSIST_KEY, "true");
    setPersistState(true);
  } else {
    localStorage.removeItem(PERSIST_KEY);
    setPersistState(false);
  }
}

  const value = useMemo(
    () => ({
      access,
      user,
      isAuthenticated: !!access,
      loading,
      persist,
      setPersist: (next) => {
        if (next) {
          localStorage.setItem(PERSIST_KEY, "true");
        } else {
          localStorage.removeItem(PERSIST_KEY);
        }
        setPersistState(!!next);
      },
      login,
      logout,
      signUp
    }),
    [access, user, loading, persist]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


