import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function Acciones() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`);
        setActions(res.data);
      } catch (error) {
        console.error('Error fetching actions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActions();
  }, []);

  const now = new Date();
  const filteredActions = filterCategory === 'all'
    ? actions
    : actions.filter(a => a.category === filterCategory);

  const upcoming = filteredActions.filter(a => new Date(a.datetime) > now && a.isLive);
  const past = filteredActions.filter(a => new Date(a.datetime) <= now || !a.isLive);

  const categoryLabels = {
    webinar: 'Webinar',
    talk: 'Charla',
    protest: 'Manifestación',
    bds: 'Acción BDS',
    strike: 'Huelga',
    march: 'Marcha',
    solidarity_action: 'Acción Solidaria',
    workshop: 'Taller'
  };

  return (
    <Layout title="Acciones - LunaRoja">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Acciones</h1>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 rounded ${filterCategory === 'all' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            Todas
          </button>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilterCategory(value)}
              className={`px-4 py-2 rounded ${filterCategory === value ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <h2 className="text-2xl font-semibold mb-4">Próximas acciones</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : upcoming.length === 0 ? (
          <p className="mb-8">No hay próximas acciones programadas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {upcoming.map(action => (
              <ActionCard key={action.id} action={action} type="upcoming" />
            ))}
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-4">Acciones pasadas (grabaciones)</h2>
        {past.length === 0 ? (
          <p>No hay grabaciones disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {past.map(action => (
              <ActionCard key={action.id} action={action} type="past" />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

// Componente ActionCard (puede estar en un archivo separado o aquí mismo)
function ActionCard({ action, type }) {
  const date = new Date(action.datetime).toLocaleDateString();
  const time = new Date(action.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const categoryLabels = {
    webinar: 'Webinar',
    talk: 'Charla',
    protest: 'Manifestación',
    bds: 'Acción BDS',
    strike: 'Huelga',
    march: 'Marcha',
    solidarity_action: 'Acción Solidaria',
    workshop: 'Taller'
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

  return (
    <Link href={`/acciones/${action.id}`} className="block">
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">{action.title}</h3>
          <span className={`text-xs px-2 py-1 rounded ${categoryColors[action.category]}`}>
            {categoryLabels[action.category]}
          </span>
        </div>
        <p className="text-gray-600 mb-2">{action.description}</p>
        <p className="text-sm text-gray-500 mb-2">
          {date} - {time}
        </p>
        {action.locationType === 'online' ? (
          <p className="text-sm text-blue-600">📍 Online</p>
        ) : (
          <p className="text-sm text-gray-600">📍 {action.placeName || 'Presencial'}</p>
        )}
        {type === 'past' && action.recordingUrl && (
          <span className="inline-block mt-2 text-gray-500 text-sm">Grabación disponible</span>
        )}
      </div>
    </Link>
  );
}