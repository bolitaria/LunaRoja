import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { withAuth } from '../../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select'; // Asegúrate de tener instalado react-select

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'campaign_admin',
    campaignIds: [],
    actionIds: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (selectedOptions, field) => {
    // selectedOptions es un array de objetos { value, label } o null
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
      if (editingId) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/users/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Usuario actualizado');
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Usuario creado');
      }
      setForm({ username: '', password: '', role: 'campaign_admin', campaignIds: [], actionIds: [] });
      setEditingId(null);
      fetchUsers();
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
      password: '', // no se muestra la contraseña
      role: user.role,
      campaignIds: user.campaigns ? user.campaigns.map(c => c.id) : [],
      actionIds: user.actions ? user.actions.map(a => a.id) : []
    });
    setEditingId(user.id);
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
      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">{editingId ? 'Editar usuario' : 'Crear nuevo usuario'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Rol *</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="campaign_admin">Administrador de campaña</option>
              <option value="action_admin">Administrador de evento</option>
              <option value="superadmin">Superadministrador</option>
            </select>
          </div>

          {/* Campo Usuario */}
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

          {/* Campo Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña {editingId && '(dejar vacío para no cambiar)'} *
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required={!editingId}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          {/* Selector de campañas (si el rol es campaign_admin) */}
          {form.role === 'campaign_admin' && (
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

          {/* Selector de acciones (si el rol es action_admin) */}
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
                  setForm({ username: '', password: '', role: 'campaign_admin', campaignIds: [], actionIds: [] });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {loading ? (
        <p>Cargando usuarios...</p>
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
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{roleLabels[user.role]}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === 'campaign_admin' && user.campaigns && user.campaigns.map(c => c.name).join(', ')}
                    {user.role === 'action_admin' && user.actions && user.actions.map(a => a.title).join(', ')}
                    {user.role === 'superadmin' && '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900">
                      Editar
                    </button>
                    {user.id !== 1 && (
                      <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export default withAuth(AdminUsers);