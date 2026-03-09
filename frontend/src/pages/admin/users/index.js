import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { withAuth } from '../../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';

function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'action_admin',
    campaignIds: [],
    actionIds: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(res.data);
    } catch (error) {
      toast.error('Error al cargar campañas');
    }
  };

  const fetchActions = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActions(res.data);
    } catch (error) {
      toast.error('Error al cargar acciones');
    }
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchCampaigns(), fetchActions()]).then(() => setLoading(false));
  }, []);

  const canCreate = currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'campaign_admin');
  const availableRoles = currentUser?.role === 'superadmin'
    ? ['superadmin', 'campaign_admin', 'action_admin']
    : ['action_admin'];
  const showCampaignSelect = currentUser?.role === 'superadmin';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (selectedOptions, field) => {
    const values = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setForm({ ...form, [field]: values });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.role) {
      toast.warning('Completa los campos obligatorios');
      return;
    }
    if (!editingId && !form.password) {
      toast.warning('La contraseña es obligatoria para nuevos usuarios');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/users/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(prevUsers => prevUsers.map(u => u.id === editingId ? response.data : u));
        toast.success('Usuario actualizado');
      } else {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(prevUsers => [...prevUsers, response.data]);
        toast.success('Usuario creado');
      }
      setForm({ username: '', password: '', role: 'action_admin', campaignIds: [], actionIds: [] });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al guardar usuario';
      toast.error(msg);
      console.error('Error en la petición:', error.response?.data);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setForm({
      username: user.username,
      password: '',
      role: user.role,
      campaignIds: user.campaigns ? user.campaigns.map(c => c.id) : [],
      actionIds: user.actions ? user.actions.map(a => a.id) : []
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Usuario eliminado');
      fetchUsers();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const roleLabels = {
    superadmin: 'Superadministrador',
    campaign_admin: 'Administrador de campaña',
    action_admin: 'Administrador de evento'
  };

  const campaignOptions = campaigns.map(c => ({ value: c.id, label: c.name }));
  const actionOptions = actions.map(a => ({ value: a.id, label: a.title }));

  return (
    <AdminLayout title="Administrar Usuarios">
      <ToastContainer />
      {canCreate && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : 'Crear nuevo usuario'}
        </button>
      )}

      {showForm && canCreate && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Editar usuario' : 'Crear nuevo usuario'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Rol *</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                disabled={currentUser?.role !== 'superadmin'}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contraseña {editingId && '(dejar vacío para no cambiar)'} *
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required={!editingId}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {showCampaignSelect && form.role === 'campaign_admin' && (
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

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear usuario')}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ username: '', password: '', role: 'action_admin', campaignIds: [], actionIds: [] });
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : users.length === 0 ? (
        <p>No hay usuarios creados.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignado a</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => {
                const canEdit = currentUser?.role === 'superadmin' ||
                  (currentUser?.role === 'campaign_admin' && user.role === 'action_admin');
                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{roleLabels[user.role]}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role === 'campaign_admin' && user.campaigns && user.campaigns.map(c => c.name).join(', ')}
                      {user.role === 'action_admin' && user.actions && user.actions.map(a => a.title).join(', ')}
                      {user.role === 'superadmin' && '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      {canEdit && (
                        <>
                          <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900">
                            Editar
                          </button>
                          {user.id !== 1 && (
                            <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">
                              Eliminar
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export default withAuth(AdminUsers);