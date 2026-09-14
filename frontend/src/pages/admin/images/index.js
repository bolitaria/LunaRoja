import api from '../../../lib/axios';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { exportInfo } from '../../../utils/exportInfo';
import { FaFileExport, FaSearch, FaTrash, FaImage, FaTimes, FaBolt, FaBullhorn, FaPenFancy, FaHandshake } from 'react-icons/fa';
import ConfirmModal from '../../../components/ConfirmModal';

const typeLabels = {
  action: 'Acción',
  campaign: 'Campaña',
  bds: 'Campaña BDS',
  report: 'Blog/Reporte',
  news: 'Noticia',
  petition: 'Firma Petición',
  link: 'Link de interés',
  colectivo: 'Colectivo Afín',
};

const typeColors = {
  action: 'bg-orange-100 text-orange-800',
  campaign: 'bg-blue-100 text-blue-800',
  bds: 'bg-purple-100 text-purple-800',
  report: 'bg-pink-100 text-pink-800',
  news: 'bg-emerald-100 text-emerald-800',
  petition: 'bg-amber-100 text-amber-800',
  link: 'bg-cyan-100 text-cyan-800',
  colectivo: 'bg-lime-100 text-lime-800',
};

// Iconos para las píldoras rápidas
const quickFilterIcons = {
  all: <FaImage className="w-4 h-4" />,
  action: <FaBolt className="w-4 h-4" />,
  campaign: <FaBullhorn className="w-4 h-4" />,
  bds: <FaBullhorn className="w-4 h-4" />,
  petition: <FaPenFancy className="w-4 h-4" />,
  colectivo: <FaHandshake className="w-4 h-4" />,
};

export default function AdminImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');

  // Filtros
  const [filterType, setFilterType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType !== 'all') params.type = filterType;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await api.get('/images', { params });
      setImages(res.data);
    } catch (err) {
      toast.error('Error al cargar imágenes');
    } finally {
      setLoading(false);
    }
  }, [filterType, dateFrom, dateTo, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const grouped = useMemo(() => {
    const groups = {};
    images.forEach(img => {
      const type = img.relatedType || 'unknown';
      const title = img.relatedTitle || 'Sin título';
      const key = `${type}|||${title}`;
      if (!groups[key]) {
        groups[key] = { type, title, images: [] };
      }
      groups[key].images.push(img);
    });
    return Object.values(groups);
  }, [images]);

  const totalFiltered = images.length;
  const totalGroups = grouped.length;

  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleDeleteSelected = () => {
    if (selected.length === 0) return;
    setDeleteTarget(selected);
    setShowDeleteModal(true);
  };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/images/${id}`)));
      toast.success(`${ids.length} imagen(es) eliminada(s)`);
      setSelected([]);
      fetchImages();
    } catch (err) {
      toast.error('Error al eliminar');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const exportCollection = () => {
    const headers = ['id', 'url', 'relatedTitle', 'relatedType', 'createdAt'];
    const data = images.map(img => ({
      id: img.id,
      url: img.url,
      relatedTitle: img.relatedTitle || '',
      relatedType: typeLabels[img.relatedType] || img.relatedType,
      createdAt: new Date(img.createdAt).toLocaleString(),
    }));
    exportInfo(data, headers, 'coleccion_imagenes', exportFormat);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setDateFrom('');
    setDateTo('');
  };

  const setQuickFilter = (type) => setFilterType(type);

  const activeFilterChips = [
    filterType !== 'all' && { key: 'type', label: typeLabels[filterType] || filterType, onRemove: () => setFilterType('all') },
    dateFrom && { key: 'from', label: `Desde ${dateFrom}`, onRemove: () => setDateFrom('') },
    dateTo && { key: 'to', label: `Hasta ${dateTo}`, onRemove: () => setDateTo('') },
    debouncedSearch && { key: 'search', label: `Buscar: ${debouncedSearch}`, onRemove: () => setSearchTerm('') },
  ].filter(Boolean);

  return (
    <AdminLayout title="Galería de Imágenes">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar imagen"
        message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} imágenes?` : '¿Eliminar esta imagen?')}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      {/* Panel de filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-5 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[220px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Buscar por nombre de ${filterType === 'all' ? 'campaña, acción, BDS...' : typeLabels[filterType]?.toLowerCase() + '...'}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent text-sm w-full"
            />
          </div>

          {/* Píldoras de filtro rápido */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setQuickFilter('all')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${filterType === 'all' ? 'bg-fuchsia-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {quickFilterIcons.all} Todas
            </button>
            <button
              onClick={() => setQuickFilter('action')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${filterType === 'action' ? 'bg-fuchsia-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {quickFilterIcons.action} Acciones
            </button>
            <button
              onClick={() => setQuickFilter('campaign')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${filterType === 'campaign' ? 'bg-fuchsia-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {quickFilterIcons.campaign} Campañas
            </button>
            <button
              onClick={() => setQuickFilter('bds')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${filterType === 'bds' ? 'bg-fuchsia-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {quickFilterIcons.bds} Campañas BDS
            </button>
            <button
              onClick={() => setQuickFilter('petition')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${filterType === 'petition' ? 'bg-fuchsia-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {quickFilterIcons.petition} Firmar Peticiones
            </button>
            <button
              onClick={() => setQuickFilter('colectivo')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${filterType === 'colectivo' ? 'bg-fuchsia-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {quickFilterIcons.colectivo} Colectivos Afines
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-fuchsia-400"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-500">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-fuchsia-400"
            />
          </div>

          {activeFilterChips.length > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="w-3 h-3" /> Limpiar filtros
            </button>
          )}
        </div>

        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {activeFilterChips.map(chip => (
              <span key={chip.key} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                {chip.label}
                <button onClick={chip.onRemove} className="text-gray-400 hover:text-gray-600">
                  <FaTimes className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            <span className="font-bold">{totalFiltered}</span> imágenes en <span className="font-bold">{totalGroups}</span> grupos
          </div>
          <div className="flex items-center gap-3">
            {selected.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaTrash /> Eliminar ({selected.length})
              </button>
            )}
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="txt">Texto</option>
            </select>
            <button
              onClick={exportCollection}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              title="Exportar colección filtrada"
            >
              <FaFileExport className="w-4 h-4" /> Exportar colección
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : grouped.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FaImage className="mx-auto text-4xl mb-3" />
          <p className="text-lg">No se encontraron imágenes</p>
          <p className="text-sm">Ajusta los filtros o sube imágenes desde acciones/campañas.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-300 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[group.type] || 'bg-gray-100 text-gray-800'}`}>
                    {typeLabels[group.type] || group.type}
                  </span>
                  {group.title}
                  <span className="text-sm font-normal text-gray-500">({group.images.length})</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {group.images.map(img => (
                  <div
                    key={img.id}
                    className={`relative group bg-gray-50 rounded-lg overflow-hidden border transition-shadow ${selected.includes(img.id) ? 'border-fuchsia-500 ring-2 ring-fuchsia-200' : 'border-gray-200 hover:shadow-md'}`}
                  >
                    <div className="aspect-square bg-gray-100 relative">
                      <img
                        src={img.url}
                        alt={img.relatedTitle || 'Imagen'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <input
                        type="checkbox"
                        checked={selected.includes(img.id)}
                        onChange={() => toggleOne(img.id)}
                        className="absolute top-2 left-2 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
                        aria-label={`Seleccionar imagen ${img.relatedTitle || img.id}`}
                      />
                    </div>
                    <div className="p-2 text-xs">
                      <p className="font-medium text-gray-700 truncate">{img.relatedTitle || 'Sin título'}</p>
                      <p className="text-gray-500">{new Date(img.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}