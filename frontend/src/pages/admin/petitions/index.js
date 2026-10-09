// frontend/src/pages/admin/petitions/index.js
import api from '../../../lib/axios';
import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { exportInfo } from '../../../utils/exportInfo';
import { exportPetitionsToPDF } from '../../../utils/exportPetitionsPdf';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import ViewToggle from '../../../components/ViewToggle';
import PetitionCard from '../../../components/PetitionCard';
import {
  FaEye, FaEyeSlash, FaTrash, FaSearch, FaEdit, FaFileExport,
  FaFire, FaLock, FaUnlock, FaSlidersH, FaCalendarAlt,
  FaChevronDown, FaChevronUp, FaTimesCircle, FaBullhorn
} from 'react-icons/fa';

function AdminPetitions() {
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vista mosaico/lista (persistida en localStorage)
  const [viewMode, setViewModeRaw] = useState(() => {
    if (typeof window === 'undefined') return 'table';
    return localStorage.getItem('admin.petitions.viewMode') || 'table';
  });
  const setViewMode = (mode) => {
    setViewModeRaw(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin.petitions.viewMode', mode);
    }
  };
  const { user } = useAuth();

  // Filtros principales
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterHidden, setFilterHidden] = useState('all');
  const [minSignatures, setMinSignatures] = useState('');

  // Filtros avanzados
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCreatedDate, setShowCreatedDate] = useState(false);
  const [showDeadlineDate, setShowDeadlineDate] = useState(false);
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [deadlineFrom, setDeadlineFrom] = useState('');
  const [deadlineTo, setDeadlineTo] = useState('');

  // Paginación y selección
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [total, setTotal] = useState(0);
  const [metrics, setMetrics] = useState({ total: 0, urgent: 0, official: 0, public_count: 0, total_signatures: 0 });
  const [quota, setQuota] = useState(null);

  // Cargar cuota diaria de emails (solo una vez)
  useEffect(() => {
    let cancelled = false;
    const fetchQuota = async () => {
      try {
        const res = await api.get('/petitions/quota/today');
        if (!cancelled) setQuota(res.data);
      } catch (err) {
        // Silencioso: si falla, simplemente no se muestra la barra
        console.warn('No se pudo cargar la cuota de emails:', err.message);
      }
    };
    fetchQuota();
    return () => { cancelled = true; };
  }, []);

  const [selected, setSelected] = useState([]);
  const [autoSelected, setAutoSelected] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportMenuRef = useRef(null);
  const lastSelectedIdRef = useRef(null);

  const fetchPetitions = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (searchTerm) params.search = searchTerm;
      if (filterUrgency) params.urgency = 'true';
      if (filterType !== 'all') params.type = filterType;
      if (filterHidden === 'visible') params.hidden = 'false';
      if (filterHidden === 'hidden') params.hidden = 'true';
      if (minSignatures) params.minSignatures = minSignatures;
      if (createdFrom) params.createdFrom = createdFrom;
      if (createdTo) params.createdTo = createdTo;
      if (deadlineFrom) params.deadlineFrom = deadlineFrom;
      if (deadlineTo) params.deadlineTo = deadlineTo;

      const res = await api.get('/petitions', { params });
      const payload = res.data;
      setPetitions(payload.data || []);
      setTotal(payload.total || 0);
      if (payload.metrics) {
        setMetrics(payload.metrics);
      }
    } catch (error) {
      console.error('Error fetching petitions:', error);
      setError('No se pudieron cargar las peticiones');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage, itemsPerPage, searchTerm, filterUrgency, filterType,
    filterHidden, minSignatures, createdFrom, createdTo, deadlineFrom, deadlineTo,
  ]);

  useEffect(() => {
    fetchPetitions();
  }, [fetchPetitions]);

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

  const setTypeFilter = (value) => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    setFilterType(prev => prev === value ? 'all' : value);
  };

  const setHiddenFilter = (value) => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    setFilterHidden(prev => prev === value ? 'all' : value);
  };

  const clearAllFilters = () => {
    setCurrentPage(1);
    setSelected([]);
    setAutoSelected(false);
    setSearchTerm('');
    setFilterUrgency(false);
    setFilterType('all');
    setFilterHidden('all');
    setMinSignatures('');
    setCreatedFrom('');
    setCreatedTo('');
    setDeadlineFrom('');
    setDeadlineTo('');
    setShowCreatedDate(false);
    setShowDeadlineDate(false);
  };

  const handleDeleteSelected = () => {
    if (selected.length === 0) return;
    setDeleteTarget(selected);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/petitions/${id}`)));
      toast.success(`${ids.length} petición(es) eliminada(s)`);
      setSelected([]);
      setAutoSelected(false);
      fetchPetitions();
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const toggleHidden = async (id, currentHidden) => {
    try {
      await api.put(`/petitions/${id}`, { hidden: !currentHidden });
      toast.success(`Petición ${currentHidden ? 'visible' : 'oculta'} correctamente`);
      fetchPetitions();
    } catch (err) {
      toast.error('No se pudo cambiar la visibilidad');
    }
  };

  const exportData = (format) => {
    const source = selected.length > 0 ? petitions.filter(p => selected.includes(p.id)) : petitions;
    const headers = ['title', 'type', 'urgency', 'total_signatures', 'hidden', 'createdAt'];
    const data = source.map(p => ({
      title: p.title,
      type: p.type === 'official' ? 'Peticiones Externas' : 'Peticiones Internas',
      urgency: p.urgency ? 'Sí' : 'No',
      total_signatures: p.total_signatures || 0,
      hidden: p.hidden ? 'Sí' : 'No',
      createdAt: new Date(p.created_at).toLocaleDateString(),
    }));
    exportInfo(data, headers, 'peticiones', format);
    setShowExportOptions(false);
  };

  const exportDataPDF = async () => {
    const source = selected.length > 0
      ? petitions.filter(p => selected.includes(p.id))
      : petitions;

    if (source.length === 0) {
      toast.warning('No hay peticiones para exportar');
      return;
    }

    setShowExportOptions(false);
    const t = toast.loading(`Generando PDF (${source.length} peticiones)...`);

    try {
      await exportPetitionsToPDF(source, `peticiones_${Date.now()}.pdf`);
      toast.update(t, {
        render: '✅ PDF generado',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.update(t, {
        render: '❌ Error al generar PDF',
        type: 'error',
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  const handleRowClick = (e, petitionId) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    setAutoSelected(false);
    if (isShift) {
      const currentIndex = petitions.findIndex(p => p.id === petitionId);
      const lastIndex = petitions.findIndex(p => p.id === lastSelectedIdRef.current);
      if (lastIndex >= 0 && currentIndex >= 0) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = petitions.slice(start, end + 1).map(p => p.id);
        setSelected(prev => Array.from(new Set([...prev, ...rangeIds])));
      }
    } else if (isCtrl) {
      setSelected(prev => prev.includes(petitionId) ? prev.filter(id => id !== petitionId) : [...prev, petitionId]);
    } else {
      setSelected([petitionId]);
    }
    lastSelectedIdRef.current = petitionId;
  };

  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setAutoSelected(false);
  };

  const totalPages = Math.ceil(total / itemsPerPage);
  const hasActiveFilters = searchTerm || filterUrgency || filterType !== 'all' || filterHidden !== 'all' || minSignatures || createdFrom || createdTo || deadlineFrom || deadlineTo;

  return (
    <AdminLayout title="Firma Peticiones">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar petición"
        message={Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} peticiones?` : '¿Eliminar esta petición?'}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      <div className="mb-5">
        <Link href="/admin/petitions/new" className="inline-flex items-center gap-2 text-lg font-semibold border-2 border-fuchsia-300 text-fuchsia-700 bg-white px-7 py-3.5 rounded-xl hover:bg-fuchsia-50 transition-colors shadow-md">
          <span className="text-lg">✍️</span> Nueva Petición
        </Link>
      </div>

      {/* Barra de filtros principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-56">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar peticiones..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm)(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-fuchsia-400 text-sm w-full"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => handleFilterChange(setFilterType)(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
          >
            <option value="all">Todos los tipos</option>
            <option value="official">Peticiones Externas</option>
            <option value="custom">Peticiones Internas</option>
          </select>

          <select
            value={filterHidden}
            onChange={(e) => handleFilterChange(setFilterHidden)(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
          >
            <option value="all">Todas</option>
            <option value="visible">Visibles</option>
            <option value="hidden">Ocultas</option>
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
                <button onClick={exportDataPDF} className="block w-full text-left px-3 py-1.5 text-sm text-fuchsia-700 font-medium hover:bg-fuchsia-50 border-t border-gray-100">📄 PDF (vista pública)</button>
              </div>
            )}
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-start gap-5">
            {/* Fecha de creación */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowCreatedDate(!showCreatedDate)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 focus:outline-none"
              >
                <FaCalendarAlt className="text-gray-400" />
                Creación
                {showCreatedDate ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
              </button>
              {showCreatedDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600 pl-2">
                  <input type="date" value={createdFrom} onChange={(e) => handleFilterChange(setCreatedFrom)(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-fuchsia-400" />
                  <span className="text-gray-400">—</span>
                  <input type="date" value={createdTo} onChange={(e) => handleFilterChange(setCreatedTo)(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-fuchsia-400" />
                </div>
              )}
            </div>

            {/* Fecha límite */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowDeadlineDate(!showDeadlineDate)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 focus:outline-none"
              >
                <FaCalendarAlt className="text-gray-400" />
                Fecha límite
                {showDeadlineDate ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
              </button>
              {showDeadlineDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600 pl-2">
                  <input type="date" value={deadlineFrom} onChange={(e) => handleFilterChange(setDeadlineFrom)(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-fuchsia-400" />
                  <span className="text-gray-400">—</span>
                  <input type="date" value={deadlineTo} onChange={(e) => handleFilterChange(setDeadlineTo)(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-fuchsia-400" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <label className="text-xs text-gray-400">Firmas ≥</label>
              <input
                type="number"
                min="0"
                value={minSignatures}
                onChange={(e) => handleFilterChange(setMinSignatures)(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 text-xs w-20 focus:outline-none focus:border-fuchsia-400"
              />
            </div>
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
            {filterType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                {filterType === 'official' ? 'Peticiones Externas' : 'Peticiones Internas'}
                <button onClick={() => setFilterType('all')} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {filterHidden !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                {filterHidden === 'visible' ? 'Visibles' : 'Ocultas'}
                <button onClick={() => setFilterHidden('all')} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {minSignatures && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Firmas ≥ {minSignatures}
                <button onClick={() => setMinSignatures('')} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {(createdFrom || createdTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Creación: {createdFrom || '...'} → {createdTo || '...'}
                <button onClick={() => { setCreatedFrom(''); setCreatedTo(''); }} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
              </span>
            )}
            {(deadlineFrom || deadlineTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Límite: {deadlineFrom || '...'} → {deadlineTo || '...'}
                <button onClick={() => { setDeadlineFrom(''); setDeadlineTo(''); }} className="text-gray-400 hover:text-red-600"><FaTimesCircle className="w-3 h-3" /></button>
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

      {/* Barra de cuota de emails (solo si se cargó) */}
      {quota && (
        <div className="mb-4 bg-white rounded-2xl shadow-sm border border-gray-300 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Emails hoy: <span className="font-bold">{quota.count}</span> / {quota.limit}
                </p>
                <p className="text-xs text-gray-500">
                  Se resetea a las 00:05 Europe/Madrid
                </p>
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    quota.percentage >= 100
                      ? 'bg-red-600'
                      : quota.percentage >= 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, quota.percentage)}%` }}
                />
              </div>
              <p className={`text-xs mt-1 text-right font-medium ${
                quota.percentage >= 100
                  ? 'text-red-700'
                  : quota.percentage >= 80
                    ? 'text-yellow-700'
                    : 'text-green-700'
              }`}>
                {quota.percentage}% utilizado
                {quota.remaining > 0 ? ` · ${quota.remaining} restantes` : ''}
              </p>
            </div>

            {quota.percentage >= 100 && (
              <div className="w-full bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-800">
                ⚠️ Cuota diaria agotada. Los emails se encolarán automáticamente para mañana.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control de métricas */}
      <div className="flex items-center justify-end mb-4 pl-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setFilterUrgency(false); setFilterType('all'); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${!filterUrgency && filterType === 'all' ? 'border-fuchsia-400 ring-2 ring-fuchsia-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-sm font-bold text-gray-800">{metrics.total}</span>
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
            onClick={() => setTypeFilter('official')}
            aria-pressed={filterType === 'official'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${filterType === 'official' ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <FaBullhorn className={`w-4 h-4 ${filterType === 'official' ? 'text-blue-500' : 'text-gray-400'}`} />
            <span className="text-sm text-blue-600">Externas</span>
            <span className="text-sm font-bold text-blue-700">{metrics.official}</span>
          </button>

          <button
            onClick={() => setHiddenFilter('visible')}
            aria-pressed={filterHidden === 'visible'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all focus:outline-none ${filterHidden === 'visible' ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <FaUnlock className={`w-4 h-4 ${filterHidden === 'visible' ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-sm text-green-600">Públicas</span>
            <span className="text-sm font-bold text-green-700">{metrics.public_count}</span>
          </button>
        </div>
      </div>

      {selected.length > 0 && !autoSelected && (
        <div className="flex justify-end mb-4">
          <button onClick={handleDeleteSelected} className="inline-flex items-center gap-2 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors focus:outline-none shadow-sm">
            <FaTrash className="w-4 h-4" /> Eliminar ({selected.length})
          </button>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">{error}</p>
          <button onClick={fetchPetitions} className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700">Reintentar</button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : petitions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron peticiones</p>
          <p className="text-sm">Crea una nueva petición para empezar.</p>
        </div>
      ) : (
        <>
        {/* Toggle vista mosaico/lista */}
        <div className="flex justify-end mb-3">
          <ViewToggle viewMode={viewMode} onChange={setViewMode} accentColor="fuchsia" />
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {petitions.map(p => (
              <PetitionCard
                key={p.id}
                petition={p}
                onToggleHidden={toggleHidden}
              />
            ))}
          </div>
        ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-700 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-left">Acciones</th>
                <th className="px-6 py-3 text-left">Título</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Tipo</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Urgencia</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Firmas</th>
                <th className="px-6 py-3 text-left">Visible</th>
                <th className="px-6 py-3 text-right w-10">
                  <input type="checkbox" onChange={(e) => { if (e.target.checked) setSelected(petitions.map(p => p.id)); else setSelected([]); }} checked={petitions.length > 0 && selected.length === petitions.length} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {petitions.map(p => (
                <tr key={p.id} onClick={(e) => handleRowClick(e, p.id)} className={`hover:bg-gray-50 transition-colors cursor-pointer ${selected.includes(p.id) ? 'bg-fuchsia-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <a href={`/peticiones/${p.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Ver página pública">
                        <FaEye className="w-5 h-5" />
                      </a>
                      {p.total_signatures === 0 && (
                        <Link href={`/admin/petitions/${p.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <FaEdit className="w-5 h-5" />
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      {(p.featured_image || p.imageUrl) && (
                        <img
                          src={p.featured_image || p.imageUrl}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-200"
                        />
                      )}
                      <span>{p.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{p.type === 'official' ? 'Peticiones Externas' : 'Peticiones Internas'}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{p.urgency ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium"><FaFire className="w-3 h-3" /> Urgente</span> : '—'}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{p.total_signatures}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleHidden(p.id, p.hidden); }}
                      className={`p-1.5 rounded-lg ${p.hidden ? 'text-gray-400 hover:text-yellow-600' : 'text-green-600 hover:text-green-800'}`}
                      title={p.hidden ? 'Mostrar al público' : 'Ocultar al público'}
                    >
                      {p.hidden ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={(e) => { e.stopPropagation(); toggleOne(p.id); }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        <div className="border-t border-gray-200 px-4 py-3 mt-auto">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }} />
        </div>
        </>
      )}
    </AdminLayout>
  );
}

export default AdminPetitions;