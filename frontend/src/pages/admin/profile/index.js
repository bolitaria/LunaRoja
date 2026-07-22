import { useState, useEffect } from 'react';
import { useRouter }from 'next/router';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from '../../../components/AdminLayout';
import api from '../../../lib/axios';
import { useAuth } from '../../../context/AuthContext';
import PasswordField from '../../../components/PasswordField';

export default function AdminProfile() {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para el cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Cargar datos del perfil
  useEffect(() => {
    if (!authUser) return;
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me');
        setUserData(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          toast.error('Sesión expirada. Inicia sesión de nuevo.');
          logout();
          router.push('/admin/login');
        } else {
          toast.error('Error al cargar el perfil');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [authUser, logout, router]);

  // Manejador del cambio de contraseña
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validaciones
    if (newPassword.length < 6) {
      toast.warning('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('Las contraseñas nuevas no coinciden');
      return;
    }
    if (newPassword === currentPassword) {
      toast.warning('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/users/me/password', {
        currentPassword,
        newPassword,
      });
      toast.success('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cambiar la contraseña';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Mi Perfil">
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Cargando perfil...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!userData) {
    return (
      <AdminLayout title="Mi Perfil">
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-red-600">No se pudo cargar el perfil.</p>
        </div>
      </AdminLayout>
    );
  }

  const roleNames = {
    superadmin: 'Superadministrador',
    campaign_admin: 'Administrador de campaña',
    action_admin: 'Administrador de acciones',
    blog_admin: 'Administrador de blog',
  };

  return (
    <AdminLayout title="Mi Perfil">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="min-h-screen py-8 px-4 bg-amber-50/80">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Tarjeta de información del perfil */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-2xl font-bold flex-shrink-0">
                {userData.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{userData.username}</h2>
                <p className="text-sm text-gray-500">
                  {roleNames[userData.role] || userData.role}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {userData.email && (
                <p className="text-gray-600">
                  <span className="font-medium">📧 Email:</span> {userData.email}
                </p>
              )}
              {userData.lastLogin && (
                <p className="text-gray-500">
                  <span className="font-medium">Último acceso:</span>{' '}
                  {new Date(userData.lastLogin).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
              <p className="text-gray-400 text-xs">
                ID de usuario: {userData.id}
              </p>
            </div>
          </div>

          {/* Tarjeta de cambio de contraseña */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Cambiar contraseña</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña actual *
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  placeholder="Introduce tu contraseña actual"
                />
              </div>

              <PasswordField
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required={true}
                label="Nueva contraseña *"
                placeholder="Mínimo 6 caracteres"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar nueva contraseña *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  placeholder="Vuelve a escribir la nueva contraseña"
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </form>
          </div>

          {/* Enlace para volver al dashboard */}
          <div className="text-center">
            <Link
              href="/admin/dashboard"
              className="text-sm text-gray-500 hover:text-amber-600 transition-colors"
            >
              ← Volver al panel
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}