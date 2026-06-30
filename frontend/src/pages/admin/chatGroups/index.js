import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { exportInfo } from '../../../utils/exportInfo';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import { FaEdit, FaTrash, FaFileExport, FaSearch } from 'react-icons/fa';

function AdminChatGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');
  const itemsPerPage = 10;

  const fetchGroups = async () => {
    try {
      const res = await api.get('/chat-groups');
      setGroups(res.data);
    } catch (err) {
      toast.error('Error al cargar grupos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleDelete = (id) => { setDeleteTarget(id); setShowDeleteModal(true); };
  const handleDeleteSelected = () => { if (selected.length === 0) return; setDeleteTarget(selected); setShowDeleteModal(true); };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/chat-groups/${id}`)));
      toast.success(`${ids.length} grupo(s) eliminado(s)`);
      setSelected([]);
      fetchGroups();
    } catch (err) {
      toast.error('Error al eliminar');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const exportAll = () => {
    const headers = ['name', 'platform', 'link', 'region', 'campaign', 'action'];
    const data = groups.map(g => ({
      name: g.name,
      platform: g.platform,
      link: g.link,
      region: g.region || '',
      campaign: g.campaign?.name || '',
      action: g.action?.title || ''
    }));
    exportInfo(data, headers, 'grupos_chat', exportFormat);
  };

  const total = groups.length;
  const activeCount = groups.filter(g => g.isActive).length;
  const inactiveCount = total - activeCount;

  const filtered = groups.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    if (filterStatus === 'active' && !g.isActive) return false;
    if (filterStatus === 'inactive' && g.isActive) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = (e) => { if (e.target.checked) setSelected(paginated.map(g => g.id)); else setSelected([]); };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout title="Grupos de Chat">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar grupo"
        message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} grupos?` : '¿Eliminar este grupo?')}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      <div className="bg-gray-50/80 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-6 text-sm border border-gray-100">
        <button
          onClick={() => { setFilterStatus(''); setCurrentPage(1); }}
          className="flex items-center gap-1.5 hover:text-fuchsia-700 transition-colors group"
        >
          <span className="text-xs text-gray-500 group-hover:text-fuchsia-600">Total</span>
          <span className="font-bold text-gray-800 group-hover:text-fuchsia-700">{total}</span>
        </button>
        <button
          onClick={() => { setFilterStatus('active'); setCurrentPage(1); }}
          className="flex items-center gap-1.5 hover:text-fuchsia-700 transition-colors group"
        >
          <span className="text-xs text-gray-500 group-hover:text-fuchsia-600">Activos</span>
          <span className="font-bold text-gray-800 group-hover:text-fuchsia-700">{activeCount}</span>
        </button>
        <button
          onClick={() => { setFilterStatus('inactive'); setCurrentPage(1); }}
          className="flex items-center gap-1.5 hover:text-fuchsia-700 transition-colors group"
        >
          <span className="text-xs text-gray-500 group-hover:text-fuchsia-600">Inactivos</span>
          <span className="font-bold text-gray-800 group-hover:text-fuchsia-700">{inactiveCount}</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/chatGroups/new" className="inline-flex items-center gap-1.5 text-sm font-medium border-2 border-fuchsia-300 text-fuchsia-700 bg-white px-4 py-2 rounded-lg hover:bg-fuchsia-50 transition-colors shadow-sm">
            Nuevo Grupo
          </Link>
          {selected.length > 0 && (
            <button onClick={handleDeleteSelected} className="inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
              <FaTrash /> Eliminar ({selected.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar grupo…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-48"
            />
          </div>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-600"
          >
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
            <option value="txt">Texto</option>
          </select>
          <button onClick={exportAll} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors" title="Exportar">
            <FaFileExport className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron grupos</p>
          <p className="text-sm">Crea un nuevo grupo.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-purple-100 text-sm">
            <thead className="bg-fuchsia-50 text-fuchsia-800 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-left w-10">
                  <input type="checkbox" onChange={toggleSelectAll} checked={paginated.length > 0 && selected.length === paginated.length} />
                </th>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Plataforma</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Región</th>
                <th className="px-6 py-3 text-left hidden lg:table-cell">Campaña / Acción</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {paginated.map(group => (
                <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selected.includes(group.id)} onChange={() => toggleOne(group.id)} />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{group.name}</td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{group.platform}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{group.region || '-'}</td>
                  <td className="px-6 py-4 hidden lg:table-cell text-gray-500">{group.campaign?.name || group.action?.title || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/chatGroups/${group.id}/edit`} className="p-1.5 text-gray-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors" title="Editar">
                        <FaEdit className="w-5 h-5" />
                      </Link>
                      <button onClick={() => handleDelete(group.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                        <FaTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminChatGroups;