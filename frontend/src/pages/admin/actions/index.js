// frontend/src/pages/admin/actions/index.js
import api from '../../../lib/axios';
import { useState, useEffect, useRef, useMemo } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import { exportInfo } from '../../../utils/exportInfo';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import ActionPreview from '../../../components/ActionPreview';
import {
  FaEdit, FaTrash, FaFileExport, FaSearch, FaEye,
  FaTh, FaList, FaFire, FaMapMarkerAlt, FaRegClock,
  FaSlidersH, FaCalendarAlt, FaLink, FaLock, FaUnlock,
  FaChevronDown, FaChevronUp, FaTimesCircle
} from 'react-icons/fa';

function AdminActions() {
  const [actions, setActions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  // Filtros principales
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCampaignId, setFilterCampaignId] = useState('');
  const [filterUrgency, setFilterUrgency] = useState(false);

  // Filtros avanzados
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState(''); // Solo para métricas, ya no en filtros
  const [filterLocationType, setFilterLocationType] = useState('');
  const [filterHasPrivateDoc, setFilterHasPrivateDoc] = useState(false);
  const [filterHasPublicDoc, setFilterHasPublicDoc] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Paginación y selección
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [total, setTotal] = useState(0);
  const [metrics, setMetrics] = useState({ total: 0, upcoming: 0, past: 0, urgent: 0 });
  const [selected, setSelected] = useState([]);
  const [autoSelected, setAutoSelected] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportMenuRef = useRef(null);
  const lastSelectedIdRef = useRef(null);

  const categoryLabels = {
    webinar: 'Webinar', talk: 'Charla', protest: 'Manifestación',
    bds: 'Acción BDS', strike: 'Huelga', march: 'Marcha',
    solidarity_action: 'Acción Solidaria', workshop: 'Taller'
  };

  const categoryColors = {
    webinar: 'bg-blue-100 text-blue-800',
    talk: 'bg-indigo-100 text-indigo-800',
    protest: 'bg-red-100 text-red-800',
    bds: 'bg-purple-100 text-purple-800',
    strike: 'bg-orange-100 text-orange-800',
    march: 'bg-pink-100 text-pink-800',
    solidarity_action: 'bg-teal-100 text-teal-800',
    workshop: 'bg-orange-100 text-orange-800'
  };

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns', { params: { limit: 1000 } });
      const payload = res.data;
      setCampaigns(Array.isArray(payload) ? payload : (payload.data || []));
    } catch (error) {
      console.warn('No se pudieron cargar campañas', error);
      setCampaigns([]);
    }
  };

  const fetchActions = async () => {
    setError(null);
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (searchTerm) params.search = searchTerm;
      if (filterCategory) params.category = filterCategory;
      if (filterCampaignId) params.campaignId = filterCampaignId;
      if (filterLocationType) params.locationType = filterLocationType;
      if (filterStatus === 'upcoming') params.status = 'upcoming';
      if (filterStatus === 'past') params.status = 'past';
      if (filterUrgency) params.urgency = 'urgent';
      if (filterHasPrivateDoc) params.hasPrivateDoc = 'true';
      if (filterHasPublicDoc) params.hasPublicDoc = 'true';
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await api.get('/actions', { params });
      setActions(res.data.data);
      setTotal(res.data.total);
      if (res.data.metrics) {
        setMetrics(res.data.metrics);
      }
    } catch (error) {
      console.error('Error fetching actions:', error);
      setError('No se pudieron cargar las acciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchActions();
  }, [currentPage, itemsPerPage, searchTerm, filterCategory, filterCampaignId, filterLocationType, filterStatus, filterUrgency, filterHasPrivateDoc, filterHasPublicDoc, dateFrom, dateTo]);

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

  const toggleHasPrivateDoc = () => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    setFilterHasPrivateDoc(prev => !prev);
  };

  const toggleHasPublicDoc = () => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    setFilterHasPublicDoc(prev => !prev);
  };

  const toggleMetric = (type, value) => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    if (type === 'status') {
      setFilterStatus(prev => prev === value ? '' : value);
    } else if (type === 'clear') {
      setFilterStatus('');
      setFilterUrgency(false);
    }
  };

  const clearAllFilters = () => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    setSearchTerm('');
    setFilterCategory('');
    setFilterCampaignId('');
    setFilterUrgency(false);
    setFilterStatus('');
    setFilterLocationType('');
    setFilterHasPrivateDoc(false);
    setFilterHasPublicDoc(false);
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
      await Promise.all(ids.map(id => api.delete(`/actions/${id}`)));
      toast.success(`${ids.length} acción(es) eliminada(s)`);
      setSelected([]);
      setAutoSelected(false);
      fetchActions();
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const exportData = (format) => {
    const source = selected.length > 0 ? actions.filter(a => selected.includes(a.id)) : actions;
    const headers = ['title', 'category', 'datetime', 'locationType', 'placeName', 'campaign', 'status', 'isBDS', 'urgent'];
    const data = source.map(a => ({
      title: a.title,
      category: categoryLabels[a.category] || a.category,
      datetime: new Date(a.datetime).toLocaleString(),
      locationType: a.locationType === 'online' ? 'Online' : (a.placeName || 'Presencial'),
      placeName: a.placeName || '',
      campaign: a.campaignId ? campaignMap[a.campaignId]?.name || '' : '',
      status: new Date(a.datetime) < now ? 'Pasado' : 'Próximo',
      isBDS: a.bdsId ? 'Sí' : 'No',
      urgent: a.urgent ? 'Sí' : 'No'
    }));
    exportInfo(data, headers, 'acciones', format);
    setShowExportOptions(false);
  };

  const campaignMap = useMemo(() => campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {}), [campaigns]);
  const now = new Date();

  const totalPages = Math.ceil(total / itemsPerPage);
  const upcomingCount = actions.filter(a => new Date(a.datetime) >= now).length;
  const pastCount = actions.filter(a => new Date(a.datetime) < now).length;
  const urgentCount = actions.filter(a => a.urgent).length;

  const handleRowClick = (e, actionId) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input[type="checkbox"]')) return;
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    setAutoSelected(false);

    if (isShift) {
      const currentIndex = actions.findIndex(a => a.id === actionId);
      const lastIndex = actions.findIndex(a => a.id === lastSelectedIdRef.current);
      if (lastIndex >= 0 && currentIndex >= 0) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = actions.slice(start, end + 1).map(a => a.id);
        setSelected(prev => Array.from(new Set([...prev, ...rangeIds])));
      }
    } else if (isCtrl) {
      setSelected(prev => prev.includes(actionId) ? prev.filter(id => id !== actionId) : [...prev, actionId]);
    } else {
      // Click simple: navegar al detalle
      router.push(`/admin/actions/${actionId}`);
    }
    lastSelectedIdRef.current = actionId;
  };

  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setAutoSelected(false);
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : url;
  };

  const hasActiveFilters = searchTerm || filterCategory || filterCampaignId || filterUrgency || filterStatus || filterLocationType || filterHasPrivateDoc || filterHasPublicDoc || dateFrom || dateTo;

  return (
    <AdminLayout title="Acciones">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar acción"
        message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} acciones seleccionadas?` : '¿Eliminar esta acción?')}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />
<div className="mb-5">
        {user && (user.role === 'superadmin' || user.role === 'campaign_admin') && (
          <Link href="/admin/actions/new" className="inline-flex items-center gap-2 text-lg font-semibold border-2 border-fuchsia-300 text-fuchsia-700 bg-white px-7 py-3.5 rounded-xl hover:bg-fuchsia-50 transition-colors shadow-md">
            <FaEdit className="w-5 h-5" /> Nueva Acción
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
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm)(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-fuchsia-400 text-sm w-full"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => handleFilterChange(setFilterCategory)(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
          >
            <option value="">Todas las categorías</option>
            {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>

          <select
            value={filterCampaignId}
            onChange={(e) => handleFilterChange(setFilterCampaignId)(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
          >
            <option value="">Todas las campañas</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

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

        {/* Panel de filtros avanzados (sin filtro de estado) */}
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

            {/* Filtro de modalidad con nuevo título */}
            <select
              value={filterLocationType}
              onChange={(e) => handleFilterChange(setFilterLocationType)(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
              title="Filtrar por modalidad"
            >
              <option value="">Modalidad</option>
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>

            <button
              onClick={toggleHasPrivateDoc}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none ${filterHasPrivateDoc ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              title="Filtrar acciones con documentos privados"
            >
              <FaLock className={`w-4 h-4 ${filterHasPrivateDoc ? 'text-orange-600' : 'text-gray-400'}`} />
              Con doc. privados
            </button>

            <button
              onClick={toggleHasPublicDoc}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none ${filterHasPublicDoc ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              title="Filtrar acciones con documentos públicos"
            >
              <FaUnlock className={`w-4 h-4 ${filterHasPublicDoc ? 'text-green-600' : 'text-gray-400'}`} />
              Con doc. públicos
            </button>
          </div>
        )}

        {/* Chips de filtros activos */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Búsqueda: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Categoría: {categoryLabels[filterCategory] || filterCategory}
                <button onClick={() => setFilterCategory('')} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterCampaignId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Campaña: {campaignMap[filterCampaignId]?.name || 'Desconocida'}
                <button onClick={() => setFilterCampaignId('')} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterUrgency && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">
                Urgente
                <button onClick={toggleUrgency} className="text-red-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterLocationType && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Modalidad: {filterLocationType === 'online' ? 'Online' : 'Presencial'}
                <button onClick={() => setFilterLocationType('')} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterHasPrivateDoc && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs">
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
          <button onClick={() => { setViewMode('grid'); setCurrentPage(1); }} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors focus:outline-none ${viewMode === 'grid' ? 'bg-orange-100 text-orange-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`} title="Vista mosaico">
            <FaTh className="w-4 h-4" /> Mosaico
          </button>
          <button onClick={() => { setViewMode('table'); setCurrentPage(1); }} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors focus:outline-none ${viewMode === 'table' ? 'bg-orange-100 text-orange-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`} title="Vista tabla">
            <FaList className="w-4 h-4" /> Tabla
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setFilterStatus(''); setFilterUrgency(false); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${filterStatus === '' && !filterUrgency ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-sm font-bold text-gray-800">{metrics.total}</span>
          </button>

          <button
            onClick={() => toggleMetric('status','upcoming')}
            aria-pressed={filterStatus === 'upcoming'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${filterStatus === 'upcoming' ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <FaRegClock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Próximas</span>
            <span className="text-sm font-bold text-green-600">{metrics.upcoming}</span>
          </button>

          <button
            onClick={toggleUrgency}
            aria-pressed={filterUrgency}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${filterUrgency ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <FaFire className={`w-4 h-4 ${filterUrgency ? 'text-red-500' : 'text-gray-400'}`} />
            <span className="text-sm text-red-500">Urgentes</span>
            <span className="text-sm font-bold text-red-600">{metrics.urgent}</span>
          </button>

          <button
            onClick={() => toggleMetric('status','past')}
            aria-pressed={filterStatus === 'past'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${filterStatus === 'past' ? 'border-gray-400 ring-2 ring-gray-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="text-sm text-gray-500">Pasadas</span>
            <span className="text-sm font-bold text-gray-500">{metrics.past}</span>
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
          <button onClick={fetchActions} className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700">Reintentar</button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : actions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron acciones</p>
          <p className="text-sm">Prueba a cambiar los filtros o crea una nueva acción.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {actions.map(action => {
              const imageUrl = getImageUrl(action.imageUrl || action.featuredImage);
              const isPast = new Date(action.datetime) < now;
              const campaignName = campaignMap[action.campaignId]?.name || (action.bdsId ? 'BDS' : 'General');
              return (
                <div
                  key={action.id}
                  onClick={() => router.push(`/admin/actions/${action.id}`)}
                  className={`relative bg-white rounded-2xl shadow-sm border cursor-pointer ${selected.includes(action.id) ? 'border-fuchsia-500 ring-2 ring-fuchsia-200' : 'border-gray-200'} hover:shadow-md hover:border-fuchsia-300 transition-shadow overflow-hidden flex flex-col`}
                >
                  <div className="relative h-36 bg-gray-100">
                    {imageUrl ? (
                      <img src={imageUrl} alt={action.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400"><FaMapMarkerAlt className="w-8 h-8" /></div>
                    )}
                    {action.urgent && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow"><FaFire className="w-3 h-3" /> Urgente</span>
                    )}
                    {action.status === 'processing' && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500 text-white text-xs font-bold shadow" title="Procesando imágenes...">
                        ⏳ Procesando
                      </span>
                    )}
                    {action.status === 'error' && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-700 text-white text-xs font-bold shadow" title={action.processingError || 'Error al procesar'}>
                        ❌ Error
                      </span>
                    )}
                    <label className="absolute top-2 left-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.includes(action.id)}
                        onChange={() => toggleOne(action.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500 bg-white shadow-sm"
                      />
                    </label>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg truncate mb-1">{action.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[action.category] || 'bg-gray-100 text-gray-800'}`}>{categoryLabels[action.category] || action.category}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${action.bdsId ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>{action.bdsId ? 'BDS' : 'General'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1"><FaRegClock className="inline w-3 h-3 mr-1" />{new Date(action.datetime).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs text-gray-500 mb-3">{campaignName && <span>Campaña: {campaignName}</span>}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isPast ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}`}>{isPast ? 'Pasado' : 'Próximo'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }} />
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaña</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgencia</th>
                
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {actions.map((action) => {
                const isPast = new Date(action.datetime) < now;
                const campaignName = campaignMap[action.campaignId]?.name || (action.bdsId ? 'BDS' : 'General');
                const formattedDate = new Date(action.datetime).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                const locationInfo = action.locationType === 'online' ? '💻 Online' : `${action.placeName || 'Presencial'}${action.address ? `, ${action.address}` : ''}`;
                return (
                  <tr key={action.id} onClick={(e) => handleRowClick(e, action.id)} className={`hover:bg-gray-50 transition-colors cursor-pointer ${selected.includes(action.id) ? 'bg-fuchsia-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input type="checkbox" checked={selected.includes(action.id)} onChange={() => toggleOne(action.id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500 mr-3" />
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><FaMapMarkerAlt className="w-5 h-5" /></div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{action.title}</div>
                          <div className="text-xs text-gray-500">{action.bdsId ? 'BDS' : 'General'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"><FaRegClock className="inline w-3 h-3 mr-1 text-gray-400" />{formattedDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{locationInfo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{campaignName}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${categoryColors[action.category] || 'bg-gray-100 text-gray-800'}`}>{categoryLabels[action.category] || action.category}</span></td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${isPast ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}`}>{isPast ? 'Pasado' : 'Próximo'}</span></td>
                    <td className="px-6 py-4">{action.urgent && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium"><FaFire className="w-3 h-3" /> Urgente</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-gray-200 px-4 py-3">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }} />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminActions;