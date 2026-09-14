// frontend/src/pages/acciones/index.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Link from 'next/link';
import Pagination from '../../components/Pagination';
import { categoryLabels, categoryStyles } from '../../utils/categoryConfig';
import api from '../../lib/axios';

const CATEGORIES = [
  'todas', 'protest', 'march', 'bds', 'solidarity_action', 'workshop', 'webinar', 'talk', 'strike'
];

export default function AccionesIndex() {
  const router = useRouter();

  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [filterTime, setFilterTime] = useState('todas');
  const [filterLocation, setFilterLocation] = useState('todos');
  const [filterCategory, setFilterCategory] = useState('todas');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [total, setTotal] = useState(0);

  // Reset de página al cambiar cualquier filtro
  const resetPage = useCallback(() => setCurrentPage(1), []);

  const handleTimeFilter = useCallback((value) => {
    setFilterTime(value);
    resetPage();
  }, [resetPage]);

  const handleCategoryFilter = useCallback((cat) => {
    setFilterCategory(cat);
    resetPage();
  }, [resetPage]);

  const toggleLocation = useCallback((value) => {
    setFilterLocation(prev => prev === value ? 'todos' : value);
    resetPage();
  }, [resetPage]);

  // Fetch con filtros + paginación server-side
  useEffect(() => {
    const fetchActions = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: itemsPerPage,
        };
        if (filterCategory && filterCategory !== 'todas') params.category = filterCategory;
        if (filterLocation && filterLocation !== 'todos') params.locationType = filterLocation;
        if (filterTime === 'futuras') params.status = 'upcoming';
        if (filterTime === 'pasadas') params.status = 'past';

        const res = await api.get('/actions', { params, timeout: 15000 });
        const payload = res.data;
        setActions(Array.isArray(payload) ? payload : (payload.data || []));
        setTotal(payload.total ?? 0);
        setError(null);
      } catch (err) {
        console.error('Error fetching actions:', err);
        setError('No se pudieron cargar las acciones.');
        setActions([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchActions();
  }, [currentPage, itemsPerPage, filterTime, filterLocation, filterCategory]);

  const filterBtnBase = "px-4 py-2 rounded-lg text-sm font-medium transition border border-gray-300";

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <Layout
      title="Acciones - Voces Palestinas por la Justicia"
      bgClass="bg-gradient-to-b from-yellow-100 via-amber-50 to-white min-h-screen"
    >
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-700 mb-8 text-center">Acciones</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
            <button
              onClick={() => window.location.reload()}
              className="ml-2 underline font-medium hover:text-red-900"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Filtros principales */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryFilter(cat)}
                className={`${filterBtnBase} ${
                  filterCategory === cat
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat === 'todas' ? 'Todas' : (categoryLabels[cat] || cat)}
              </button>
            ))}
          </div>

          {/* Filtros temporales */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTimeFilter('todas')}
              className={`${filterBtnBase} ${
                filterTime === 'todas'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => handleTimeFilter('futuras')}
              className={`${filterBtnBase} ${
                filterTime === 'futuras'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Próximas
            </button>
            <button
              onClick={() => handleTimeFilter('pasadas')}
              className={`${filterBtnBase} ${
                filterTime === 'pasadas'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Pasadas
            </button>

            {/* Filtro modalidad */}
            <button
              onClick={() => toggleLocation('presencial')}
              className={`px-2 py-1 rounded-full border transition ${
                filterLocation === 'presencial'
                  ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700'
                  : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'
              }`}
            >
              📍 Presencial
            </button>
            <button
              onClick={() => toggleLocation('online')}
              className={`px-2 py-1 rounded-full border transition ${
                filterLocation === 'online'
                  ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700'
                  : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'
              }`}
            >
              💻 Online
            </button>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="text-sm text-gray-500 mb-4 text-center">
          {loading ? 'Cargando...' : `${total} acción${total !== 1 ? 'es' : ''} encontrada${total !== 1 ? 's' : ''}`}
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-center py-20">Cargando...</p>
        ) : actions.length === 0 ? (
          <p className="text-center py-20 text-gray-500">
            No se encontraron acciones con los filtros actuales.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {actions.map(action => {
                const actionDate = new Date(action.datetime);
                const now = new Date();
                const isPast = actionDate < now;
                const catStyle = categoryStyles[action.category] || { backgroundColor: '#f3f4f6', color: '#1f2937' };
                const catLabel = categoryLabels[action.category] || action.category;
                const isOnline = action.locationType === 'online';

                return (
                  <Link key={action.id} href={`/acciones/${action.id}`} className="group">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition h-full flex flex-col">
                      {action.imageUrl && (
                        <img
                          src={action.imageUrl}
                          alt={action.title}
                          className="w-full h-40 object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-gray-800 group-hover:text-fuchsia-600 transition line-clamp-2">
                            {action.title}
                          </h3>
                          {action.urgent && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                              🔥
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-xs mb-2">
                          <span className="px-2 py-0.5 rounded-full border" style={catStyle}>
                            {catLabel}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full border ${
                              isOnline
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-green-100 text-green-800 border-green-300'
                            }`}
                          >
                            {isOnline ? '💻 Online' : '📍 Presencial'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {actionDate.toLocaleDateString('es-ES', {
                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                          })}
                          {' · '}
                          {actionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {action.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-2">
                            {action.description}
                          </p>
                        )}
                        <div className="mt-auto pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                          <span className={isPast ? 'text-gray-400' : 'text-green-600 font-medium'}>
                            {isPast ? 'Pasada' : 'Próxima'}
                          </span>
                          <span className="text-fuchsia-600 group-hover:underline">Ver más →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={(size) => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
