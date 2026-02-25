import { useEffect } from 'react';
import { useRouter } from 'next/router';

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

export const logout = () => {
  localStorage.removeItem('token');
  // Opcional: redirigir al login si se llama desde un componente
};

// Higher-order component to protect admin routes
export const withAuth = (WrappedComponent) => {
  return (props) => {
    const router = useRouter();
    useEffect(() => {
      const token = getAuthToken();
      if (!token) {
        router.replace('/admin/login');
      }
    }, []);
    return <WrappedComponent {...props} />;
  };
};