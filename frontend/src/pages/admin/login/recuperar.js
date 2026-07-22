import { useState } from 'react';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../../lib/axios';

export default function RecuperarPassword() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.warning('Introduce tu nombre de usuario');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { username: username.trim() });
      setEnviado(true);
      toast.success('Si el usuario existe, recibirás un enlace en tu correo.');
    } catch (error) {
      setEnviado(true);
      toast.success('Si el usuario existe, recibirás un enlace en tu correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50/80">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="max-w-sm w-full mx-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-700">Recuperar contraseña</h1>
            <p className="text-gray-500 text-sm mt-1">Introduce tu nombre de usuario</p>
          </div>

          {enviado ? (
            <div className="text-center space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-emerald-800 text-sm">
                  Si el usuario existe, hemos enviado un enlace de recuperación a su correo electrónico.
                </p>
              </div>
              <Link href="/admin/login" className="text-emerald-600 hover:underline text-sm">
                ← Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field focus:ring-0 focus:border-gray-300"
                  placeholder="Tu nombre de usuario"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>

              <div className="text-center text-xs text-gray-400">
                <Link href="/admin/login" className="hover:text-emerald-600 transition-colors">
                  ← Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}