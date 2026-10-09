import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import api from '../../../lib/axios';
import Link from 'next/link';
import { FaTh, FaList, FaSearch, FaFileExport } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LinkCard from '../../../components/LinkCard';
import { LINK_REGIONS } from '../../../utils/linkRegions';
import { exportInfo } from '../../../utils/exportInfo';

const CATEGORY_LABELS = {
  local: 'Local',
  nacional: 'Nacional',
  europeo: 'Europeo',
  internacional: 'Internacional',
  literatura: 'Literatura',
  bibliografia: 'Bibliografía',
};

export default function AdminLinksIndex() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vista mosaico/lista (persistida)
  const [viewMode, setViewModeRaw] = useState(() => {
    if (typeof window === 'undefined') return 'table';
    return localStorage.getItem('admin.links.viewMode') || 'table';
  });
  const setViewMode = (mode) => {
    setViewModeRaw(mode);
    if (typeof window !== 'undefined') localStorage.setItem('admin.links.viewMode', mode);
  };

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [exportFormat, setExportFormat] = useState('csv');

  const fetchLinks = async () => {
    try {
      const res = await api.get('/links');
      const data = res.data?.data ?? res.data;
      setLinks(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Error al cargar enlaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLinks(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este enlace?')) return;
    try {
      await api.delete(`/links/${id}`);
      toast.success('Enlace eliminado');
      fetchLinks();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  // Filtrado
  const filtered = useMemo(() => {
    return links.filter(l => {
      if (searchTerm && !l.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterCategory && l.category !== filterCategory) return false;
      if (filterRegion && l.region !== filterRegion) return false;
      if (filterActive === 'active' && !l.active) return false;
      if (filterActive === 'inactive' && l.active) return false;
      return true;
    });
  }, [links, searchTerm, filterCategory, filterRegion, filterActive]);

  // Métricas
  const total = links.length;
  const activeCount = links.filter(l => l.active).length;
  const inactiveCount = total - activeCount;
  const internationalCount = links.filter(l => l.category === 'internacional').length;
  const literaturaCount = links.filter(l => l.category === 'literatura' || l.category === 'bibliografia').length;

  const hasActiveFilters = searchTerm || filterCategory || filterRegion || filterActive;

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterRegion('');
    setFilterActive('');
  };

  const exportCSV = () => {
    const headers = ['title', 'category', 'region', 'url', 'active'];
    const data = filtered.map(l => ({
      title: l.title,
      category: CATEGORY_LABELS[l.category] || l.category,
      region: l.region || '',
      url: l.url,
      active: l.active ? 'Sí' : 'No',
    }));
    exportInfo(data, headers, 'links_interes', exportFormat);
  };

  return (
    <AdminLayout title="Links de interés">
      <ToastContainer />

      {/* BLOQUE 1: botón nuevo (fila propia) */}
      <div className="mb-5">
        <Link href="/admin/links/new" className="inline-flex items-center gap-2 text-lg font-semibold border-2 border-fuchsia-300 text-fuchsia-700 bg-white px-7 py-3.5 rounded-xl hover:bg-fuchsia-50 transition-colors shadow-md">
          <span className="text-lg">🔗</span> Nuevo enlace
        </Link>
      </div>

      {/* BLOQUE 2: barra de filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-56">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar enlace..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:border-fuchsia-400 text-sm w-full"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
          >
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
          >
            <option value="">Todas las regiones</option>
            {LINK_REGIONS.map(r => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>

          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-fuchsia-400"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          <div className="relative ml-auto flex items-center gap-2">
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="txt">Texto</option>
            </select>
            <button onClick={exportCSV} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors" title="Exportar">
              <FaFileExport className="w-4 h-4" /> Exportar
            </button>
          </div>
        </div>

        {/* Chips de filtros activos */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Búsqueda: {searchTerm}
                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-red-600">✕</button>
              </span>
            )}
            {filterCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Categoría: {CATEGORY_LABELS[filterCategory]}
                <button onClick={() => setFilterCategory('')} className="text-gray-400 hover:text-red-600">✕</button>
              </span>
            )}
            {filterRegion && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Región: {LINK_REGIONS.find(r => r.key === filterRegion)?.label}
                <button onClick={() => setFilterRegion('')} className="text-gray-400 hover:text-red-600">✕</button>
              </span>
            )}
            {filterActive && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                Estado: {filterActive === 'active' ? 'Activos' : 'Inactivos'}
                <button onClick={() => setFilterActive('')} className="text-gray-400 hover:text-red-600">✕</button>
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

      {/* BLOQUE 3: barra de control de vista + métricas */}
      <div className="flex items-center justify-between mb-4 pl-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors focus:outline-none ${viewMode === 'grid' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            <FaTh className="w-4 h-4" /> Mosaico
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors focus:outline-none ${viewMode === 'table' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            <FaList className="w-4 h-4" /> Tabla
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setFilterActive(''); setCurrentPage && setCurrentPage(1); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm border-gray-200 hover:border-gray-300"
          >
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-sm font-bold text-gray-800">{total}</span>
          </button>
          <button
            onClick={() => setFilterActive('active')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all ${filterActive === 'active' ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="text-sm text-green-600">Activos</span>
            <span className="text-sm font-bold text-green-700">{activeCount}</span>
          </button>
          <button
            onClick={() => setFilterActive('inactive')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all ${filterActive === 'inactive' ? 'border-gray-400 ring-2 ring-gray-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="text-sm text-gray-500">Inactivos</span>
            <span className="text-sm font-bold text-gray-700">{inactiveCount}</span>
          </button>
          <button
            onClick={() => setFilterCategory('internacional')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all ${filterCategory === 'internacional' ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="text-sm text-orange-600">Internacionales</span>
            <span className="text-sm font-bold text-orange-700">{internationalCount}</span>
          </button>
          <button
            onClick={() => setFilterCategory('literatura')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm transition-all ${filterCategory === 'literatura' ? 'border-pink-400 ring-2 ring-pink-200' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <span className="text-sm text-pink-600">Literatura</span>
            <span className="text-sm font-bold text-pink-700">{literaturaCount}</span>
          </button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <p className="text-center py-10 text-gray-500">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay enlaces</p>
          <p className="text-sm">{hasActiveFilters ? 'Ajusta los filtros.' : 'Crea uno nuevo para empezar.'}</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(link => (
            <LinkCard key={link.id} link={link} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-fuchsia-50 text-fuchsia-800 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Región</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">URL</th>
                <th className="px-4 py-3 text-center">Activo</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {filtered.map(link => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{link.title}</td>
                  <td className="px-4 py-3">{CATEGORY_LABELS[link.category] || link.category}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                    {link.region ? (LINK_REGIONS.find(r => r.key === link.region)?.label || link.region) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-blue-600 truncate max-w-xs">{link.url}</td>
                  <td className="px-4 py-3 text-center">{link.active ? '✅' : '❌'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link href={`/admin/links/${link.id}/edit`} className="text-blue-600 hover:underline">
                      Editar
                    </Link>
                    <button onClick={() => handleDelete(link.id)} className="text-red-600 hover:underline">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
