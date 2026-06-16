import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import ActionCard from '../../components/ActionCard';

export default function Acciones() {
  const [actions, setActions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [timeFilter, setTimeFilter] = useState('todas');

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
  const categoryFiltered = filterCategory === 'all' ? actions : actions.filter(a => a.category === filterCategory);
  const filteredActions = timeFilter === 'todas' ? categoryFiltered : timeFilter === 'futuras' ? categoryFiltered.filter(a => new Date(a.datetime) > now && a.isLive) : categoryFiltered.filter(a => new Date(a.datetime) <= now || !a.isLive);

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
      <div className="container mx-auto px-4 py-8 pb-16">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-600">Acciones</h1>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <button onClick={() => setFilterCategory('all')} className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${filterCategory === 'all' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Todas</button>
            {categoryOrder.map(({ value, label }) => (
              <button key={value} onClick={() => setFilterCategory(value)} className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${filterCategory === value ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>{label}</button>
            ))}
          </div>

          <div className="flex justify-center md:justify-end gap-2">
            <button onClick={() => setTimeFilter('todas')} className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${timeFilter === 'todas' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Todas</button>
            <button onClick={() => setTimeFilter('futuras')} className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${timeFilter === 'futuras' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Futuras</button>
            <button onClick={() => setTimeFilter('pasadas')} className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${timeFilter === 'pasadas' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Pasadas</button>
          </div>
        </div>

        {loading ? <p className="text-center text-gray-600">Cargando...</p> : filteredActions.length === 0 ? <p className="text-center text-gray-600">No hay acciones que coincidan con el filtro.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActions.map(action => {
              const isPast = new Date(action.datetime) <= now;
              return <ActionCard key={action.id} action={action} campaign={campaignMap[action.campaignId]} type={isPast ? 'past' : 'upcoming'} />;
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}