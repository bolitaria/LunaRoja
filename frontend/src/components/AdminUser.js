import api from '../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import { FaEye, FaEyeSlash, FaEdit, FaTrash, FaFileExport, FaSearch, FaPlus } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { exportInfo } from '../utils/exportInfo';
import Pagination from './Pagination';
import ConfirmModal from './ConfirmModal';

function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', role: 'action_admin', campaignIds: [], actionIds: [] });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      setCampaigns(res.data);
    } catch (error) {
      // Fallo silencioso: si el usuario no tiene permisos (ej. action_admin),
      // simplemente dejamos el array vacío sin mostrar error
      console.warn('No se pudieron cargar campañas (posible restricción de rol)', error);
      setCampaigns([]);
    }
  };

  const fetchActions = async () => {
    try {
      const res = await api.get('/actions');
      setActions(res.data);
    } catch (error) {
      // Mismo tratamiento: evitamos toast si el usuario no tiene acceso
      console.warn('No se pudieron cargar acciones (posible restricción de rol)', error);
      setActions([]);
    }
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchCampaigns(), fetchActions()]).then(() => setLoading(false));
  }, []);

  const canCreate = currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'campaign_admin');
  const availableRoles = currentUser?.role === 'superadmin' ? ['superadmin', 'campaign_admin', 'action_admin'] : ['action_admin'];
  const showCampaignSelect = currentUser?.role === 'superadmin';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSelectChange = (selectedOptions, field) => {
    const values = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setForm({ ...form, [field]: values });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.role) { toast.warning('Completa los campos obligatorios'); return; }
    if (!editingId && !form.password) { toast.warning('La contraseña es obligatoria'); return; }
    setSubmitting(true);
    try {
      if (editingId) {
        const response = await api.put(`/users/${editingId}`, form);
        setUsers(prev => prev.map(u => u.id === editingId ? response.data : u));
        toast.success('Usuario actualizado');
      } else {
        const response = await api.post('/users', form);
        setUsers(prev => [...prev, response.data]);
        toast.success('Usuario creado');
      }
      setForm({ username: '', password: '', role: 'action_admin', campaignIds: [], actionIds: [] });
      setEditingId(null); setShowForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar usuario');
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
    setEditingId(user.id); setShowForm(true);
  };

  const handleDelete = (id) => { setDeleteTarget(id); setShowDeleteModal(true); };
  const handleDeleteSelected = () => { if (selected.length === 0) return; setDeleteTarget(selected); setShowDeleteModal(true); };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/users/${id}`)));
      toast.success(`${ids.length} usuario(s) eliminado(s)`);
      setSelected([]); fetchUsers();
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const canEditUser = (user) => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'campaign_admin' && user.role === 'action_admin') return true;
    return false;
  };

  const canDeleteUser = (user) => {
    if (!currentUser) return false;
    if (user.id === 1) return false;
    if (currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'campaign_admin' && user.role === 'action_admin') return true;
    return false;
  };

  const roleLabels = {
    superadmin: 'Superadministrador',
    campaign_admin: 'Adm. de campaña',
    action_admin: 'Adm. de evento'
  };
  const campaignOptions = campaigns.map(c => ({ value: c.id, label: c.name }));
  const actionOptions = actions.map(a => ({ value: a.id, label: a.title }));

  const filtered = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const total = users.length;
  const superadmins = users.filter(u => u.role === 'superadmin').length;
  const campaignAdmins = users.filter(u => u.role === 'campaign_admin').length;
  const actionAdmins = total - superadmins - campaignAdmins;

  const exportCSV = () => {
    const headers = ['username', 'role', 'assignments'];
    const data = filtered.map(u => ({
      username: u.username,
      role: roleLabels[u.role] || u.role,
      assignments: u.campaigns?.map(c => c.name).join(', ') || u.actions?.map(a => a.title).join(', ') || ''
    }));
    downloadCSV(data, headers, 'usuarios.csv');
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(paginated.map(u => u.id));
    else setSelected([]);
  };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout title="Usuarios">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar usuario"
        message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} usuarios seleccionados?` : '¿Eliminar este usuario?')}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: total, color: 'bg-purple-100 text-purple-800' },
          { label: 'Superadmins', value: superadmins, color: 'bg-indigo-100 text-indigo-800' },
          { label: 'Adm. Campaña', value: campaignAdmins, color: 'bg-orange-100 text-orange-800' },
          { label: 'Adm. Evento', value: actionAdmins, color: 'bg-yellow-100 text-yellow-800' },
        ].map((m, i) => (
          <div key={i} className={`rounded-xl p-4 ${m.color} flex flex-col`}>
            <span className="text-sm font-medium">{m.label}</span>
            <span className="text-2xl font-bold">{m.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {canCreate && (
            <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-1.5 text-sm border border-fuchsia-300 text-fuchsia-700 bg-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors">
              <FaPlus className="w-3.5 h-3.5" /> Crear usuario
            </button>
          )}
          {selected.length > 0 && (
            <button onClick={handleDeleteSelected} className="inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
              <FaTrash /> Eliminar ({selected.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-48" />
          </div>
          <button onClick={exportCSV} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            <FaFileExport className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>

      {showForm && canCreate && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Editar usuario' : 'Nuevo usuario'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Rol *</label>
              <select name="role" value={form.role} onChange={handleChange} disabled={currentUser?.role !== 'superadmin'} className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-fuchsia-500">
                {availableRoles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre de usuario *</label>
              <input type="text" name="username" value={form.username} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-fuchsia-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña {editingId && '(dejar vacío para no cambiar)'}</label>
              <div className="relative mt-1">
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required={!editingId} className="block w-full border border-gray-300 rounded-lg p-2 pr-10 focus:ring-2 focus:ring-fuchsia-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600">{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
              </div>
            </div>
            {showCampaignSelect && form.role === 'campaign_admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Campañas asignadas</label>
                <Select isMulti options={campaignOptions} value={campaignOptions.filter(opt => form.campaignIds.includes(opt.value))} onChange={(selected) => handleSelectChange(selected, 'campaignIds')} className="mt-1" />
              </div>
            )}
            {form.role === 'action_admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Acciones asignadas</label>
                <Select isMulti options={actionOptions} value={actionOptions.filter(opt => form.actionIds.includes(opt.value))} onChange={(selected) => handleSelectChange(selected, 'actionIds')} className="mt-1" />
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-1 text-sm bg-fuchsia-600 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50">{submitting ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear usuario')}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ username: '', password: '', role: 'action_admin', campaignIds: [], actionIds: [] }); }} className="inline-flex items-center gap-1 text-sm bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">Cancelar</button>}
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-gray-500 text-sm">Cargando...</p> : filtered.length === 0 ? <p className="text-gray-500 text-sm">No se encontraron usuarios.</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-purple-100 text-sm">
            <thead className="bg-fuchsia-50 text-fuchsia-800 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-left w-10"><input type="checkbox" onChange={toggleSelectAll} checked={paginated.length > 0 && selected.length === paginated.length} /></th>
                <th className="px-6 py-3 text-left">Usuario</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Rol</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Asignado a</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {paginated.map(user => {
                const canEdit = canEditUser(user);
                const canDelete = canDeleteUser(user);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><input type="checkbox" checked={selected.includes(user.id)} onChange={() => toggleOne(user.id)} /></td>
                    <td className="px-6 py-4 font-medium text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{roleLabels[user.role]}</td>
                    <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                      {user.role === 'campaign_admin' && user.campaigns?.map(c => c.name).join(', ')}
                      {user.role === 'action_admin' && user.actions?.map(a => a.title).join(', ')}
                      {user.role === 'superadmin' && '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {canEdit && <button onClick={() => handleEdit(user)} className="text-gray-400 hover:text-fuchsia-600 transition-colors"><FaEdit /></button>}
                        {canDelete && <button onClick={() => handleDelete(user.id)} className="text-gray-400 hover:text-red-600 transition-colors"><FaTrash /></button>}
                      </div>
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

export default AdminUsers;