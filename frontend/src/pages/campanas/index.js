import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Función auxiliar para obtener fecha local en formato YYYY-MM-DD
const getLocalDateStr = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Campanas() {
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignsRes, actionsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`)
        ]);
        setCampaigns(campaignsRes.data);
        setActions(actionsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Mapa de campañas por id
  const campaignMap = useMemo(() => {
    return campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
  }, [campaigns]);

  // Agrupar acciones por fecha local
  const actionsByDate = useMemo(() => {
    const map = new Map();
    actions.forEach(action => {
      const dateStr = getLocalDateStr(action.datetime);
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr).push(action);
    });
    return map;
  }, [actions]);

  // Obtener todas las acciones del día futuro más cercano (usando fecha local)
  const nextActions = useMemo(() => {
    const now = new Date();
    const futureActions = actions.filter(a => new Date(a.datetime) > now);
    if (futureActions.length === 0) return [];
    const sorted = futureActions.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    const nextDateStr = getLocalDateStr(sorted[0].datetime);
    return sorted.filter(a => getLocalDateStr(a.datetime) === nextDateStr);
  }, [actions]);

  // Contenido del calendario: círculos de colores de campañas
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = getLocalDateStr(date);
    const actionsOnDate = actionsByDate.get(dateStr) || [];
    if (actionsOnDate.length === 0) return null;

    const colors = [];
    for (const action of actionsOnDate) {
      const campaign = campaignMap[action.campaignId];
      if (campaign && campaign.color && !colors.includes(campaign.color)) {
        colors.push(campaign.color);
        if (colors.length >= 3) break;
      }
    }

    return (
      <div className="flex justify-center gap-0.5 mt-1">
        {colors.map((color, idx) => (
          <span
            key={idx}
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
        {actionsOnDate.length > 3 && (
          <span className="text-xs text-gray-600 ml-1">+{actionsOnDate.length - 3}</span>
        )}
      </div>
    );
  };

  const selectedDateStr = getLocalDateStr(selectedDate);
  const actionsOnSelected = actionsByDate.get(selectedDateStr) || [];

  return (
    <Layout title="Campañas - LunaRoja">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Campañas</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Columna izquierda: Calendario y próximas acciones */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-2xl font-semibold mb-4">Calendario</h2>
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                tileContent={tileContent}
                className="rounded-lg w-full border-0"
              />

              {nextActions.length > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-white rounded-lg border-l-4 border-red-500">
                  <p className="text-sm text-gray-500 uppercase tracking-wider">
                    {nextActions.length === 1 ? 'Próxima acción' : 'Próximas acciones'}
                  </p>
                  <div className="mt-2 space-y-3">
                    {nextActions.map(action => {
                      const campaign = campaignMap[action.campaignId];
                      return (
                        <div key={action.id} className="flex items-start gap-2">
                          {campaign && (
                            <span
                              className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                              style={{ backgroundColor: campaign.color }}
                            />
                          )}
                          <div>
                            <Link href={`/acciones/${action.id}`} className="font-medium hover:text-red-600 transition">
                              {action.title}
                            </Link>
                            <p className="text-sm text-gray-600">
                              {new Date(action.datetime).toLocaleDateString()} -{' '}
                              {new Date(action.datetime).toLocaleTimeString()}
                            </p>
                            {campaign && (
                              <p className="text-xs text-gray-500">{campaign.name}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Listado de campañas */}
          <div className="lg:w-2/3">
            <h2 className="text-2xl font-semibold mb-4">Todas las campañas</h2>
            {loading ? (
              <p>Cargando campañas...</p>
            ) : campaigns.length === 0 ? (
              <p>No hay campañas activas.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map(campaign => (
                  <Link key={campaign.id} href={`/campanas/${campaign.id}`} className="block">
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 border-t-4" style={{ borderTopColor: campaign.color }}>
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: campaign.color }}
                        />
                        <h3 className="text-xl font-semibold text-gray-800">{campaign.name}</h3>
                      </div>
                      <p className="text-gray-600 line-clamp-2">{campaign.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {actionsOnSelected.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-3">
                  {selectedDate.toLocaleDateString() === new Date().toLocaleDateString()
                    ? 'Acciones Hoy'
                    : `Acciones del ${selectedDate.toLocaleDateString()}`}
                </h3>
                <div className="space-y-2">
                  {actionsOnSelected.map(action => {
                    const campaign = campaignMap[action.campaignId];
                    return (
                      <Link key={action.id} href={`/acciones/${action.id}`} className="block">
                        <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition flex items-center gap-3">
                          {campaign && (
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: campaign.color }}
                            />
                          )}
                          <div>
                            <span className="font-medium">{action.title}</span>
                            {campaign && (
                              <span className="text-sm text-gray-500 ml-2">({campaign.name})</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}