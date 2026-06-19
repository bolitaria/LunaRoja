import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { withAuth } from '../../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { downloadCSV } from '../../../utils/exportCsv';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import ActionPreview from '../../../components/ActionPreview';
import { FaEdit, FaTrash, FaFileExport, FaSearch, FaPlus, FaEye } from 'react-icons/fa';

function AdminActions() {
  const [actions, setActions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCampaignId, setFilterCampaignId] = useState('');
  const [filterLocationType, setFilterLocationType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewAction, setPreviewAction] = useState(null); // ← nuevo
  const itemsPerPage = 10;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  // … (fetchActions, fetchCampaigns, handleDelete, executeDelete, etc., iguales) …
  const fetchActions = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`, { headers: { Authorization: `Bearer ${token}` } });
      const sorted = res.data.sort((a, b) => {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        return new Date(b.datetime) - new Date(a.datetime);
      });
      setActions(sorted);
    } catch (error) { toast.error('Error al cargar acciones'); }
  };
  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
      setCampaigns(res.data);
    } catch (error) { toast.error('Error al cargar campañas'); }
  };
  useEffect(() => { Promise.all([fetchActions(), fetchCampaigns()]).then(() => setLoading(false)); }, []);

  const handleDelete = (id) => { setDeleteTarget(id); setShowDeleteModal(true); };
  const handleDeleteSelected = () => { if (selected.length === 0) return; setDeleteTarget(selected); setShowDeleteModal(true); };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/actions/${id}`, { headers: { Authorization: `Bearer ${token}` } })));
      toast.success(`${ids.length} acción(es) eliminada(s)`);
      setSelected([]); fetchActions();
    } catch (error) { toast.error('Error al eliminar'); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  };

  const exportSelectedCSV = () => {
    const selectedActions = actions.filter(a => selected.includes(a.id));
    const headers = ['title', 'category', 'datetime', 'locationType', 'placeName', 'campaign', 'status'];
    const data = selectedActions.map(a => ({
      title: a.title,
      category: categoryLabels[a.category] || a.category,
      datetime: new Date(a.datetime).toLocaleString(),
      locationType: a.locationType === 'online' ? 'Online' : (a.placeName || 'Presencial'),
      placeName: a.placeName || '',
      campaign: a.campaignId ? campaignMap[a.campaignId]?.name || '' : '',
      status: new Date(a.datetime) < new Date() ? 'Pasado' : 'Próximo'
    }));
    downloadCSV(data, headers, 'acciones_seleccionadas.csv');
  };

  const categoryLabels = { webinar: 'Webinar', talk: 'Charla', protest: 'Manifestación', bds: 'Acción BDS', strike: 'Huelga', march: 'Marcha', solidarity_action: 'Acción Solidaria', workshop: 'Taller' };
  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
  const now = new Date();

  const filteredActions = actions.filter(action => {
    if (searchTerm && !action.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterCategory && action.category !== filterCategory) return false;
    if (filterCampaignId && action.campaignId !== filterCampaignId) return false;
    if (filterLocationType && action.locationType !== filterLocationType) return false;
    if (filterStatus) {
      const isPast = new Date(action.datetime) < now;
      if (filterStatus === 'upcoming' && isPast) return false;
      if (filterStatus === 'past' && !isPast) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredActions.length / itemsPerPage);
  const paginatedActions = filteredActions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const total = actions.length;
  const upcomingCount = actions.filter(a => new Date(a.datetime) >= now).length;
  const pastCount = total - upcomingCount;
  const urgentCount = actions.filter(a => a.urgent).length;

  const exportToCSV = () => {
    const headers = ['title', 'category', 'datetime', 'locationType', 'placeName', 'campaign', 'status'];
    const data = filteredActions.map(a => ({
      title: a.title,
      category: categoryLabels[a.category] || a.category,
      datetime: new Date(a.datetime).toLocaleString(),
      locationType: a.locationType === 'online' ? 'Online' : (a.placeName || 'Presencial'),
      placeName: a.placeName || '',
      campaign: a.campaignId ? campaignMap[a.campaignId]?.name || '' : '',
      status: new Date(a.datetime) < now ? 'Pasado' : 'Próximo'
    }));
    downloadCSV(data, headers, 'acciones.csv');
  };

  const toggleSelectAll = (e) => { if (e.target.checked) setSelected(paginatedActions.map(a => a.id)); else setSelected([]); };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Opciones de filtros
  const categoryOptions = Object.entries(categoryLabels).map(([key, label]) => ({ value: key, label }));
  const locationOptions = [
    { value: 'presencial', label: 'Presencial' },
    { value: 'online', label: 'Online' },
  ];
  const statusOptions = [
    { value: 'upcoming', label: 'Próximas' },
    { value: 'past', label: 'Pasadas' },
  ];

  const metricCards = [
    { label: 'Total', value: total, filter: '' },
    { label: 'Próximas', value: upcomingCount, filter: 'upcoming' },
    { label: 'Pasadas', value: pastCount, filter: 'past' },
    { label: 'Urgentes', value: urgentCount, filter: '' },
  ];

  // Función auxiliar para construir URLs de imágenes
  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_BASE_URL}${url}`;
  };

  return (
    <AdminLayout title="Acciones">
      <ToastContainer />
      {/* Modal de confirmación de eliminación */}
      <ConfirmModal isOpen={showDeleteModal} title="Eliminar acción" message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} acciones seleccionadas?` : '¿Eliminar esta acción?')} onConfirm={executeDelete} onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }} />

      {/* Modal de vista previa */}
      {previewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setPreviewAction(null)}>
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-700">Vista previa de la acción</h3>
              <button onClick={() => setPreviewAction(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <ActionPreview
              form={previewAction}
              featuredImage={getImageUrl(previewAction.featuredImage)}
              images={previewAction.images ? previewAction.images.map(img => getImageUrl(img.url)) : []}
            />
          </div>
        </div>
      )}

      {/* Tarjeta de métricas compacta */}
      <div className="bg-gray-50/80 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-6 text-sm border border-gray-100">
        {metricCards.map((m, i) => (
          <button
            key={i}
            onClick={() => { setFilterStatus(m.filter); setCurrentPage(1); }}
            className="flex items-center gap-1.5 hover:text-fuchsia-700 transition-colors group"
          >
            <span className="text-xs text-gray-500 group-hover:text-fuchsia-600">{m.label}</span>
            <span className="font-bold text-gray-800 group-hover:text-fuchsia-700">{m.value}</span>
          </button>
        ))}
      </div>

      {/* Fila de acciones: Nueva Acción (izq), buscar y exportar (der) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {user && (user.role === 'superadmin' || user.role === 'campaign_admin') && (
            <Link href="/admin/actions/new" className="inline-flex items-center gap-1.5 text-sm border border-fuchsia-300 text-fuchsia-700 bg-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors shadow-sm">
              <FaPlus className="w-3.5 h-3.5" /> Nueva Acción
            </Link>
          )}
          {selected.length > 0 && (
            <button onClick={exportSelectedCSV} className="inline-flex items-center gap-1 text-sm border border-gray-300 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
              <FaFileExport className="w-3.5 h-3.5" /> Exportar ({selected.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-48"
            />
          </div>
          <button onClick={exportToCSV} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors" title="Exportar CSV">
            <FaFileExport className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filtros rápidos (píldoras) */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Categoría */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-500 mr-1 self-center font-medium">Categoría:</span>
          {categoryOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFilterCategory(prev => prev === opt.value ? '' : opt.value); setCurrentPage(1); }}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                filterCategory === opt.value
                  ? 'bg-fuchsia-500 border-fuchsia-500 text-white shadow-sm'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        {/* Ubicación */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-500 mr-1 self-center font-medium">Ubicación:</span>
          {locationOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFilterLocationType(prev => prev === opt.value ? '' : opt.value); setCurrentPage(1); }}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                filterLocationType === opt.value
                  ? 'bg-fuchsia-500 border-fuchsia-500 text-white shadow-sm'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        {/* Estado */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-500 mr-1 self-center font-medium">Estado:</span>
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFilterStatus(prev => prev === opt.value ? '' : opt.value); setCurrentPage(1); }}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                filterStatus === opt.value
                  ? 'bg-fuchsia-500 border-fuchsia-500 text-white shadow-sm'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Campaña */}
        <select
          value={filterCampaignId}
          onChange={(e) => { setFilterCampaignId(e.target.value); setCurrentPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white text-gray-600 ml-auto"
        >
          <option value="">Todas las campañas</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-gray-500 text-sm">Cargando…</p>
      ) : filteredActions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron acciones</p>
          <p className="text-sm">Prueba a cambiar los filtros o crea una nueva acción.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left w-10">
                  <input type="checkbox" onChange={toggleSelectAll} checked={paginatedActions.length > 0 && selected.length === paginatedActions.length} className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-3 text-left">Título</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Categoría</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Fecha / Hora</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Ubicación</th>
                <th className="px-6 py-3 text-left hidden lg:table-cell">Campaña</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedActions.map(action => {
                const actionDate = new Date(action.datetime);
                const isPast = actionDate < now;
                const campaign = campaignMap[action.campaignId];
                let imageUrl = action.featuredImage
                  ? `${process.env.NEXT_PUBLIC_BASE_URL}${action.featuredImage}`
                  : (action.images?.[0]?.url ? `${process.env.NEXT_PUBLIC_BASE_URL}${action.images[0].url}` : null);
                return (
                  <tr key={action.id} className={`hover:bg-gray-50 transition-colors ${action.urgent ? 'bg-red-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selected.includes(action.id)} onChange={() => toggleOne(action.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {imageUrl && <img src={imageUrl} alt="" className="h-8 w-8 object-cover rounded-md" />}
                        <div>
                          <span className="font-medium text-gray-900">{action.title}</span>
                          {action.urgent && (
                            <span className="ml-2 inline-block px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">🔥 Urgente</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{categoryLabels[action.category]}</td>
                    <td className="px-6 py-4 hidden md:table-cell text-gray-500">{actionDate.toLocaleString()}</td>
                    <td className="px-6 py-4 hidden md:table-cell text-gray-500">
                      {action.locationType === 'online' ? '💻 Online' : (action.placeName || '📍 Presencial')}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {campaign ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: campaign.color }} />
                          <span className="text-gray-700">{campaign.name}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isPast ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                      }`}>
                        {isPast ? 'Pasado' : 'Próximo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Vista previa */}
                        <button
                          onClick={() => setPreviewAction(action)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Vista previa"
                        >
                          <FaEye className="w-5 h-5" />
                        </button>
                        {/* Editar */}
                        <Link href={`/admin/actions/${action.id}/edit`} className="p-1.5 text-gray-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors" title="Editar">
                          <FaEdit className="w-5 h-5" />
                        </Link>
                        {/* Eliminar */}
                        <button onClick={() => handleDelete(action.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                          <FaTrash className="w-5 h-5" />
                        </button>
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

export default withAuth(AdminActions);