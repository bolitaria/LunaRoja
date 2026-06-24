import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../../context/AuthContext';

export default function AdminLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.warning('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Inicio de sesión exitoso');
      router.push('/admin');
    } catch (error) {
      const msg = error.response?.data?.message || 'Credenciales inválidas';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200">
        <div className="text-center mb-6">
          <img src="/logo.svg" alt="Logo" className="h-16 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-sm text-gray-500">Inicia sesión para continuar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-gray-400">
          <Link href="/" className="hover:text-fuchsia-600">← Volver al sitio público</Link>
        </div>
      </div>
    </div>
  );
}