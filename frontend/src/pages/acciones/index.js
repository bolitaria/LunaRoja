import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function Acciones() {
  const [actions, setActions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [timeFilter, setTimeFilter] = useState('todas'); // 'todas', 'futuras', 'pasadas'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [actionsRes, campaignsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`)
        ]);
        setActions(actionsRes.data);
        setCampaigns(campaignsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const now = new Date();

  // Primero filtramos por categoría
  const categoryFiltered = filterCategory === 'all'
    ? actions
    : actions.filter(a => a.category === filterCategory);

  // Luego filtramos por tiempo
  const filteredActions = timeFilter === 'todas'
    ? categoryFiltered
    : timeFilter === 'futuras'
      ? categoryFiltered.filter(a => new Date(a.datetime) > now && a.isLive)
      : categoryFiltered.filter(a => new Date(a.datetime) <= now || !a.isLive);

  const categoryOrder = [
    { value: 'solidarity_action', label: 'Acción Solidaria' },
    { value: 'workshop', label: 'Talleres' },
    { value: 'bds', label: 'Acción BDS' },
    { value: 'protest', label: 'Concentración' },
    { value: 'march', label: 'Marcha' },
    { value: 'strike', label: 'Huelga' },
    { value: 'talk', label: 'Charla' },
    { value: 'webinar', label: 'Webinar' }
  ];

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

  return (
    <Layout title="Acciones - Voces Palestinas por la Justicia">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Acciones</h1>

        {/* Filtros: categorías a la izquierda, tiempo a la derecha */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          {/* Botones de categoría */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                filterCategory === 'all'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Todas
            </button>
            {categoryOrder.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterCategory(value)}
                className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                  filterCategory === value
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Botones de tiempo */}
          <div className="flex justify-center md:justify-end gap-2">
            <button
              onClick={() => setTimeFilter('todas')}
              className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                timeFilter === 'todas'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setTimeFilter('futuras')}
              className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                timeFilter === 'futuras'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Futuras
            </button>
            <button
              onClick={() => setTimeFilter('pasadas')}
              className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                timeFilter === 'pasadas'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Pasadas
            </button>
          </div>
        </div>

        {/* Lista de acciones filtradas */}
        {loading ? (
          <p className="text-center">Cargando...</p>
        ) : filteredActions.length === 0 ? (
          <p className="text-center text-gray-600">No hay acciones que coincidan con el filtro.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActions.map(action => (
              <ActionCard key={action.id} action={action} campaign={campaignMap[action.campaignId]} type="past" />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

// Componente ActionCard (sin cambios)
function ActionCard({ action, campaign, type }) {
  const date = action.datetime ? new Date(action.datetime).toLocaleDateString() : 'Fecha no disponible';
  const time = action.datetime ? new Date(action.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const categoryLabels = {
    webinar: 'Webinar',
    talk: 'Charla',
    protest: 'Concentración',
    bds: 'Acción BDS',
    strike: 'Huelga',
    march: 'Marcha',
    solidarity_action: 'Acción Solidaria',
    workshop: 'Talleres'
  };

  const categoryColors = {
    webinar: 'bg-blue-100 text-blue-800',
    talk: 'bg-green-100 text-green-800',
    protest: 'bg-red-100 text-red-800',
    bds: 'bg-purple-100 text-purple-800',
    strike: 'bg-yellow-100 text-yellow-800',
    march: 'bg-orange-100 text-orange-800',
    solidarity_action: 'bg-indigo-100 text-indigo-800',
    workshop: 'bg-pink-100 text-pink-800'
  };

  const category = action.category || 'protest';
  const categoryLabel = categoryLabels[category] || category;
  const categoryColor = categoryColors[category] || 'bg-gray-100 text-gray-800';

  const imageUrl = action.featuredImage
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${action.featuredImage}`
    : (action.images && action.images.length > 0
      ? `${process.env.NEXT_PUBLIC_BASE_URL}${action.images[0].url}`
      : null);

  return (
    <Link href={`/acciones/${action.id}`} className="block group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition transform hover:-translate-y-1 h-full flex flex-col">
        {imageUrl && (
          <div className="h-48 overflow-hidden">
            <img
              src={imageUrl}
              alt={action.title || 'Acción'}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-semibold text-gray-800 line-clamp-2">{action.title || 'Sin título'}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${categoryColor} flex-shrink-0 ml-2`}>
              {categoryLabel}
            </span>
          </div>
          <p className="text-gray-600 mb-3 line-clamp-2">{action.description || ''}</p>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {date} - {time}
          </div>
          {campaign && (
            <div className="flex items-center text-sm mt-auto" style={{ color: campaign.color || '#000' }}>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {campaign.name || 'Campaña'}
            </div>
          )}
          {type === 'past' && action.recordingUrl && (
            <div className="mt-3 text-xs text-gray-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Grabación disponible
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}