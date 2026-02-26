import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function Campanas() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`);
        setCampaigns(res.data);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  return (
    <Layout title="Campañas - LunaRoja">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Campañas</h1>
        {loading ? (
          <p className="text-center">Cargando campañas...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-center">No hay campañas activas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(campaign => (
              <Link key={campaign.id} href={`/campanas/${campaign.id}`} className="block">
                <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                  <h2 className="text-xl font-semibold mb-2" style={{ color: campaign.color }}>
                    {campaign.name}
                  </h2>
                  <p className="text-gray-600">{campaign.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}