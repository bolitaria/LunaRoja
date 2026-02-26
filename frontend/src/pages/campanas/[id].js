import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function CampanaDetalle() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          const [campaignRes, actionsRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${id}`),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions?campaignId=${id}`)
          ]);
          setCampaign(campaignRes.data);
          setActions(actionsRes.data);
        } catch (error) {
          console.error('Error fetching data', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id]);

  if (loading) return <Layout><p className="text-center py-20">Cargando...</p></Layout>;
  if (!campaign) return <Layout><p className="text-center py-20">Campaña no encontrada</p></Layout>;

  return (
    <Layout title={`${campaign.name} - LunaRoja`}>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4" style={{ color: campaign.color }}>
          {campaign.name}
        </h1>
        <p className="text-gray-600 mb-8">{campaign.description}</p>

        <h2 className="text-2xl font-semibold mb-4">Acciones de esta campaña</h2>
        {actions.length === 0 ? (
          <p>No hay acciones programadas para esta campaña.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {actions.map(action => {
              const actionDate = new Date(action.datetime);
              return (
                <Link key={action.id} href={`/acciones/${action.id}`} className="block">
                  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
                    <h3 className="text-xl font-semibold mb-2">{action.title}</h3>
                    <p className="text-gray-600 mb-2">{action.description}</p>
                    <p className="text-sm text-gray-500">
                      {actionDate.toLocaleDateString()} - {actionDate.toLocaleTimeString()}
                    </p>
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