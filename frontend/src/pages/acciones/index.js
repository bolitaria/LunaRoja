import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import ActionCard from '../../components/ActionCard';

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