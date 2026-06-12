import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Link from 'next/link';

export default function Calendario() {
  const [actions, setActions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [actionsRes, campaignsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/events`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`)
        ]);
        setActions(actionsRes.data);
        setCampaigns(campaignsRes.data);
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Mapa de campañas para obtener color (podríamos asignar colores según tipo)
  const campaignColors = {
    concrete: 'bg-blue-500',
    permanent: 'bg-purple-500'
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      const actionsOnDate = actions.filter(a => {
        const actionDate = new Date(a.datetime).toISOString().split('T')[0];
        return actionDate === dateStr;
      });
      if (actionsOnDate.length > 0) {
        // Mostrar un indicador del número de acciones
        return (
          <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mx-auto">
            {actionsOnDate.length}
          </span>
        );
      }
    }
    return null;
  };

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const actionsOnSelected = actions.filter(a => {
    const actionDate = new Date(a.datetime).toISOString().split('T')[0];
    return actionDate === selectedDateStr;
  });

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

  const categoryLabels = {
    webinar: 'Webinar', talk: 'Charla', protest: 'Manifestación',
    bds: 'Acción BDS', strike: 'Huelga', march: 'Marcha',
    solidarity_action: 'Acción Solidaria', workshop: 'Taller'
  };

  return (
    <Layout title="Calendario de Acciones - Voces Palestinas por la Justicia">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Calendario de Acciones</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={tileContent}
              className="rounded-lg shadow"
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-2xl font-semibold mb-4">
              Acciones del {selectedDate.toLocaleDateString()}
            </h2>
            {loading ? (
              <p>Cargando...</p>
            ) : actionsOnSelected.length === 0 ? (
              <p>No hay acciones en esta fecha.</p>
            ) : (
              <ul className="space-y-4">
                {actionsOnSelected.map(action => {
                  const campaign = campaignMap[action.actionId];
                  return (
                    <li key={action.id} className="border p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        {campaign && (
                          <span className={`w-3 h-3 rounded-full ${campaignColors[campaign.actionType] || 'bg-gray-500'}`} title={campaign.title}></span>
                        )}
                        <Link href={`/acciones/${action.id}`} className="text-xl font-semibold text-blue-600 hover:underline">
                          {action.title}
                        </Link>
                      </div>
                      {campaign && (
                        <Link href={`/campanas/${campaign.id}`} className="text-sm text-gray-500 hover:underline block">
                          Campaña: {campaign.title}
                        </Link>
                      )}
                      <p className="text-gray-700 mt-2">{action.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(action.datetime).toLocaleString()} · {categoryLabels[action.category]}
                      </p>
                      {action.locationType === 'online' ? (
                        <a href={action.onlineLink} target="_blank" rel="noopener" className="text-blue-600 text-sm underline">
                          Enlace online
                        </a>
                      ) : (
                        <p className="text-sm">
                          📍 {action.placeName} - {action.address}
                          {action.address && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(action.address)}`}
                              target="_blank"
                              rel="noopener"
                              className="text-blue-600 underline ml-2"
                            >
                              Mapa
                            </a>
                          )}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}