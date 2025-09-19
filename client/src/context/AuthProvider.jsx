// src/context/AuthProvider.jsx
/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import http, { setAccessTokenGetter } from "../api/http";

export const AuthContext = createContext(null);
const PERSIST_KEY = "auth_persist";

export function AuthProvider({ children }) {
  const [access, setAccess] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [persist, setPersistState] = useState(
    localStorage.getItem(PERSIST_KEY) === "true"
  );

  // Lock para evitar refresh concurrente/loop
  const refreshLock = useRef(false);

  // Que http pueda leer siempre el access actual
  useEffect(() => {
    setAccessTokenGetter(() => access);
  }, [access]);

  // Hidratación inicial si hay persistencia
  useEffect(() => {
    let alive = true;

    async function hydrate() {
      if (!persist) {
        setLoading(false);
        return;
      }
      if (refreshLock.current) return; // ya hay refresh corriendo
      refreshLock.current = true;

      try {
        // Importante si usás cookie httpOnly para refresh
        const { data } = await http.post(
          "/api/auth/refresh",
          undefined,
          { withCredentials: true }
        );
        if (!alive) return;

        setAccess(data.access);

        const me = await http.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${data.access}` },
          withCredentials: true,
        });
        if (!alive) return;

        setUser(me.data.user);
      } catch {
        // Si falla el refresh, limpiamos sesión
        setAccess(null);
        setUser(null);
      } finally {
        if (alive) setLoading(false);
        refreshLock.current = false;
      }
    }

    hydrate();
    return () => {
      alive = false;
    };
  }, [persist]); // solo depende de persist

  async function login(email, password, remember) {
    const res = await http.post(
      "/api/auth/login",
      { email, password },
      { withCredentials: true }
    );
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

  async function logout() {
    try {
      await http.post("/api/auth/logout", undefined, { withCredentials: true });
    } catch {
      // chill
    }
    setAccess(null);
    setUser(null);
    localStorage.removeItem(PERSIST_KEY);
    setPersistState(false);
  }

  async function signUp({ name, surname, email, password, remember, doc }) {
    const payload = {
      name: name?.trim(),
      surname: surname?.trim(),
      email: email?.trim()?.toLowerCase(),
      password: password ?? "",
      doc: doc ?? "",
    };

    const res = await http.post(
      "/api/auth/register",
      payload,
      { withCredentials: true }
    );

    // Si el backend hace autologin y devuelve { access, user }
    if (res.data?.access && res.data?.user) {
      setAccess(res.data.access);
      setUser(res.data.user);

      if (remember) {
        localStorage.setItem(PERSIST_KEY, "true");
        setPersistState(true);
      } else {
        localStorage.removeItem(PERSIST_KEY);
        setPersistState(false);
      }
      return { autologin: true };
    }

    return { autologin: false };
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
      signUp,
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

// Export default opcional para imports cómodos
export default AuthProvider;
