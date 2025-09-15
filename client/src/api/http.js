import axios from 'axios';

// 1) Crear UNA instancia compartida
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,   // 2) Tu API base (ej: http://localhost:5000)
  withCredentials: true,                   // 3) Enviar/recibir cookies (refresh token)
  timeout: 15000                           // 4) Cortar requests colgados a los 15s
});

// 5) “Getter” que trae el access token desde donde lo tengas (Context, store)
let getAccessToken = null;
export function setAccessTokenGetter(fn) {
  getAccessToken = fn; // lo seteás una vez desde tu AuthProvider
}

// 6) Interceptor de REQUEST: agrega Authorization si hay access
http.interceptors.request.use((config) => {
  const token = getAccessToken ? getAccessToken() : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 7) Interceptor de RESPONSE (mínimo): dejar pasar o rechazar
http.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err) // acá después metemos refresh inteligente
);

export default http;
