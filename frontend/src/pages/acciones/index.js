import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { categoryLabels, categoryStyles } from '../../utils/categoryConfig';

const CATEGORIES = [
  'todas', 'protest', 'march', 'bds', 'solidarity_action', 'workshop', 'webinar', 'talk', 'strike'
];

export default function AccionesIndex() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTime, setFilterTime] = useState('todas');
  const [filterLocation, setFilterLocation] = useState('todos');
  const [filterCategory, setFilterCategory] = useState('todas');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const res = await axios.get(`${apiUrl}/actions`, { timeout: 15000 });
        const sorted = res.data.sort((a, b) => {
          if (a.urgent && !b.urgent) return -1;
          if (!a.urgent && b.urgent) return 1;
          return new Date(b.datetime) - new Date(a.datetime);
        });
        setActions(sorted);
        setError(null);
      } catch (err) {
        console.error('Error fetching actions:', err);
        setError('No se pudieron cargar las acciones.');
      } finally {
        setLoading(false);
      }
    };
    fetchActions();
  }, [apiUrl]);

  // Funciones de cambio de filtro con logs para depuración
  const handleTimeFilter = useCallback((value) => {
    console.log('Cambiando filtro temporal a:', value);
    setFilterTime(value);
  }, []);

  const handleCategoryFilter = useCallback((cat) => {
    console.log('Cambiando filtro categoría a:', cat);
    setFilterCategory(cat);
  }, []);

  const toggleLocation = useCallback((value) => {
    setFilterLocation(prev => {
      const newLoc = prev === value ? 'todos' : value;
      console.log('Cambiando filtro ubicación a:', newLoc);
      return newLoc;
    });
  }, []);

  const now = new Date(); // se recalcula en cada render

  const filteredActions = useMemo(() => {
    console.log('Aplicando filtros:', { filterTime, filterLocation, filterCategory });
    return actions.filter(action => {
      const actionDate = new Date(action.datetime);
      if (filterTime === 'futuras' && actionDate <= now) return false;
      if (filterTime === 'pasadas' && actionDate > now) return false;
      if (filterLocation === 'online' && action.locationType !== 'online') return false;
      if (filterLocation === 'presencial' && action.locationType !== 'presencial') return false;
      if (filterCategory !== 'todas' && action.category !== filterCategory) return false;
      return true;
    });
  }, [actions, filterTime, filterLocation, filterCategory, now]);

  const filterBtnBase = "px-4 py-2 rounded-lg text-sm font-medium transition border border-gray-300";

  if (loading) {
    return (
      <Layout title="Acciones - Voces Palestinas por la Justicia" bgClass="bg-gradient-to-b from-yellow-100 via-amber-50 to-white min-h-screen">
        <div className="container mx-auto px-4 lg:px-8 py-8 text-center py-20">
          <p>Cargando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Acciones - Voces Palestinas por la Justicia" bgClass="bg-gradient-to-b from-yellow-100 via-amber-50 to-white min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-700 mb-8 text-center">Acciones</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
            <button onClick={() => window.location.reload()} className="ml-2 underline font-medium hover:text-red-900">Reintentar</button>
          </div>
        )}

        {/* Filtros principales */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryFilter(cat)}
                className={`${filterBtnBase} ${filterCategory === cat ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                {cat === 'todas' ? 'Todas' : (categoryLabels[cat] || cat)}
              </button>
            ))}
          </div>

          {/* Filtros temporales */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTimeFilter('todas')}
              className={`${filterBtnBase} ${filterTime === 'todas' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Todas
            </button>
            <button
              onClick={() => handleTimeFilter('futuras')}
              className={`${filterBtnBase} ${filterTime === 'futuras' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Futuras
            </button>
            <button
              onClick={() => handleTimeFilter('pasadas')}
              className={`${filterBtnBase} ${filterTime === 'pasadas' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Pasadas
            </button>
          </div>
        </div>

        {/* Filtro presencial / online */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <button
              onClick={() => toggleLocation('presencial')}
              className={`px-2 py-1 rounded-full border transition ${filterLocation === 'presencial' ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700' : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'}`}
            >
              📍 Presencial
            </button>
            <button
              onClick={() => toggleLocation('online')}
              className={`px-2 py-1 rounded-full border transition ${filterLocation === 'online' ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700' : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'}`}
            >
              💻 Online
            </button>
          </div>
        </div>

        {filteredActions.length === 0 ? (
          <p className="text-center py-20 text-gray-600">No hay acciones que mostrar.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredActions.map(action => {
              const actionDate = new Date(action.datetime);
              const isPast = actionDate < now;
              const catStyle = categoryStyles[action.category] || { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' };
              const catLabel = categoryLabels[action.category] || action.category;
              const isOnline = action.locationType === 'online';
              let imageUrl = null;
              if (action.featuredImage) imageUrl = `${baseUrl}${action.featuredImage}`;
              else if (action.images && action.images.length > 0) imageUrl = `${baseUrl}${action.images[0].url}`;

              return (
                <Link key={action.id} href={`/acciones/${action.id}`} className="group">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition h-full flex flex-col">
                    {imageUrl && (
                      <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                        <img src={imageUrl} alt={action.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                      </div>
                    )}
                    <div className="p-3 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-600 line-clamp-2 flex-1">{action.title}</h3>
                        {action.urgent && <span className="flex-shrink-0 inline-block px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-medium rounded-full">🔥 Urgente</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs mb-1.5">
                        <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium border" style={catStyle}>{catLabel}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${isOnline ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-green-100 text-green-800 border-green-300'}`}>{isOnline ? '💻 Online' : '📍 Presencial'}</span>
                        <span className="text-[10px] text-gray-500">{actionDate.toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 flex-1">{action.description || 'Sin descripción'}</p>
                      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className={`text-[10px] font-medium ${isPast ? 'text-gray-500' : 'text-green-600'}`}>{isPast ? 'Pasado' : 'Próximo'}</span>
                        <span className="text-fuchsia-600 group-hover:underline text-xs font-medium">Ver más →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}