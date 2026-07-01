import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import api from '../../../lib/axios';
import { toast, ToastContainer } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';

export default function AdminProfile() {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    api.get('/users/me')
      .then(res => setUserData(res.data))
      .catch(err => {
        if (err.response?.status === 401) {
          toast.error('Sesión expirada');
          logout();
          router.push('/admin/login');
        } else {
          toast.error('Error al cargar el perfil');
        }
      })
      .finally(() => setLoading(false));
  }, [authUser, logout, router]);

  if (loading) return <AdminLayout title="Mi Perfil"><p className="text-center py-8 text-gray-500">Cargando…</p></AdminLayout>;
  if (!userData) return <AdminLayout title="Mi Perfil"><p className="text-center py-8 text-red-600">No se pudo cargar el perfil.</p></AdminLayout>;

  const roleName = {
    superadmin: 'Superadministrador',
    campaign_admin: 'Administrador de campaña',
    action_admin: 'Administrador de evento',
  };

  return (
    <AdminLayout title="Mi Perfil">
      <ToastContainer />
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl font-bold">
            {userData.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{userData.username}</h2>
            <p className="text-sm text-gray-500">
              {roleName[userData.role] || userData.role}
            </p>
          </div>
        </div>

        {userData.email && (
          <p className="text-sm text-gray-600 mb-2">📧 {userData.email}</p>
        )}
        {userData.lastLogin && (
          <p className="text-sm text-gray-500">
            Último acceso: {new Date(userData.lastLogin).toLocaleString()}
          </p>
        )}
      </div>
    </AdminLayout>
  );
}