import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import ActionCard from '../components/ActionCard';   // usamos el mismo componente de acciones

export default function Eventos() {
  const [actions, setActions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');

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
  const filteredActions = filterCategory === 'all'
    ? actions
    : actions.filter(a => a.category === filterCategory);

  const upcoming = filteredActions.filter(a => new Date(a.datetime) > now && a.isLive);
  const past = filteredActions.filter(a => new Date(a.datetime) <= now || !a.isLive);

  const categoryLabels = {
    protest: 'Manifestación',
    bds: 'Acción BDS',
    strike: 'Huelga',
    march: 'Marcha',
    solidarity_action: 'Acción Solidaria',
    workshop: 'Taller',
    talk: 'Charla',
    webinar: 'Webinar'
  };

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

  return (
    <Layout title="Eventos - Voces Palestinas por la Justicia">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Eventos</h1>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 rounded ${filterCategory === 'all' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            Todos
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

        <h2 className="text-2xl font-semibold mb-4">Futuros</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : upcoming.length === 0 ? (
          <p className="mb-8">No hay próximos eventos programados.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {upcoming.map(action => (
              <ActionCard key={action.id} action={action} campaign={campaignMap[action.campaignId]} type="upcoming" />
            ))}
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-4">Completados</h2>
        {past.length === 0 ? (
          <p>No hay grabaciones o información de eventos pasados disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {past.map(action => (
              <ActionCard key={action.id} action={action} campaign={campaignMap[action.campaignId]} type="past" />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}