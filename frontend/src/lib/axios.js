import axios from 'axios';

const isServer = typeof window === 'undefined';

// Cliente → ruta relativa (Next.js rewrite proxea al backend)
// SSR     → URL interna Docker (llamada directa, sin pasar por el navegador)
const baseURL = isServer
  ? `${(process.env.INTERNAL_API_URL || 'http://backend:5000').replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
});

// ── Interceptor de petición (solo cliente) ─────────────────────
// Añade `Authorization: Bearer <token>` si hay token en localStorage.
// El backend acepta también cookie `access_token`, pero por robustez
// enviamos ambos.
if (!isServer) {
  api.interceptors.request.use((config) => {
    try {
      const token = localStorage.getItem('token');
      if (token && token !== 'null' && token !== 'undefined') {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // localStorage puede fallar en algunos contextos (SSR, modo privado)
    }
    return config;
  });
}

export default api;
