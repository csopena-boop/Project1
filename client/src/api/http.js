// src/api/http.js (ejemplo con axios)
import axios from "axios";

let accessTokenGetter = () => null;
export function setAccessTokenGetter(fn) { accessTokenGetter = fn; }

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true, // cookies del refresh
});

// Pone el Authorization si tenés access
http.interceptors.request.use((config) => {
  const access = accessTokenGetter?.();
  if (access && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Single-flight para refresh
let refreshPromise = null;

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const original = error.config || {};
    const url = original.url || "";

    // nunca intentes refrescar para el propio /auth/refresh o si ya reintentaste
    if (status === 401 && !original._retry && !url.includes("/auth/refresh")) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = http.post("/api/auth/refresh", undefined, { withCredentials: true })
          .finally(() => { refreshPromise = null; });
      }

      try {
        const { data } = await refreshPromise; // espera una sola
        // reintenta la request original con el nuevo token
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${data.access}` };
        return http.request(original);
      } catch (e) {
        // si el refresh falla (401/429), no sigas en loop
        return Promise.reject(e);
      }
    }

    // si el refresh mismo devuelve 401/429, no reintentes nada
    if (url.includes("/auth/refresh") && (status === 401 || status === 429)) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default http;
