import api from '../../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../../../context/AuthContext';

export default function EditUser() {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'action_admin',
    campaignIds: [],
    actionIds: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        const user = res.data;
        setForm({
          username: user.username,
          password: '',
          role: user.role,
          campaignIds: user.campaigns ? user.campaigns.map(c => c.id) : [],
          actionIds: user.actions ? user.actions.map(a => a.id) : [],
        });
      } catch (error) {
        toast.error('Error al cargar usuario');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  // Verificar permisos: superadmin puede editar a cualquiera; campaign_admin solo a action_admin
  const canEdit = currentUser && (
    currentUser.role === 'superadmin' ||
    (currentUser.role === 'campaign_admin' && form.role === 'action_admin')
  );

  if (loading) return <AdminLayout title="Editar Usuario"><p className="text-center py-8">Cargando...</p></AdminLayout>;
  if (!canEdit) return <AdminLayout title="Editar Usuario"><p className="text-red-600">No tienes permisos para editar este usuario.</p></AdminLayout>;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.role) {
      toast.warning('Completa los campos obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password; // no enviar contraseña vacía
      await api.put(`/users/${id}`, payload);
      toast.success('Usuario actualizado');
      router.push('/admin/users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabels = {
    superadmin: 'Superadministrador',
    campaign_admin: 'Adm. de campaña',
    action_admin: 'Adm. de evento'
  };

  return (
    <AdminLayout title="Editar Usuario">
      <ToastContainer />
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Editar Usuario</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Rol *</label>
          <select name="role" value={form.role} onChange={handleChange} disabled={currentUser?.role !== 'superadmin'} className="mt-1 block w-full border border-gray-300 rounded-lg p-2">
            {['superadmin', 'campaign_admin', 'action_admin'].map(role => (
              <option key={role} value={role}>{roleLabels[role]}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Nombre de usuario *</label>
          <input type="text" name="username" value={form.username} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Nueva contraseña (dejar vacío para no cambiar)</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2" />
        </div>
        {/* Si deseas añadir selección de campañas/acciones, similar al index, puedes incluirlos aquí */}
        <button type="submit" disabled={submitting} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50">
          {submitting ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </AdminLayout>
  );
}