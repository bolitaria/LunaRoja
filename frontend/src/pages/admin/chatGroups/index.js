import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { exportInfo } from '../../../utils/exportInfo';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import { FaEdit, FaTrash, FaFileExport, FaSearch, FaEye, FaEyeSlash, FaTh, FaList } from 'react-icons/fa';
import { unwrapList } from '../../../utils/apiHelpers';
import AdminChatGroupCard from '../../../components/AdminChatGroupCard';

function AdminChatGroups() {
  const [groups, setGroups] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [bds, setBDS] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vista mosaico/lista (persistida)
  const [viewMode, setViewModeRaw] = useState(() => {
    if (typeof window === 'undefined') return 'table';
    return localStorage.getItem('admin.chatGroups.viewMode') || 'table';
  });
  const setViewMode = (mode) => {
    setViewModeRaw(mode);
    if (typeof window !== 'undefined') localStorage.setItem('admin.chatGroups.viewMode', mode);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');        // active / inactive
  const [filterVisibility, setFilterVisibility] = useState(''); // public / private
  const [filterAssociation, setFilterAssociation] = useState(''); // campaign / bds / action / general
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const [groupsRes, campaignsRes, bdsRes, actionsRes] = await Promise.all([
        api.get('/chat-groups'),
        api.get('/campaigns', { params: { limit: 1000 } }),
        api.get('/bds', { params: { limit: 1000 } }),
        api.get('/actions'),
      ]);
      setGroups(unwrapList(groupsRes.data));
      setCampaigns(unwrapList(campaignsRes.data));
      setBDS(unwrapList(bdsRes.data));
      setActions(unwrapList(actionsRes.data));
    } catch (err) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteSelected = () => {
    if (selected.length === 0) return;
    setDeleteTarget(selected);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/chat-groups/${id}`)));
      toast.success(`${ids.length} grupo(s) eliminado(s)`);
      setSelected([]);
      fetchData();
    } catch (err) {
      toast.error('Error al eliminar');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const exportAll = () => {
    const headers = ['name', 'platform', 'visibility', 'association', 'status', 'link', 'region'];
    const data = groups.map(g => ({
      name: g.name,
      platform: g.platform,
      visibility: g.isPublic ? 'Público' : 'Privado',
      association: getAssociationLabel(g),
      status: g.isActive ? 'Activo' : 'Inactivo',
      link: g.link,
      region: g.region || '',
    }));
    exportInfo(data, headers, 'grupos_chat', exportFormat);
  };

  // Etiquetas y mapeos
  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c.name }), {});
  const bdsMap = bds.reduce((acc, b) => ({ ...acc, [b.id]: b.name }), {});
  const actionMap = actions.reduce((acc, a) => ({ ...acc, [a.id]: a.title }), {});

  const getAssociationLabel = (group) => {
    if (group.campaignId) return `Campaña: ${campaignMap[group.campaignId] || 'Desconocida'}`;
    if (group.bdsId) return `BDS: ${bdsMap[group.bdsId] || 'Desconocida'}`;
    if (group.actionId) return `Acción: ${actionMap[group.actionId] || 'Desconocida'}`;
    return 'General';
  };

  // Filtrado
  const filtered = groups.filter(g => {
    if (searchTerm && !g.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterStatus === 'active' && !g.isActive) return false;
    if (filterStatus === 'inactive' && g.isActive) return false;
    if (filterVisibility === 'public' && !g.isPublic) return false;
    if (filterVisibility === 'private' && g.isPublic) return false;
    if (filterAssociation === 'campaign' && !g.campaignId) return false;
    if (filterAssociation === 'bds' && !g.bdsId) return false;
    if (filterAssociation === 'action' && !g.actionId) return false;
    if (filterAssociation === 'general' && (g.campaignId || g.bdsId || g.actionId)) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(paginated.map(g => g.id));
    else setSelected([]);
  };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Métricas
  const total = groups.length;
  const activeCount = groups.filter(g => g.isActive).length;
  const inactiveCount = total - activeCount;
  const publicCount = groups.filter(g => g.isPublic).length;
  const privateCount = total - publicCount;

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

      {/* BLOQUE 1: botón nuevo (fila propia, como Actions) */}
      <div className="mb-5">
        <Link href="/admin/chatGroups/new" className="inline-flex items-center gap-2 text-lg font-semibold border-2 border-fuchsia-300 text-fuchsia-700 bg-white px-7 py-3.5 rounded-xl hover:bg-fuchsia-50 transition-colors shadow-md">
          <span className="text-lg">💬</span> Nuevo Grupo
        </Link>
      </div>

      {/* BLOQUE 2: barra de filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-56">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar grupo..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-fuchsia-400 text-sm w-full"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          <select
            value={filterVisibility}
            onChange={(e) => { setFilterVisibility(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
          >
            <option value="">Todas las visibilidades</option>
            <option value="public">Públicos</option>
            <option value="private">Privados</option>
          </select>

          <select
            value={filterAssociation}
            onChange={(e) => { setFilterAssociation(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
          >
            <option value="">Todas las asociaciones</option>
            <option value="campaign">Campaña</option>
            <option value="bds">BDS</option>
            <option value="action">Acción</option>
            <option value="general">General (sin asociar)</option>
          </select>

          <div className="relative ml-auto flex items-center gap-2">
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="txt">Texto</option>
            </select>
            <button onClick={exportAll} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors" title="Exportar">
              <FaFileExport className="w-4 h-4" /> Exportar
            </button>
          </div>
        </div>

        {/* Chips de filtros activos */}
        {(searchTerm || filterStatus || filterVisibility || filterAssociation) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Búsqueda: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-red-600">✕</button>
              </span>
            )}
            {filterStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Estado: {filterStatus === 'active' ? 'Activos' : 'Inactivos'}
                <button onClick={() => setFilterStatus('')} className="text-gray-400 hover:text-red-600">✕</button>
              </span>
            )}
            {filterVisibility && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Visibilidad: {filterVisibility === 'public' ? 'Públicos' : 'Privados'}
                <button onClick={() => setFilterVisibility('')} className="text-gray-400 hover:text-red-600">✕</button>
              </span>
            )}
            {filterAssociation && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Asociación: {filterAssociation}
                <button onClick={() => setFilterAssociation('')} className="text-gray-400 hover:text-red-600">✕</button>
              </span>
            )}
            <button
              onClick={() => { setSearchTerm(''); setFilterStatus(''); setFilterVisibility(''); setFilterAssociation(''); setCurrentPage(1); }}
              className="text-xs font-medium text-red-600 hover:text-red-800 underline ml-2"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {/* BLOQUE 3: barra de control de vista + métricas */}
      <div className="flex items-center justify-between mb-4 pl-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setViewMode('grid'); setCurrentPage(1); }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors focus:outline-none ${viewMode === 'grid' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            <FaTh className="w-4 h-4" /> Mosaico
          </button>
          <button
            onClick={() => { setViewMode('table'); setCurrentPage(1); }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors focus:outline-none ${viewMode === 'table' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            <FaList className="w-4 h-4" /> Tabla
          </button>
          {selected.length > 0 && (
            <button onClick={handleDeleteSelected} className="ml-2 inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
              <FaTrash /> Eliminar ({selected.length})
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setFilterStatus(''); setFilterVisibility(''); setCurrentPage(1); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm border-gray-200 hover:border-gray-300"
          >
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-sm font-bold text-gray-800">{total}</span>
          </button>
          <button
            onClick={() => { setFilterStatus('active'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all ${filterStatus === 'active' ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="text-sm text-green-600">Activos</span>
            <span className="text-sm font-bold text-green-700">{activeCount}</span>
          </button>
          <button
            onClick={() => { setFilterStatus('inactive'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all ${filterStatus === 'inactive' ? 'border-gray-400 ring-2 ring-gray-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="text-sm text-gray-500">Inactivos</span>
            <span className="text-sm font-bold text-gray-700">{inactiveCount}</span>
          </button>
          <button
            onClick={() => { setFilterVisibility('public'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all ${filterVisibility === 'public' ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="text-sm text-blue-600">Públicos</span>
            <span className="text-sm font-bold text-blue-700">{publicCount}</span>
          </button>
          <button
            onClick={() => { setFilterVisibility('private'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all ${filterVisibility === 'private' ? 'border-gray-400 ring-2 ring-gray-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="text-sm text-gray-600">Privados</span>
            <span className="text-sm font-bold text-gray-700">{privateCount}</span>
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
        <>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map(group => (
              <AdminChatGroupCard key={group.id} group={group} associationLabel={getAssociationLabel(group)} />
            ))}
          </div>
        ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-purple-100 text-sm">
            <thead className="bg-fuchsia-50 text-fuchsia-800 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-left">Acciones</th>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Plataforma</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Visibilidad</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Asignado a</th>
                <th className="px-6 py-3 text-left hidden lg:table-cell">Estado</th>
                <th className="px-6 py-3 text-right w-10">
                  <input type="checkbox" onChange={toggleSelectAll} checked={paginated.length > 0 && selected.length === paginated.length} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {paginated.map(group => (
                <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/admin/chatGroups/${group.id}/edit`} className="p-1.5 text-gray-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors" title="Editar">
                      <FaEdit className="w-5 h-5" />
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{group.name}</td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{group.platform}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${group.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {group.isPublic ? 'Público' : 'Privado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500 text-xs">
                    {getAssociationLabel(group)}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {group.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <input type="checkbox" checked={selected.includes(group.id)} onChange={() => toggleOne(group.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
        )}
        </>
      )}
    </AdminLayout>
  );
}

export default AdminChatGroups;