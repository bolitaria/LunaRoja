import axios from 'axios';

// Instancia de axios con configuración base
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// --- Interceptor de solicitud ---
// Añade el token JWT (de autenticación) a todas las peticiones.
// Además, añade el token CSRF específicamente para las peticiones de firma.
api.interceptors.request.use(
  (config) => {
    // Solo se ejecuta en el cliente (navegador)
    if (typeof window !== 'undefined') {
      try {
        // 1. Token JWT de autenticación (obtenido de localStorage)
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 2. Token CSRF (solo para POST/PUT a /petitions/*/sign)
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
        // Si falla el acceso al almacenamiento local, no interrumpimos la petición.
        console.warn('Error al leer tokens de almacenamiento local:', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Interceptor de respuesta ---
// Si el servidor devuelve 401 (no autorizado), limpiamos el token y redirigimos al login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/admin/login'
    ) {
      try {
        localStorage.removeItem('token');
        // Redirigir solo si no estamos ya en la página de login
        window.location.href = '/admin/login';
      } catch (err) {
        // Ignorar errores de redirección o limpieza
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Obtiene un token CSRF desde el backend y lo guarda en sessionStorage.
 * Esta función debe llamarse antes de enviar cualquier petición de firma.
 * @returns {Promise<string>} El token CSRF
 */
export async function fetchCsrfToken() {
  try {
    const res = await api.get('/petitions/csrf-token');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('csrf_token', res.data.csrfToken);
    }
    return res.data.csrfToken;
  } catch (err) {
    console.error('No se pudo obtener el token CSRF:', err);
    // Re-lanzamos el error para que el llamador pueda manejarlo
    throw err;
  }
}

export default api;