import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../../lib/axios'; // ← Instancia de axios con interceptores
import PasswordField from '../../../components/PasswordField';

export default function AdminLogin() {
  const router = useRouter();
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
      // 1. Hacer la petición de login con la instancia api
      const res = await api.post('/auth/login', { username, password });

      // 2. Extraer el token (según la respuesta del backend)
      const token = res.data.token || res.data.accessToken;
      if (!token) {
        throw new Error('No se recibió token de autenticación');
      }

      // 3. Guardar el token en localStorage para que el interceptor lo use
      localStorage.setItem('token', token);

      // 4. Mostrar éxito y redirigir al dashboard
      toast.success('Inicio de sesión exitoso');
      router.push('/admin/dashboard');
    } catch (error) {
      // 5. Manejar errores (credenciales incorrectas, red, etc.)
      const msg = error.response?.data?.message || 'Credenciales inválidas';
      toast.error(msg);
      // Si el backend devuelve 401, el interceptor de respuesta intentará redirigir,
      // pero aquí lo manejamos localmente para evitar bucles.
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
            <h1 className="text-2xl font-semibold text-gray-700">Panel de Administración</h1>
            <p className="text-gray-500 text-sm mt-1">Voces Palestinas por la Justicia</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                placeholder="Nombre de usuario"
                autoFocus
                required
              />
            </div>

            <PasswordField
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={true}
              label="Contraseña"
              placeholder="Contraseña"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400 space-y-1">
            <Link href="/" className="hover:text-emerald-600 transition-colors block">
              ← Volver al sitio público
            </Link>
            <Link href="/admin/login/recuperar" className="hover:text-emerald-600 transition-colors block">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}