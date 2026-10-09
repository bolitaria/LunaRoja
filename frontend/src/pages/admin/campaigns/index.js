// frontend/src/pages/admin/campaigns/index.js
import api from '../../../lib/axios';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router'; 
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { exportInfo } from '../../../utils/exportInfo';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import CampaignPreview from '../../../components/CampaignPreview';
import {
  FaEdit, FaTrash, FaFileExport, FaSearch, FaEye,
  FaThLarge, FaList, FaImage, FaUsers, FaFire,
  FaLock, FaUnlock, FaSlidersH, FaCalendarAlt, FaChevronDown, FaChevronUp,
  FaBullhorn, FaTimesCircle
} from 'react-icons/fa';

const ACTION_CATEGORIES = [
  'webinar', 'talk', 'protest', 'bds', 'strike', 'march', 'solidarity_action', 'workshop'
];
const ACTION_CATEGORY_LABELS = {
  webinar: 'Webinar', talk: 'Charla', protest: 'Manifestación',
  bds: 'Acción BDS', strike: 'Huelga', march: 'Marcha',
  solidarity_action: 'Acción Solidaria', workshop: 'Taller'
};

function AdminCampaigns() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Filtros principales
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState(false);
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [filterHasActions, setFilterHasActions] = useState(false);
  const [filterActionCategory, setFilterActionCategory] = useState('');

  // Filtros avanzados
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterHasPublicDoc, setFilterHasPublicDoc] = useState(false);
  const [filterHasPrivateDoc, setFilterHasPrivateDoc] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Paginación y selección
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [total, setTotal] = useState(0);
  const [metrics, setMetrics] = useState({ total: 0, urgent: 0, public_count: 0, private_count: 0 });
  const [selected, setSelected] = useState([]);
  const [autoSelected, setAutoSelected] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewCampaign, setPreviewCampaign] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportMenuRef = useRef(null);
  const lastSelectedIdRef = useRef(null);

  const fetchCampaigns = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (searchTerm) params.search = searchTerm;
      if (filterUrgency) params.urgency = 'urgent';
      if (filterVisibility !== 'all') params.visibility = filterVisibility;
      if (filterHasActions) {
        params.hasActions = 'true';
        if (filterActionCategory) params.actionCategory = filterActionCategory;
      }
      if (filterHasPublicDoc) params.hasPublicDoc = 'true';
      if (filterHasPrivateDoc) params.hasPrivateDoc = 'true';
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await api.get('/campaigns', { params });
      const payload = res.data;
      setCampaigns(payload.data || []);
      setTotal(payload.total || 0);
      if (payload.metrics) {
        setMetrics(payload.metrics);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError('No se pudieron cargar las campañas');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage, itemsPerPage, searchTerm, filterUrgency, filterVisibility,
    filterHasActions, filterActionCategory, filterHasPublicDoc, filterHasPrivateDoc,
    dateFrom, dateTo,
  ]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleFilterChange = (setter) => (value) => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    setter(value);
  };

  const toggleUrgency = () => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    setFilterUrgency(prev => !prev);
  };

  const setVisibilityFilter = (value) => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    setFilterVisibility(prev => prev === value ? 'all' : value);
  };

  const toggleHasActions = () => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    setFilterHasActions(prev => !prev);
    if (!filterHasActions) setFilterActionCategory('');
  };

  const toggleHasPublicDoc = () => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    setFilterHasPublicDoc(prev => !prev);
  };

  const toggleHasPrivateDoc = () => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    setFilterHasPrivateDoc(prev => !prev);
  };

  const clearAllFilters = () => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    setSearchTerm('');
    setFilterUrgency(false);
    setFilterVisibility('all');
    setFilterHasActions(false);
    setFilterActionCategory('');
    setFilterHasPublicDoc(false);
    setFilterHasPrivateDoc(false);
    setDateFrom('');
    setDateTo('');
    setShowDateFilter(false);
  };

  const handleDeleteSelected = () => {
    if (selected.length === 0) return;
    setDeleteTarget(selected);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/campaigns/${id}`)));
      toast.success(`${ids.length} campaña(s) eliminada(s)`);
      setSelected([]);
      setAutoSelected(false);
      fetchCampaigns();
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const exportData = (format) => {
    const source = selected.length > 0 ? campaigns.filter(c => selected.includes(c.id)) : campaigns;
    const headers = ['name', 'description', 'subscribers', 'numActions', 'visibilidad', 'urgentActions', 'createdAt'];
    const data = source.map(c => ({
      name: c.name,
      description: c.description || '',
      subscribers: c.subscriberCount || 0,
      numActions: c.actionCount || 0,
      visibilidad: getVisibility(c),
      urgentActions: c.urgentActionCount || 0,
      createdAt: new Date(c.createdAt).toLocaleDateString(),
    }));
    exportInfo(data, headers, 'campanas', format);
    setShowExportOptions(false);
  };

  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setAutoSelected(false);
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : url;
  };

  const getVisibility = (c) => {
    const groups = c.groups || [];
    const hasPublic = groups.some(g => g.isPublic) || (c.document && c.document !== '');
    const hasPrivate = groups.some(g => !g.isPublic) || (c.documentLink && c.documentLink !== '');
    if (hasPublic && hasPrivate) return 'Ambos';
    if (hasPublic) return 'Público';
    if (hasPrivate) return 'Privado';
    return 'Sin contenido';
  };

  const isSuperAdmin = user && user.role === 'superadmin';
  const totalPages = Math.ceil(total / itemsPerPage);

  const hasActiveFilters = searchTerm || filterUrgency || filterVisibility !== 'all' || filterHasActions || filterActionCategory || filterHasPublicDoc || filterHasPrivateDoc || dateFrom || dateTo;

  return (
    <AdminLayout title="Campañas">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar campaña"
        message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} campañas seleccionadas?` : '¿Eliminar esta campaña?')}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      {previewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setPreviewCampaign(null)}>
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-700">Vista previa de la campaña</h3>
              <button onClick={() => setPreviewCampaign(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <CampaignPreview
              name={previewCampaign.name}
              description={previewCampaign.description}
              color={previewCampaign.color}
              image={previewCampaign.imageUrl}
              groups={previewCampaign.groups}
              documents={[]}
              privateLink={previewCampaign.documentLink}
            />
          </div>
        </div>
      )}

      <div className="mb-5">
        {isSuperAdmin && (
          <Link href="/admin/campaigns/new" className="inline-flex items-center gap-2 text-lg font-semibold border-2 border-fuchsia-300 text-fuchsia-700 bg-white px-7 py-3.5 rounded-xl hover:bg-fuchsia-50 transition-colors shadow-md">
            <span className="text-lg">📢</span> Nueva Campaña
          </Link>
        )}
      </div>

      {/* Barra de filtros principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-56">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar campañas..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm)(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-fuchsia-400 text-sm w-full"
            />
          </div>

          <button
            onClick={toggleHasActions}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none ${filterHasActions ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            <FaBullhorn className={`w-4 h-4 ${filterHasActions ? 'text-blue-600' : 'text-gray-400'}`} />
            Con Acciones
          </button>

          {filterHasActions && (
            <select
              value={filterActionCategory}
              onChange={(e) => handleFilterChange(setFilterActionCategory)(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
            >
              <option value="">Todos los tipos</option>
              {ACTION_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{ACTION_CATEGORY_LABELS[cat] || cat}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-fuchsia-700 transition-colors focus:outline-none"
          >
            <FaSlidersH className="w-4 h-4" />
            {showAdvancedFilters ? 'Menos filtros' : 'Más filtros'}
          </button>

          <div className="relative ml-auto" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none"
            >
              <FaFileExport className="w-3.5 h-3.5" /> Exportar
            </button>
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button onClick={() => exportData('csv')} className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">CSV</button>
                <button onClick={() => exportData('xlsx')} className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Excel</button>
                <button onClick={() => exportData('txt')} className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">Texto</button>
              </div>
            )}
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-start gap-5">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 focus:outline-none"
              >
                <FaCalendarAlt className="text-gray-400" />
                Fecha
                {showDateFilter ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
              </button>
              {showDateFilter && (
                <div className="flex items-center gap-2 text-sm text-gray-600 pl-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => handleFilterChange(setDateFrom)(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-fuchsia-400"
                  />
                  <span className="text-gray-400">—</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => handleFilterChange(setDateTo)(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-fuchsia-400"
                  />
                  {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }} className="text-red-400 hover:text-red-600 text-xs">Limpiar</button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={toggleHasPrivateDoc}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none ${filterHasPrivateDoc ? 'bg-fuchsia-100 text-fuchsia-700 border border-orange-300' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              <FaLock className={`w-4 h-4 ${filterHasPrivateDoc ? 'text-orange-600' : 'text-gray-400'}`} />
              Con doc. privados
            </button>

            <button
              onClick={toggleHasPublicDoc}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none ${filterHasPublicDoc ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              <FaUnlock className={`w-4 h-4 ${filterHasPublicDoc ? 'text-green-600' : 'text-gray-400'}`} />
              Con doc. públicos
            </button>
          </div>
        )}

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Búsqueda: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterUrgency && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">
                Urgente
                <button onClick={toggleUrgency} className="text-red-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterVisibility !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                {filterVisibility === 'public' ? 'Público' : 'Privado'}
                <button onClick={() => setVisibilityFilter(filterVisibility)} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterHasActions && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                Con acciones
                {filterActionCategory && `: ${ACTION_CATEGORY_LABELS[filterActionCategory] || filterActionCategory}`}
                <button onClick={() => { setFilterHasActions(false); setFilterActionCategory(''); }} className="text-blue-400 hover:text-blue-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterHasPrivateDoc && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 text-xs">
                Doc. privados
                <button onClick={toggleHasPrivateDoc} className="text-orange-400 hover:text-orange-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterHasPublicDoc && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                Doc. públicos
                <button onClick={toggleHasPublicDoc} className="text-green-400 hover:text-green-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {(dateFrom || dateTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Fecha: {dateFrom || '...'} → {dateTo || '...'}
                <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-red-600 hover:text-red-800 underline ml-2"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>

      {/* Control de vista y métricas */}
      <div className="flex items-center justify-between mb-4 pl-6">
        <div className="flex items-center gap-2">
          <button onClick={() => { setViewMode('grid'); setCurrentPage(1); }} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors focus:outline-none ${viewMode === 'grid' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            <FaThLarge className="w-4 h-4" /> Mosaico
          </button>
          <button onClick={() => { setViewMode('table'); setCurrentPage(1); }} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors focus:outline-none ${viewMode === 'table' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            <FaList className="w-4 h-4" /> Tabla
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setFilterVisibility('all'); setFilterUrgency(false); setCurrentPage(1); }} className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${filterVisibility === 'all' && !filterUrgency ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200 hover:border-gray-300'}`}>
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-sm font-bold text-gray-800">{metrics.total}</span>
          </button>
          <button onClick={toggleUrgency} aria-pressed={filterUrgency} className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${filterUrgency ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200 hover:border-gray-300'}`}>
            <FaFire className={`w-4 h-4 ${filterUrgency ? 'text-red-500' : 'text-gray-400'}`} />
            <span className="text-sm text-red-500">Urgentes</span>
            <span className="text-sm font-bold text-red-600">{metrics.urgent}</span>
          </button>
          <button onClick={() => setVisibilityFilter('public')} aria-pressed={filterVisibility === 'public'} className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${filterVisibility === 'public' ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'}`}>
            <FaUnlock className={`w-4 h-4 ${filterVisibility === 'public' ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-sm text-green-600">Público</span>
            <span className="text-sm font-bold text-green-700">{metrics.public_count}</span>
          </button>
          <button onClick={() => setVisibilityFilter('private')} aria-pressed={filterVisibility === 'private'} className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${filterVisibility === 'private' ? 'border-rose-400 ring-2 ring-rose-200' : 'border-gray-200 hover:border-gray-300'}`}>
            <FaLock className={`w-4 h-4 ${filterVisibility === 'private' ? 'text-rose-500' : 'text-gray-400'}`} />
            <span className="text-sm text-rose-500">Privado</span>
            <span className="text-sm font-bold text-rose-700">{metrics.private_count}</span>
          </button>
        </div>
      </div>

      {selected.length > 0 && !autoSelected && (
        <div className="flex justify-end items-center gap-2 mb-4">
          <button
            onClick={() => { setSelected([]); setAutoSelected(false); }}
            className="inline-flex items-center gap-2 text-sm bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none shadow-sm"
          >
            Limpiar selección
          </button>
          <button
            onClick={handleDeleteSelected}
            className="inline-flex items-center gap-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors focus:outline-none shadow-sm"
          >
            <FaTrash className="w-4 h-4" /> Eliminar ({selected.length})
          </button>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">{error}</p>
          <button onClick={fetchCampaigns} className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700">Reintentar</button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron campañas</p>
          <p className="text-sm">Prueba a cambiar los filtros o crea una nueva.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {campaigns.map(campaign => {
              const imageUrl = getImageUrl(campaign.imageUrl);
              const vis = getVisibility(campaign);
              return (
                <div
                  key={campaign.id}
                  className={`relative bg-white rounded-2xl shadow-sm border ${selected.includes(campaign.id) ? 'border-fuchsia-500 ring-2 ring-fuchsia-200' : 'border-gray-200'} hover:shadow-md transition-shadow overflow-hidden flex flex-col cursor-pointer`}
                  onClick={() => router.push(`/admin/campaigns/${campaign.id}`)}
                >
                  <div className="relative h-36 bg-gray-100">
                    {imageUrl ? (
                      <img src={imageUrl} alt={campaign.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FaImage className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {vis === 'Público' || vis === 'Ambos' ? (
                        <span className="px-2 py-1 rounded-full bg-green-600 text-white text-xs font-bold shadow flex items-center gap-1"><FaUnlock className="w-3 h-3" /> Público</span>
                      ) : null}
                      {vis === 'Privado' || vis === 'Ambos' ? (
                        <span className="px-2 py-1 rounded-full bg-rose-600 text-white text-xs font-bold shadow flex items-center gap-1"><FaLock className="w-3 h-3" /> Privado</span>
                      ) : null}
                      {campaign.urgentActionCount > 0 && (
                        <span className="px-2 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow flex items-center gap-1"><FaFire className="w-3 h-3" /> Urgente</span>
                      )}
                    </div>
                    <label className="absolute top-2 left-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(campaign.id)}
                        onChange={() => toggleOne(campaign.id)}
                        className="w-5 h-5 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500 bg-white shadow-sm"
                      />
                    </label>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg truncate mb-1">{campaign.name}</h3>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><FaUsers className="w-3.5 h-3.5" />{campaign.subscriberCount || 0}</span>
                        <span className="flex items-center gap-1"><FaBullhorn className="w-3.5 h-3.5" />{campaign.actionCount || 0}</span>
                        <span>Creada: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setPreviewCampaign(campaign)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Vista previa">
                          <FaEye className="w-5 h-5" />
                        </button>
                        {isSuperAdmin && (
                          <Link href={`/admin/campaigns/${campaign.id}/edit`} className="p-1.5 text-gray-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors" title="Editar">
                            <FaEdit className="w-5 h-5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-6 pb-2">

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }} />

          </div>
        </>
      ) : (
        <>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaña</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documentos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visible</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suscriptores</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creada</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {campaigns.map(campaign => {
                const vis = getVisibility(campaign);
                return (
                  <tr
                    key={campaign.id}
                    onClick={() => router.push(`/admin/campaigns/${campaign.id}`)}
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${selected.includes(campaign.id) ? 'bg-fuchsia-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selected.includes(campaign.id)}
                          onChange={() => toggleOne(campaign.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500 mr-3"
                        />
                        <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: !campaign.imageUrl ? (campaign.color || '#d946ef') : '#f3f4f6' }}>
                            {campaign.imageUrl ? (
                              <img src={getImageUrl(campaign.imageUrl)} alt="" className="h-12 w-12 object-cover" />
                            ) : (
                              <span className="text-xl font-bold text-white">
                                {(campaign.name || '?').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        <div className="ml-3 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{campaign.name}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {campaign.status === 'processing' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-medium" title="Procesando imágenes...">
                                  ⏳ Procesando
                                </span>
                              )}
                              {campaign.status === 'error' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-medium" title={campaign.processingError || 'Error al procesar'}>
                                  ❌ Error
                                </span>
                              )}
                              {vis === 'Público' || vis === 'Ambos' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-medium">
                                  <FaUnlock className="w-2.5 h-2.5" /> Público
                                </span>
                              ) : null}
                              {vis === 'Privado' || vis === 'Ambos' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-medium">
                                  <FaLock className="w-2.5 h-2.5" /> Privado
                                </span>
                              ) : null}
                              {campaign.urgentActionCount > 0 ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-medium">
                                  <FaFire className="w-2.5 h-2.5" /> {campaign.urgentActionCount} urgente(s)
                                </span>
                              ) : null}
                            </div>
                          </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                        {(() => {
                          const hasPublic = Boolean(campaign.document) || (campaign.groups || []).some(g => g.isPublic);
                          const hasPrivate = Boolean(campaign.documentLink) || (campaign.groups || []).some(g => !g.isPublic);
                          if (hasPublic && hasPrivate) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">📁🔒 Ambos</span>;
                          if (hasPublic) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">📁 Público</span>;
                          if (hasPrivate) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">🔒 Privado</span>;
                          return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">—</span>;
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {campaign.visible !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">✅ Visible</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-medium">🚫 Oculta</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600"><span className="flex items-center gap-1"><FaUsers className="w-3.5 h-3.5 text-fuchsia-500" />{campaign.subscriberCount || 0}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600"><span className="flex items-center gap-1"><FaBullhorn className="w-3.5 h-3.5 text-blue-500" />{campaign.actionCount || 0}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(campaign.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setPreviewCampaign(campaign)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Vista previa"><FaEye className="w-5 h-5" /></button>
                        {isSuperAdmin && (
                          <Link href={`/admin/campaigns/${campaign.id}/edit`} className="p-1.5 text-gray-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors" title="Editar"><FaEdit className="w-5 h-5" /></Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 px-4 py-3 mt-auto">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }} />
        </div>
        </>
      )}
    </AdminLayout>
  );
}

export default AdminCampaigns;