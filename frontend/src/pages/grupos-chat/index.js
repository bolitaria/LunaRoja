import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';                 
import ChatGroupCard from '../../components/ChatGroupCard';   

export default function GruposChats() {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsRes, campRes, actRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/chats-groups`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`),
        ]);
        setGroups(groupsRes.data);
        setCampaigns(campRes.data);
        setActions(actRes.data);
        setFilteredGroups(groupsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...groups];
    if (selectedCampaign) {
      result = result.filter(g => g.campaignId == selectedCampaign);
    }
    if (selectedAction) {
      result = result.filter(g => g.actionId == selectedAction);
    }
    setFilteredGroups(result);
  }, [selectedCampaign, selectedAction, groups]);

  useEffect(() => {
    const regionMap = {};
    filteredGroups.forEach(group => {
      const region = group.region || 'General';
      if (!regionMap[region]) regionMap[region] = [];
      regionMap[region].push(group);
    });
    const sortedRegions = Object.keys(regionMap).sort();
    setRegions(sortedRegions.map(r => ({ name: r, groups: regionMap[r] })));
  }, [filteredGroups]);

  return (
    <Layout title="Grupos - Voces Palestinas por la Justicia">
      <div className="container mx-auto px-4 py-8 pb-16">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-600">Grupos</h1>
        <p className="text-center text-gray-600 mb-8">
          Únete a la conversación en Telegram, WhatsApp o Signal y colabora con otros miembros de la comunidad.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <select
            value={selectedCampaign}
            onChange={(e) => { setSelectedCampaign(e.target.value); setSelectedAction(''); }}
            className="border rounded px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Todas las campañas</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedAction}
            onChange={(e) => { setSelectedAction(e.target.value); setSelectedCampaign(''); }}
            className="border rounded px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Todas las acciones</option>
            {actions.map(a => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Cargando grupos...</p>
        ) : regions.length === 0 ? (
          <p className="text-center text-gray-600">No hay grupos disponibles con los filtros seleccionados.</p>
        ) : (
          <div>
            {regions.map(region => (
              <div key={region.name} className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-gray-600">{region.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {region.groups.map(group => (
                    <ChatGroupCard key={group.id} group={group} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}