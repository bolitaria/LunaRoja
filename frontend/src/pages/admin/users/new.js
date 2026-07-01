import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../../context/AuthContext';
import Select from 'react-select';

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
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);

  // Cargar campañas y acciones para los select
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [campRes, actRes] = await Promise.all([
          api.get('/campaigns'),
          api.get('/actions'),
        ]);
        setCampaigns(campRes.data);
        setActions(actRes.data);
      } catch (error) {
        console.warn('No se pudieron cargar campañas/acciones');
      }
    };
    fetchOptions();
  }, []);

  // Solo superadmin y campaign_admin pueden crear usuarios
  if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'campaign_admin')) {
    return (
      <AdminLayout title="Nuevo Usuario">
        <div className="text-center py-12 text-red-600">
          <p className="text-lg">No tienes permisos para crear usuarios.</p>
        </div>
      </AdminLayout>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSelectChange = (selectedOptions, field) => {
    const values = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setForm({ ...form, [field]: values });
  };

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
    ? ['superadmin', 'campaign_admin', 'action_admin', 'bds_admin']
    : ['action_admin'];

  const roleLabels = {
    superadmin: 'Superadministrador',
    campaign_admin: 'Adm. de campaña',
    action_admin: 'Adm. de evento',
    bds_admin: 'Adm. BDS',
  };

  const campaignOptions = campaigns.map(c => ({ value: c.id, label: c.name }));
  const actionOptions = actions.map(a => ({ value: a.id, label: a.title }));

  return (
    <AdminLayout title="Nuevo Usuario">
      <ToastContainer />
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Crear Usuario</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rol *</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>{roleLabels[role]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre de usuario *</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
            />
          </div>

          {/* Asignación de campañas (solo visible si el rol es campaign_admin y el usuario es superadmin) */}
          {currentUser.role === 'superadmin' && form.role === 'campaign_admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Campañas asignadas</label>
              <Select
                isMulti
                options={campaignOptions}
                value={campaignOptions.filter(opt => form.campaignIds.includes(opt.value))}
                onChange={(selected) => handleSelectChange(selected, 'campaignIds')}
                className="mt-1"
              />
            </div>
          )}

          {/* Asignación de acciones (visible para action_admin) */}
          {form.role === 'action_admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Acciones asignadas</label>
              <Select
                isMulti
                options={actionOptions}
                value={actionOptions.filter(opt => form.actionIds.includes(opt.value))}
                onChange={(selected) => handleSelectChange(selected, 'actionIds')}
                className="mt-1"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
          >
            {submitting ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}