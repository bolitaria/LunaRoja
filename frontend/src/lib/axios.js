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
if (!isServer) {
  api.interceptors.request.use((config) => {
    try {
      const token = localStorage.getItem('token');
      if (token && token !== 'null' && token !== 'undefined') {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      // CSRF para firmas de peticiones
      if (
        (config.method === 'post' || config.method === 'put') &&
        config.url?.includes('/petitions/') &&
        config.url?.includes('/sign')
      ) {
        const csrf = sessionStorage.getItem('csrf_token');
        if (csrf) {
          config.headers = config.headers || {};
          config.headers['x-csrf-token'] = csrf;
        }
      }
    } catch (e) {
      // localStorage/sessionStorage pueden fallar (SSR, modo privado)
    }
    return config;
  });
}

// ── Interceptor de respuesta: redirect a login en 401 admin ────
if (!isServer) {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const url = error?.config?.url || '';
      if (status === 401 && url.includes('/admin')) {
        window.location.href = '/admin/login';
      }
      return Promise.reject(error);
    }
  );
}

// ── CSRF helpers ───────────────────────────────────────────────
export async function fetchCsrfToken() {
  const res = await api.get('/petitions/csrf-token');
  const token = res.data?.csrfToken;
  if (token && typeof window !== 'undefined') {
    sessionStorage.setItem('csrf_token', token);
  }
  return token;
}

export default api;
