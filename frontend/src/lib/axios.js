import axios from 'axios';

// Usamos ruta relativa para que Next.js reescriba las peticiones al backend
// (requiere tener configurados los rewrites en next.config.js)
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,      // si usas cookies para refresh tokens
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor de petición ──
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        // Ajusta 'auth_token' según cómo guardes el token al hacer login
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // CSRF para firmas de peticiones (se mantiene igual)
        if (
          (config.method === 'post' || config.method === 'put') &&
          config.url?.includes('/petitions/') &&
          config.url?.includes('/sign')
        ) {
          const csrf = sessionStorage.getItem('csrf_token');
          if (csrf) {
            config.headers['x-csrf-token'] = csrf;
          }
        }
      } catch (err) {
        console.warn('Error al leer tokens de almacenamiento:', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor de respuesta ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/admin') &&
      window.location.pathname !== '/admin/login'
    ) {
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        window.location.href = '/admin/login';
      } catch (err) {
        // ignorar
      }
    }
    return Promise.reject(error);
  }
);

// ── Helper para CSRF (sin cambios) ──
export async function fetchCsrfToken() {
  try {
    const res = await api.get('/petitions/csrf-token');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('csrf_token', res.data.csrfToken);
    }
    return res.data.csrfToken;
  } catch (err) {
    console.error('No se pudo obtener el token CSRF:', err);
    throw err;
  }
}

export default api;