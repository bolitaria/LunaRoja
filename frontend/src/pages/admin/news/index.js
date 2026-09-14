// frontend/src/pages/admin/news/index.js
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
import { unwrapList } from '../../../utils/apiHelpers';
import {
  FaEdit, FaTrash, FaFileExport, FaSearch,
  FaTh, FaList, FaYoutube, FaImage, FaLink, FaNewspaper,
  FaSlidersH, FaCalendarAlt, FaChevronDown, FaChevronUp,
  FaTimesCircle, FaEye
} from 'react-icons/fa';

function AdminNews() {
  const [news, setNews] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampaignId, setFilterCampaignId] = useState('');
  const [filterIsNews, setFilterIsNews] = useState('');
  const [filterHasYoutube, setFilterHasYoutube] = useState(false);
  const [filterHasThumbnail, setFilterHasThumbnail] = useState(false);
  const [filterHasAction, setFilterHasAction] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Paginación / selección
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [total, setTotal] = useState(0);
  const [metrics, setMetrics] = useState({ total: 0, withYoutube: 0, withThumbnail: 0, linked: 0 });
  const [selected, setSelected] = useState([]);
  const [autoSelected, setAutoSelected] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportMenuRef = useRef(null);
  const lastSelectedIdRef = useRef(null);

  const baseUrl = '';
  const getImageUrl = (url) => (!url ? null : (url.startsWith('http') ? url : `${url}`));

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns', { params: { limit: 1000 } });
      setCampaigns(unwrapList(res.data));
    } catch (e) {
      console.warn('No se pudieron cargar campañas', e);
      setCampaigns([]);
    }
  };

  const fetchNews = async () => {
    setError(null);
    setLoading(true);
    try {
      const params = { page: currentPage, limit: itemsPerPage };
      if (searchTerm) params.search = searchTerm;
      if (filterCampaignId) params.campaignId = filterCampaignId;
      if (filterIsNews) params.isNews = filterIsNews;
      if (filterHasYoutube) params.hasYoutube = 'true';
      if (filterHasThumbnail) params.hasThumbnail = 'true';
      if (filterHasAction) params.hasAction = 'true';
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await api.get('/news', { params });
      setNews(res.data.data || []);
      setTotal(res.data.total || 0);
      if (res.data.metrics) setMetrics(res.data.metrics);
    } catch (e) {
      console.error('Error fetching news:', e);
      setError('No se pudieron cargar las noticias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);
  useEffect(() => { fetchNews(); }, [
    currentPage, itemsPerPage, searchTerm, filterCampaignId, filterIsNews,
    filterHasYoutube, filterHasThumbnail, filterHasAction, dateFrom, dateTo
  ]);

  // Atajo: Escape limpia la selección activa
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && selected.length > 0) {
        setSelected([]);
        setAutoSelected(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected.length]);

  const campaignMap = useMemo(() => campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {}), [campaigns]);
  const totalPages = Math.ceil(total / itemsPerPage);

  const resetSelection = () => { setSelected([]); setAutoSelected(false); setCurrentPage(1); };
  const handleFilterChange = (setter) => (value) => { resetSelection(); setter(value); };
  const toggleHasYoutube = () => { resetSelection(); setFilterHasYoutube(p => !p); };
  const toggleHasThumbnail = () => { resetSelection(); setFilterHasThumbnail(p => !p); };
  const toggleHasAction = () => { resetSelection(); setFilterHasAction(p => !p); };

  const toggleMetric = (type) => {
    resetSelection();
    if (type === 'total') {
      setFilterHasYoutube(false);
      setFilterHasThumbnail(false);
      setFilterHasAction(false);
    } else if (type === 'youtube') {
      setFilterHasYoutube(p => !p);
    } else if (type === 'thumbnail') {
      setFilterHasThumbnail(p => !p);
    } else if (type === 'linked') {
      setFilterHasAction(p => !p);
    }
  };

  const clearAllFilters = () => {
    resetSelection();
    setSearchTerm('');
    setFilterCampaignId('');
    setFilterIsNews('');
    setFilterHasYoutube(false);
    setFilterHasThumbnail(false);
    setFilterHasAction(false);
    setDateFrom(''); setDateTo(''); setShowDateFilter(false);
  };

  const handleDeleteSelected = () => {
    if (selected.length === 0) return;
    setDeleteTarget(selected);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/news/${id}`)));
      toast.success(`${ids.length} noticia(s) eliminada(s)`);
      setSelected([]); setAutoSelected(false); fetchNews();
    } catch (e) {
      toast.error('Error al eliminar');
    } finally {
      setShowDeleteModal(false); setDeleteTarget(null);
    }
  };

  const exportData = (format) => {
    const source = selected.length > 0 ? news.filter(n => selected.includes(n.id)) : news;
    const headers = ['title', 'publishedAt', 'isNews', 'campaign', 'hasYoutube', 'hasThumbnail', 'hasAction'];
    const data = source.map(n => ({
      title: n.title,
      publishedAt: n.publishedAt ? new Date(n.publishedAt).toLocaleString() : '',
      isNews: n.isNews ? 'Noticia' : 'Artículo',
      campaign: n.campaignId ? campaignMap[n.campaignId]?.name || '' : '',
      hasYoutube: n.youtubeUrl ? 'Sí' : 'No',
      hasThumbnail: n.thumbnail ? 'Sí' : 'No',
      hasAction: n.actionId ? 'Sí' : 'No',
    }));
    exportInfo(data, headers, 'noticias', format);
    setShowExportOptions(false);
  };

  const handleRowClick = (e, id) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input[type="checkbox"]')) return;
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    setAutoSelected(false);
    if (isShift) {
      const ci = news.findIndex(x => x.id === id);
      const li = news.findIndex(x => x.id === lastSelectedIdRef.current);
      if (li >= 0 && ci >= 0) {
        const [s, e2] = [Math.min(li, ci), Math.max(li, ci)];
        const rangeIds = news.slice(s, e2 + 1).map(x => x.id);
        setSelected(prev => Array.from(new Set([...prev, ...rangeIds])));
      }
    } else if (isCtrl) {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else {
      router.push(`/admin/news/${id}/edit`);
    }
    lastSelectedIdRef.current = id;
  };

  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setAutoSelected(false);
  };

  const hasActiveFilters = searchTerm || filterCampaignId || filterIsNews || filterHasYoutube || filterHasThumbnail || filterHasAction || dateFrom || dateTo;

  return (
    <AdminLayout title="Noticias">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar noticia"
        message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} noticias?` : '¿Eliminar esta noticia?')}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      <div className="mb-5">
        {user && user.role === 'superadmin' && (
          <Link href="/admin/news/new" className="inline-flex items-center gap-2 text-lg font-semibold border-2 border-fuchsia-300 text-fuchsia-700 bg-white px-7 py-3.5 rounded-xl hover:bg-fuchsia-50 transition-colors shadow-md">
            <FaNewspaper className="w-5 h-5" /> Nueva Noticia
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-56">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Buscar..." value={searchTerm}
              onChange={e => handleFilterChange(setSearchTerm)(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-fuchsia-400 text-sm w-full" />
          </div>

          <select value={filterCampaignId} onChange={e => handleFilterChange(setFilterCampaignId)(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-fuchsia-400">
            <option value="">Todas las campañas</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select value={filterIsNews} onChange={e => handleFilterChange(setFilterIsNews)(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-fuchsia-400">
            <option value="">Todos los tipos</option>
            <option value="true">Solo noticias</option>
            <option value="false">Solo artículos</option>
          </select>

          <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-fuchsia-700">
            <FaSlidersH className="w-4 h-4" /> {showAdvancedFilters ? 'Menos filtros' : 'Más filtros'}
          </button>

          <div className="relative ml-auto" ref={exportMenuRef}>
            <button onClick={() => setShowExportOptions(!showExportOptions)}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200">
              <FaFileExport className="w-3.5 h-3.5" /> Exportar
            </button>
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-36 bg-white border rounded-lg shadow-lg z-10">
                <button onClick={() => exportData('csv')} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50">CSV</button>
                <button onClick={() => exportData('xlsx')} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50">Excel</button>
                <button onClick={() => exportData('txt')} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50">Texto</button>
              </div>
            )}
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-start gap-5">
            <div className="flex flex-col gap-2">
              <button onClick={() => setShowDateFilter(!showDateFilter)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50">
                <FaCalendarAlt className="text-gray-400" /> Fecha
                {showDateFilter ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
              </button>
              {showDateFilter && (
                <div className="flex items-center gap-2 text-sm text-gray-600 pl-2">
                  <input type="date" value={dateFrom} onChange={e => handleFilterChange(setDateFrom)(e.target.value)}
                    className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-fuchsia-400" />
                  <span className="text-gray-400">—</span>
                  <input type="date" value={dateTo} onChange={e => handleFilterChange(setDateTo)(e.target.value)}
                    className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-fuchsia-400" />
                </div>
              )}
            </div>

            <button onClick={toggleHasYoutube}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${filterHasYoutube ? 'bg-red-100 text-red-700 border-red-300' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              <FaYoutube className={filterHasYoutube ? 'text-red-600' : 'text-gray-400'} /> Con YouTube
            </button>
            <button onClick={toggleHasThumbnail}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${filterHasThumbnail ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              <FaImage className={filterHasThumbnail ? 'text-blue-600' : 'text-gray-400'} /> Con miniatura
            </button>
            <button onClick={toggleHasAction}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${filterHasAction ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              <FaLink className={filterHasAction ? 'text-purple-600' : 'text-gray-400'} /> Vinculada
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
            {filterCampaignId && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Campaña: {campaignMap[filterCampaignId]?.name || ''}
                <button onClick={() => setFilterCampaignId('')} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterIsNews && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Tipo: {filterIsNews === 'true' ? 'Noticia' : 'Artículo'}
                <button onClick={() => setFilterIsNews('')} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterHasYoutube && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">
                Con YouTube <button onClick={toggleHasYoutube}><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterHasThumbnail && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                Con miniatura <button onClick={toggleHasThumbnail}><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterHasAction && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs">
                Vinculada <button onClick={toggleHasAction}><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearAllFilters} className="text-xs font-medium text-red-600 hover:text-red-800 underline ml-2">Limpiar todo</button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4 pl-6">
        <div className="flex items-center gap-2">
          <button onClick={() => { setViewMode('grid'); setCurrentPage(1); }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-orange-100 text-orange-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            <FaTh className="w-4 h-4" /> Mosaico
          </button>
          <button onClick={() => { setViewMode('table'); setCurrentPage(1); }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ${viewMode === 'table' ? 'bg-orange-100 text-orange-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            <FaList className="w-4 h-4" /> Tabla
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => toggleMetric('total')}
            aria-pressed={!filterHasYoutube && !filterHasThumbnail && !filterHasAction}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${
              !filterHasYoutube && !filterHasThumbnail && !filterHasAction
                ? 'border-orange-400 ring-2 ring-orange-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-sm font-bold text-gray-800">{metrics.total}</span>
          </button>

          <button
            onClick={() => toggleMetric('youtube')}
            aria-pressed={filterHasYoutube}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${
              filterHasYoutube
                ? 'border-red-400 ring-2 ring-red-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FaYoutube className={`w-4 h-4 ${filterHasYoutube ? 'text-red-500' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-500">YouTube</span>
            <span className="text-sm font-bold text-red-600">{metrics.withYoutube}</span>
          </button>

          <button
            onClick={() => toggleMetric('thumbnail')}
            aria-pressed={filterHasThumbnail}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${
              filterHasThumbnail
                ? 'border-blue-400 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FaImage className={`w-4 h-4 ${filterHasThumbnail ? 'text-blue-500' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-500">Miniatura</span>
            <span className="text-sm font-bold text-blue-600">{metrics.withThumbnail}</span>
          </button>

          <button
            onClick={() => toggleMetric('linked')}
            aria-pressed={filterHasAction}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${
              filterHasAction
                ? 'border-purple-400 ring-2 ring-purple-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FaLink className={`w-4 h-4 ${filterHasAction ? 'text-purple-500' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-500">Vinculadas</span>
            <span className="text-sm font-bold text-purple-600">{metrics.linked}</span>
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
          <button onClick={fetchNews} className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700">Reintentar</button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : news.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron noticias</p>
          <p className="text-sm">Prueba a cambiar los filtros o crea una nueva noticia.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {news.map(n => {
              const img = getImageUrl(n.thumbnail);
              const campaignName = campaignMap[n.campaignId]?.name || (n.actionId ? 'Vinculada' : 'General');
              return (
                <div
                  key={n.id}
                  onClick={() => router.push(`/admin/news/${n.id}/edit`)}
                  className={`relative bg-white rounded-2xl shadow-sm border cursor-pointer ${selected.includes(n.id) ? 'border-fuchsia-500 ring-2 ring-fuchsia-200' : 'border-gray-200'} hover:shadow-md hover:border-fuchsia-300 transition-shadow overflow-hidden flex flex-col`}
                >
                  <div className="relative h-36 bg-gray-100">
                    {img ? <img src={img} alt={n.title} className="w-full h-full object-cover" loading="lazy" /> :
                      <div className="w-full h-full flex items-center justify-center text-gray-400"><FaNewspaper className="w-8 h-8" /></div>}
                    {n.youtubeUrl && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow"><FaYoutube className="w-3 h-3" /></span>
                    )}
                    <label className="absolute top-2 left-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.includes(n.id)}
                        onChange={() => toggleOne(n.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500 bg-white shadow-sm"
                      />
                    </label>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg truncate mb-1">{n.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${n.isNews ? 'bg-fuchsia-100 text-fuchsia-800' : 'bg-gray-100 text-gray-700'}`}>
                        {n.isNews ? 'Noticia' : 'Artículo'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{campaignName}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {n.publishedAt ? new Date(n.publishedAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={s => { setItemsPerPage(s); setCurrentPage(1); }} />
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-fuchsia-50 to-fuchsia-100/60 border-b-2 border-fuchsia-200">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Noticia</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Campaña</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">YouTube</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Vinculada</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {news.map(n => {
                const campaignName = campaignMap[n.campaignId]?.name || 'General';
                return (
                  <tr key={n.id} onClick={e => handleRowClick(e, n.id)}
                    className={`hover:bg-fuchsia-50/50 cursor-pointer transition-colors ${selected.includes(n.id) ? 'bg-fuchsia-50' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selected.includes(n.id)}
                          onChange={() => toggleOne(n.id)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-fuchsia-600 mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{n.title}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{n.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{campaignName}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${n.isNews ? 'bg-fuchsia-100 text-fuchsia-800' : 'bg-gray-100 text-gray-700'}`}>
                        {n.isNews ? 'Noticia' : 'Artículo'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {n.youtubeUrl ? <FaYoutube className="text-red-500" /> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      {n.actionId ? <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">Sí</span> : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t px-4 py-3">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={s => { setItemsPerPage(s); setCurrentPage(1); }} />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminNews;
