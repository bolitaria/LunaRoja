import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/axios';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    if (hasCheckedSession.current) return;
    hasCheckedSession.current = true;

    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/users/me')
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token, user: userData } = res.data;

      if (!token) throw new Error('Token no recibido');

      // 1. Guardar token y establecer usuario INMEDIATAMENTE
      localStorage.setItem('token', token);
      setUser(userData);

      // 2. Redirigir al dashboard (no a /admin)
      router.push('/admin/dashboard');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión',
      };
    }
  };

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignorar
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      router.push('/admin/login');
    }
  }, [router]);

  const value = { user, login, logout, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}