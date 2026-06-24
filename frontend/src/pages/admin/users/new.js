import api from '../../../lib/axios';
import { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../../context/AuthContext';

export default function NewUser() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'action_admin',
    campaignIds: [],
    actionIds: [],
  });
  const [submitting, setSubmitting] = useState(false);

  // Solo superadmin y campaign_admin pueden crear usuarios
  if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'campaign_admin')) {
    return (
      <AdminLayout title="Nuevo Usuario">
        <p className="text-red-600">No tienes permisos para crear usuarios.</p>
      </AdminLayout>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.role) {
      toast.warning('Completa todos los campos obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/users', form);
      toast.success('Usuario creado');
      router.push('/admin/users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const availableRoles = currentUser.role === 'superadmin'
    ? ['superadmin', 'campaign_admin', 'action_admin']
    : ['action_admin'];

  const roleLabels = {
    superadmin: 'Superadministrador',
    campaign_admin: 'Adm. de campaña',
    action_admin: 'Adm. de evento'
  };

  return (
    <AdminLayout title="Nuevo Usuario">
      <ToastContainer />
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Crear Usuario</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Rol *</label>
          <select name="role" value={form.role} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2">
            {availableRoles.map(role => (
              <option key={role} value={role}>{roleLabels[role]}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Nombre de usuario *</label>
          <input type="text" name="username" value={form.username} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Contraseña *</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
        </div>
        <button type="submit" disabled={submitting} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50">
          {submitting ? 'Creando...' : 'Crear Usuario'}
        </button>
      </form>
    </AdminLayout>
  );
}