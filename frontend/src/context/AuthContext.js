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

    const checkSession = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      setUser(res.data.user);
      router.push('/admin');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al iniciar sesión' };
    }
  };

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Error en logout', err);
    } finally {
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