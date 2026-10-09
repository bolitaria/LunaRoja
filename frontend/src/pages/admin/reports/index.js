// frontend/src/pages/admin/reports/index.js
import api from '../../../lib/axios';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import { exportInfo } from '../../../utils/exportInfo';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import {
  FaTrash, FaFileExport, FaSearch, FaTh, FaList,
  FaNewspaper, FaFileAlt, FaPaperclip, FaSlidersH,
  FaCalendarAlt, FaChevronDown, FaChevronUp, FaTimesCircle
} from 'react-icons/fa';

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterHasFileUrl, setFilterHasFileUrl] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterSource, setFilterSource] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [total, setTotal] = useState(0);
  const [metrics, setMetrics] = useState({ total: 0, blogs: 0, reports: 0, withFile: 0 });
  const [selected, setSelected] = useState([]);
  const [autoSelected, setAutoSelected] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportMenuRef = useRef(null);
  const lastSelectedIdRef = useRef(null);

  const fetchReports = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = { page: currentPage, limit: itemsPerPage };
      if (searchTerm) params.search = searchTerm;
      if (filterType) params.type = filterType;
      if (filterSource) params.source = filterSource;
      if (filterAuthor) params.author = filterAuthor;
      if (filterHasFileUrl) params.hasFileUrl = 'true';
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await api.get('/reports', { params });
      setReports(res.data.data || []);
      setTotal(res.data.total || 0);
      if (res.data.metrics) setMetrics(res.data.metrics);
    } catch (e) {
      console.error('Error fetching reports:', e);
      setError('No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage, itemsPerPage, searchTerm, filterType, filterSource,
    filterAuthor, filterHasFileUrl, dateFrom, dateTo,
  ]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && selected.length > 0) {
        setSelected([]); setAutoSelected(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected.length]);

  const totalPages = Math.ceil(total / itemsPerPage);

  const resetSelection = () => { setSelected([]); setAutoSelected(false); setCurrentPage(1); };
  const handleFilterChange = (setter) => (value) => { resetSelection(); setter(value); };
  const toggleHasFileUrl = () => { resetSelection(); setFilterHasFileUrl(p => !p); };

  const toggleMetric = (type) => {
    resetSelection();
    if (type === 'total') { setFilterType(''); setFilterHasFileUrl(false); }
    else if (type === 'blog') { setFilterType(prev => prev === 'blog' ? '' : 'blog'); }
    else if (type === 'report') { setFilterType(prev => prev === 'report' ? '' : 'report'); }
    else if (type === 'file') { setFilterHasFileUrl(p => !p); }
  };

  const clearAllFilters = () => {
    resetSelection();
    setSearchTerm(''); setFilterType(''); setFilterSource(''); setFilterAuthor('');
    setFilterHasFileUrl(false); setDateFrom(''); setDateTo(''); setShowDateFilter(false);
  };

  const handleDeleteSelected = () => { if (selected.length === 0) return; setDeleteTarget(selected); setShowDeleteModal(true); };

  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/reports/${id}`)));
      toast.success(`${ids.length} reporte(s) eliminado(s)`);
      setSelected([]); setAutoSelected(false); fetchReports();
    } catch (e) { toast.error('Error al eliminar'); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  };

  const exportData = (format) => {
    const source = selected.length > 0 ? reports.filter(r => selected.includes(r.id)) : reports;
    const headers = ['title', 'type', 'publishedAt', 'source', 'author', 'hasFile'];
    const data = source.map(r => ({
      title: r.title,
      type: r.type === 'blog' ? 'Blog' : 'Reporte',
      publishedAt: r.publishedAt ? new Date(r.publishedAt).toLocaleString() : '',
      source: r.source || '',
      author: r.author || '',
      hasFile: r.fileUrl ? 'Sí' : 'No',
    }));
    exportInfo(data, headers, 'reportes', format);
    setShowExportOptions(false);
  };

  const handleRowClick = (e, id) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input[type="checkbox"]')) return;
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    setAutoSelected(false);
    if (isShift) {
      const ci = reports.findIndex(x => x.id === id);
      const li = reports.findIndex(x => x.id === lastSelectedIdRef.current);
      if (li >= 0 && ci >= 0) {
        const [s, e2] = [Math.min(li, ci), Math.max(li, ci)];
        const rangeIds = reports.slice(s, e2 + 1).map(x => x.id);
        setSelected(prev => Array.from(new Set([...prev, ...rangeIds])));
      }
    } else if (isCtrl) {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else {
      router.push(`/admin/reports/${id}`);
    }
    lastSelectedIdRef.current = id;
  };

  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setAutoSelected(false);
  };

  const hasActiveFilters = searchTerm || filterType || filterSource || filterAuthor || filterHasFileUrl || dateFrom || dateTo;
  const canCreate = user && ['superadmin', 'blog_admin', 'campaign_admin'].includes(user.role);

  return (
    <AdminLayout title="Reportes">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar reporte"
        message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} reportes?` : '¿Eliminar este reporte?')}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      <div className="mb-5">
        {canCreate && (
          <Link href="/admin/reports/new" className="inline-flex items-center gap-2 text-lg font-semibold border-2 border-fuchsia-300 text-fuchsia-700 bg-white px-7 py-3.5 rounded-xl hover:bg-fuchsia-50 transition-colors shadow-md">
            <FaFileAlt className="w-5 h-5" /> Nuevo Reporte
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

          <select value={filterType} onChange={e => handleFilterChange(setFilterType)(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-fuchsia-400">
            <option value="">Todos los tipos</option>
            <option value="blog">Blog</option>
            <option value="report">Reporte</option>
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

            <input type="text" placeholder="Fuente..." value={filterSource}
              onChange={e => handleFilterChange(setFilterSource)(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-fuchsia-400 w-40" />

            <input type="text" placeholder="Autor..." value={filterAuthor}
              onChange={e => handleFilterChange(setFilterAuthor)(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-fuchsia-400 w-40" />

            <button onClick={toggleHasFileUrl}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${filterHasFileUrl ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              <FaPaperclip className={filterHasFileUrl ? 'text-blue-600' : 'text-gray-400'} /> Con adjunto
            </button>
          </div>
        )}

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Búsqueda: {searchTerm}
                <button onClick={() => setSearchTerm('')}><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterType && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Tipo: {filterType === 'blog' ? 'Blog' : 'Reporte'}
                <button onClick={() => setFilterType('')}><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterSource && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Fuente: {filterSource}
                <button onClick={() => setFilterSource('')}><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterAuthor && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Autor: {filterAuthor}
                <button onClick={() => setFilterAuthor('')}><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterHasFileUrl && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">
                Con adjunto <button onClick={toggleHasFileUrl}><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearAllFilters} className="text-xs font-medium text-red-600 hover:text-red-800 underline ml-2">Limpiar todo</button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4 pl-6">
        <div className="flex items-center gap-2">
          <button onClick={() => { setViewMode('grid'); setCurrentPage(1); }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${viewMode === 'grid' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            <FaTh className="w-4 h-4" /> Mosaico
          </button>
          <button onClick={() => { setViewMode('table'); setCurrentPage(1); }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${viewMode === 'table' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            <FaList className="w-4 h-4" /> Tabla
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => toggleMetric('total')} aria-pressed={!filterType && !filterHasFileUrl}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all ${!filterType && !filterHasFileUrl ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200 hover:border-gray-300'}`}>
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-sm font-bold text-gray-800">{metrics.total}</span>
          </button>
          <button onClick={() => toggleMetric('blog')} aria-pressed={filterType === 'blog'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all ${filterType === 'blog' ? 'border-fuchsia-400 ring-2 ring-fuchsia-200' : 'border-gray-200 hover:border-gray-300'}`}>
            <FaNewspaper className={`w-4 h-4 ${filterType === 'blog' ? 'text-fuchsia-500' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-500">Blog</span>
            <span className="text-sm font-bold text-fuchsia-600">{metrics.blogs}</span>
          </button>
          <button onClick={() => toggleMetric('report')} aria-pressed={filterType === 'report'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all ${filterType === 'report' ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}>
            <FaFileAlt className={`w-4 h-4 ${filterType === 'report' ? 'text-blue-500' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-500">Reporte</span>
            <span className="text-sm font-bold text-blue-600">{metrics.reports}</span>
          </button>
          <button onClick={() => toggleMetric('file')} aria-pressed={filterHasFileUrl}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all ${filterHasFileUrl ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-gray-300'}`}>
            <FaPaperclip className={`w-4 h-4 ${filterHasFileUrl ? 'text-emerald-500' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-500">Adjunto</span>
            <span className="text-sm font-bold text-emerald-600">{metrics.withFile}</span>
          </button>
        </div>
      </div>

      {selected.length > 0 && !autoSelected && (
        <div className="flex justify-end items-center gap-2 mb-4">
          <button onClick={() => { setSelected([]); setAutoSelected(false); }}
            className="inline-flex items-center gap-2 text-sm bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm">
            Limpiar selección
          </button>
          <button onClick={handleDeleteSelected}
            className="inline-flex items-center gap-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 shadow-sm">
            <FaTrash className="w-4 h-4" /> Eliminar ({selected.length})
          </button>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">{error}</p>
          <button onClick={fetchReports} className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg">Reintentar</button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron reportes</p>
          <p className="text-sm">Prueba a cambiar los filtros o crea uno nuevo.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ml-8">
            {reports.map(r => (
              <div key={r.id} onClick={() => router.push(`/admin/reports/${r.id}`)}
                className={`relative bg-white rounded-2xl shadow-sm border cursor-pointer ${selected.includes(r.id) ? 'border-fuchsia-500 ring-2 ring-fuchsia-200' : 'border-gray-200'} hover:shadow-md hover:border-fuchsia-300 transition-shadow overflow-hidden flex flex-col`}>
                <div className="relative h-36 bg-gradient-to-br from-fuchsia-100 to-blue-100 flex items-center justify-center">
                  {r.type === 'blog'
                    ? <FaNewspaper className="w-12 h-12 text-fuchsia-400" />
                    : <FaFileAlt className="w-12 h-12 text-blue-400" />}
                  {r.fileUrl && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow">
                      <FaPaperclip className="w-3 h-3" />
                    </span>
                  )}
                  <label className="absolute top-2 left-2 cursor-pointer">
                    <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleOne(r.id)} onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500 bg-white shadow-sm" />
                  </label>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg truncate mb-1">{r.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.type === 'blog' ? 'bg-fuchsia-100 text-fuchsia-800' : 'bg-blue-100 text-blue-800'}`}>
                      {r.type === 'blog' ? 'Blog' : 'Reporte'}
                    </span>
                    {r.source && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 truncate">{r.source}</span>}
                  </div>
                  <p className="text-xs text-gray-500">
                    {r.publishedAt ? new Date(r.publishedAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={s => { setItemsPerPage(s); setCurrentPage(1); }} />
        </>
      ) : (
        <>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ml-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-fuchsia-50 to-fuchsia-100/60 border-b-2 border-fuchsia-200">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Título</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Fuente</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Autor</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-fuchsia-900/80 uppercase tracking-wider">Adjunto</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {reports.map(r => (
                <tr key={r.id} onClick={e => handleRowClick(e, r.id)}
                  className={`hover:bg-fuchsia-50/50 cursor-pointer ${selected.includes(r.id) ? 'bg-fuchsia-50' : ''}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleOne(r.id)} onClick={e => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-fuchsia-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{r.title}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{r.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${r.type === 'blog' ? 'bg-fuchsia-100 text-fuchsia-800' : 'bg-blue-100 text-blue-800'}`}>
                      {r.type === 'blog' ? 'Blog' : 'Reporte'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{r.source || '—'}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{r.author || '—'}</td>
                  <td className="px-4 py-4">
                    {r.fileUrl
                      ? <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" onClick={e => e.stopPropagation()}><FaPaperclip /></a>
                      : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t px-4 py-3 mt-auto">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={s => { setItemsPerPage(s); setCurrentPage(1); }} />
        </div>
        </>
      )}
    </AdminLayout>
  );
}

export default AdminReports;
