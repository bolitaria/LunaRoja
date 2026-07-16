import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
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
        console.warn('Error al leer tokens de almacenamiento local:', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
        localStorage.removeItem('token');
        window.location.href = '/admin/login';
      } catch (err) {
        // ignorar
      }
    }
    return Promise.reject(error);
  }
);

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