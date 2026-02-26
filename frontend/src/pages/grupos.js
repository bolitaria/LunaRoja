import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import GroupCard from '../components/GroupCard';

export default function Grupos() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/working-groups`);
        const data = res.data;
        setGroups(data);
        
        // Agrupar por región
        const regionMap = {};
        data.forEach(group => {
          const region = group.region || 'General';
          if (!regionMap[region]) regionMap[region] = [];
          regionMap[region].push(group);
        });
        // Ordenar regiones alfabéticamente
        const sortedRegions = Object.keys(regionMap).sort();
        setRegions(sortedRegions.map(r => ({ name: r, groups: regionMap[r] })));
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  return (
    <Layout title="Grupos de Trabajo - LunaRoja">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4 text-center">Grupos de Trabajo</h1>
        <p className="text-center text-gray-600 mb-8">
          Únete a la conversación en Telegram o WhatsApp y colabora con otros miembros de la comunidad.
        </p>

        {loading ? (
          <p className="text-center">Cargando grupos...</p>
        ) : regions.length === 0 ? (
          <p className="text-center">No hay grupos activos por el momento.</p>
        ) : (
          <div>
            {regions.map(region => (
              <div key={region.name} className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 border-b pb-2">{region.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {region.groups.map(group => (
                    <GroupCard key={group.id} group={group} />
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