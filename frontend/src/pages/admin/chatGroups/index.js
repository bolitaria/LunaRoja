import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../../context/AuthContext';
import { downloadCSV } from '../../../utils/exportCsv';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import { FaEdit, FaTrash, FaFileExport, FaSearch, FaPlus } from 'react-icons/fa';

function AdminChatGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', platform: 'telegram', link: '', campaignId: '', actionId: '', isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampaignId, setFilterCampaignId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = 10;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchGroups = async () => {
    try {
      const res = await api.get('/chat-groups');
      setGroups(res.data);
    } catch (error) {
      toast.error('Error al cargar grupos de chat');
    }
  };
  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data);
    } catch (error) {
      toast.error('Error al cargar campañas');
    }
  };
  const fetchActions = async () => {
    try {
      const res = await api.get('/actions');
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
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/chat-groups/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Grupo actualizado');
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/chat-groups`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Grupo creado');
      }
      setForm({ name: '', description: '', platform: 'telegram', link: '', campaignId: '', actionId: '', isActive: true });
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
      campaignId: group.campaignId || '',
      actionId: group.actionId || '',
      isActive: group.isActive
    });
    setEditingId(group.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };
  const handleDeleteSelected = () => {
    if (selected.length === 0) return;
    setDeleteTarget(selected);
    setShowDeleteModal(true);
  };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id =>
        api.delete('/chat-groups/${id}')
      ));
      toast.success(`${ids.length} grupo(s) eliminado(s)`);
      setSelected([]);
      fetchGroups();
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
  const actionMap = actions.reduce((acc, a) => ({ ...acc, [a.id]: a }), {});
  const canCreate = user && (user.role === 'superadmin' || user.role === 'campaign_admin');
  const platformNames = { telegram: 'Telegram', whatsapp: 'WhatsApp', signal: 'Signal' };

  const filtered = groups.filter(g => {
    if (searchTerm && !g.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCampaignId && g.campaignId !== filterCampaignId) return false;
    if (filterStatus === 'active' && !g.isActive) return false;
    if (filterStatus === 'inactive' && g.isActive) return false;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const total = groups.length;
  const activeCount = groups.filter(g => g.isActive).length;
  const inactiveCount = total - activeCount;

  const metricCards = [
    { label: 'Total', value: total, filter: '' },
    { label: 'Activos', value: activeCount, filter: 'active' },
    { label: 'Inactivos', value: inactiveCount, filter: 'inactive' },
  ];

  const exportCSV = () => {
    const headers = ['name', 'platform', 'link', 'campaign', 'action', 'isActive'];
    const data = filtered.map(g => ({
      name: g.name,
      platform: platformNames[g.platform] || g.platform,
      link: g.link,
      campaign: g.campaignId ? campaignMap[g.campaignId]?.name || '' : '',
      action: g.actionId ? actionMap[g.actionId]?.title || '' : '',
      isActive: g.isActive ? 'Activo' : 'Inactivo'
    }));
    downloadCSV(data, headers, 'grupos_chat.csv');
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(paginated.map(g => g.id));
    else setSelected([]);
  };
  const toggleOne = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout title="Grupos de Chat">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar grupo"
        message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} grupos seleccionados?` : '¿Eliminar este grupo?')}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      {/* Métricas clickeables */}
      <div className="bg-gray-50/80 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-6 text-sm border border-gray-100">
        {metricCards.map((m, i) => (
          <button
            key={i}
            onClick={() => { setFilterStatus(m.filter); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 transition-colors group ${filterStatus === m.filter ? 'text-fuchsia-700' : 'hover:text-fuchsia-700'}`}
          >
            <span className={`text-xs ${filterStatus === m.filter ? 'text-fuchsia-600' : 'text-gray-500 group-hover:text-fuchsia-600'}`}>
              {m.label}
            </span>
            <span className={`font-bold ${filterStatus === m.filter ? 'text-fuchsia-800' : 'text-gray-800 group-hover:text-fuchsia-700'}`}>
              {m.value}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                setForm({ name: '', description: '', platform: 'telegram', link: '', campaignId: '', actionId: '', isActive: true });
              }}
              className="inline-flex items-center gap-1.5 text-sm border border-fuchsia-300 text-fuchsia-700 bg-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors"
            >
              <FaPlus className="w-3.5 h-3.5" /> Nuevo grupo
            </button>
          )}
          {selected.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
            >
              <FaTrash /> Eliminar ({selected.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-48"
            />
          </div>
          <select
            value={filterCampaignId}
            onChange={(e) => { setFilterCampaignId(e.target.value); setCurrentPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-gray-50 text-gray-600"
          >
            <option value="">Campaña</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaFileExport className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>

      {showForm && canCreate && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del grupo *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma *</label>
              <select
                name="platform"
                value={form.platform}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
              >
                <option value="telegram">Telegram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="signal">Signal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enlace *</label>
              <input
                type="url"
                name="link"
                value={form.link}
                onChange={handleChange}
                required
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaña asociada (opcional)</label>
              <select
                name="campaignId"
                value={form.campaignId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
              >
                <option value="">-- Ninguna --</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acción asociada (opcional)</label>
              <select
                name="actionId"
                value={form.actionId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
              >
                <option value="">-- Ninguna --</option>
                {actions.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Grupo activo (visible en página pública)</label>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1 text-sm bg-fuchsia-600 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-700 transition-colors"
          >
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">No se encontraron grupos.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={paginated.length > 0 && selected.length === paginated.length}
                  />
                </th>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Plataforma</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Campaña</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Acción</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(group => {
                const campaign = campaignMap[group.campaignId];
                const action = actionMap[group.actionId];
                const canEdit = user && (user.role === 'superadmin' || (user.role === 'campaign_admin' && group.campaignId && user.campaigns?.some(c => c.id === group.campaignId)));
                return (
                  <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(group.id)}
                        onChange={() => toggleOne(group.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{group.name}</td>
                    <td className="px-6 py-4 hidden sm:table-cell text-gray-500">
                      {platformNames[group.platform] || group.platform}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {campaign ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: campaign.color }} />
                          <span className="text-gray-700">{campaign.name}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                      {action ? action.title : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {group.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {canEdit && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(group)}
                            className="text-gray-400 hover:text-fuchsia-600 transition-colors"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(group.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminChatGroups;