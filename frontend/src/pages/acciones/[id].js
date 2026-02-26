import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function AccionDetalle() {
  const router = useRouter();
  const { id } = router.query;
  const [action, setAction] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchAction = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions/${id}`);
          setAction(res.data);
          if (res.data.campaignId) {
            const campaignRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${res.data.campaignId}`);
            setCampaign(campaignRes.data);
          }
        } catch (error) {
          console.error('Error fetching action', error);
        } finally {
          setLoading(false);
        }
      };
      fetchAction();
    }
  }, [id]);

  if (loading) return <Layout><p className="text-center py-20">Cargando...</p></Layout>;
  if (!action) return <Layout><p className="text-center py-20">Acción no encontrada</p></Layout>;

  const actionDate = new Date(action.datetime);
  const categoryLabels = {
    webinar: 'Webinar', talk: 'Charla', protest: 'Manifestación',
    bds: 'Acción BDS', strike: 'Huelga', march: 'Marcha',
    solidarity_action: 'Acción Solidaria', workshop: 'Taller'
  };

  return (
    <Layout title={action.title}>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">{action.title}</h1>
        <p className="text-gray-500 mb-2">
          {actionDate.toLocaleDateString()} - {actionDate.toLocaleTimeString()}
        </p>
        <p className="mb-2">
          Categoría: <span className="font-semibold">{categoryLabels[action.category]}</span>
        </p>
        {campaign && (
          <p className="mb-4">
            Campaña:{' '}
            <Link href={`/campanas/${campaign.id}`} className="text-blue-600 hover:underline" style={{ color: campaign.color }}>
              {campaign.name}
            </Link>
          </p>
        )}
        <p className="text-lg mb-6">{action.description}</p>

        {action.locationType === 'online' ? (
          <a
            href={action.onlineLink}
            target="_blank"
            rel="noopener"
            className="bg-blue-600 text-white px-4 py-2 rounded inline-block hover:bg-blue-700"
          >
            Acceder al evento online
          </a>
        ) : (
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Lugar:</strong> {action.placeName}</p>
            <p><strong>Dirección:</strong> {action.address}</p>
            {action.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(action.address)}`}
                target="_blank"
                rel="noopener"
                className="text-blue-600 underline"
              >
                Ver en Google Maps
              </a>
            )}
          </div>
        )}

        {action.recordingUrl && (
          <a
            href={action.recordingUrl}
            target="_blank"
            rel="noopener"
            className="mt-6 bg-gray-600 text-white px-4 py-2 rounded inline-block hover:bg-gray-700"
          >
            Ver grabación
          </a>
        )}
      </div>
    </Layout>
  );
}