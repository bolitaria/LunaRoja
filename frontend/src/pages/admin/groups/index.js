import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { withAuth } from '../../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';

function AdminGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    description: '',
    platform: 'telegram',
    link: '',
    region: '',
    campaignId: '',
    actionId: '',
    isActive: true
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/working-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(res.data);
    } catch (error) {
      toast.error('Error al cargar grupos');
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
    Promise.all([fetchGroups(), fetchCampaigns(), fetchActions()]).then(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/working-groups/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Grupo actualizado');
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/working-groups`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Grupo creado');
      }
      setForm({ name: '', description: '', platform: 'telegram', link: '', region: '', campaignId: '', actionId: '', isActive: true });
      setEditingId(null);
      setShowForm(false);
      fetchGroups();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleEdit = (group) => {
    setForm({
      name: group.name,
      description: group.description || '',
      platform: group.platform,
      link: group.link,
      region: group.region || '',
      campaignId: group.campaignId || '',
      actionId: group.actionId || '',
      isActive: group.isActive
    });
    setEditingId(group.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar grupo?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/working-groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Grupo eliminado');
      fetchGroups();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
  const actionMap = actions.reduce((acc, a) => ({ ...acc, [a.id]: a }), {});

  // Determinar si el usuario puede crear grupos (superadmin, campaign_admin, action_admin)
  const canCreate = user && (user.role === 'superadmin' || user.role === 'campaign_admin' || user.role === 'action_admin');

  return (
    <AdminLayout title="Administrar Grupos de Trabajo">
      <ToastContainer />
      {canCreate && (
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', description: '', platform: 'telegram', link: '', region: '', campaignId: '', actionId: '', isActive: true }); }}
          className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : 'Nuevo grupo'}
        </button>
      )}

      {showForm && canCreate && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Nombre del grupo *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Plataforma *</label>
            <select
              name="platform"
              value={form.platform}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="telegram">Telegram</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Enlace *</label>
            <input
              type="url"
              name="link"
              value={form.link}
              onChange={handleChange}
              required
              placeholder="https://t.me/... o https://chat.whatsapp.com/..."
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Área geográfica (opcional)</label>
            <input
              type="text"
              name="region"
              value={form.region}
              onChange={handleChange}
              placeholder="Ej: Nacional, Europa, América Latina"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          {user.role === 'superadmin' && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Campaña asociada (opcional)</label>
                <select
                  name="campaignId"
                  value={form.campaignId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">-- Ninguna --</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Acción asociada (opcional)</label>
                <select
                  name="actionId"
                  value={form.actionId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">-- Ninguna --</option>
                  {actions.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="mr-2"
              />
              <span>Grupo activo (visible en la página pública)</span>
            </label>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : groups.length === 0 ? (
        <p>No hay grupos activos.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">Plataforma</th>
                <th className="px-6 py-3 text-left">Región</th>
                <th className="px-6 py-3 text-left">Campaña</th>
                <th className="px-6 py-3 text-left">Acción</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => {
                const campaign = campaignMap[group.campaignId];
                const action = actionMap[group.actionId];
                // Permitir editar/eliminar según rol
                const canEdit = 
                  user.role === 'superadmin' ||
                  (user.role === 'campaign_admin' && group.campaignId === user.campaignId) ||
                  (user.role === 'action_admin' && group.actionId === user.actionId);
                return (
                  <tr key={group.id} className="border-t">
                    <td className="px-6 py-4">{group.name}</td>
                    <td className="px-6 py-4">
                      {group.platform === 'telegram' ? 'Telegram' : 'WhatsApp'}
                    </td>
                    <td className="px-6 py-4">{group.region || '-'}</td>
                    <td className="px-6 py-4">
                      {campaign ? (
                        <span style={{ color: campaign.color }}>{campaign.name}</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {action ? action.title : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${group.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                        {group.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      {canEdit && (
                        <>
                          <button onClick={() => handleEdit(group)} className="text-blue-600 hover:underline">Editar</button>
                          <button onClick={() => handleDelete(group.id)} className="text-red-600 hover:underline">Eliminar</button>
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

export default withAuth(AdminGroups);