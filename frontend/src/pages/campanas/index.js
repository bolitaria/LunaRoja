import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';

// Carga dinámica sin SSR para evitar el error "Maximum call stack size exceeded"
const Calendar = dynamic(() => import('react-calendar'), { ssr: false });
import 'react-calendar/dist/Calendar.css';

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
        const [campRes, actionsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`),
        ]);
        setCampaigns(campRes.data);
        setActions(actionsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Mapa de campañas y acciones agrupadas por fecha (sin cambios de lógica, solo simplificamos la presentación)
  const campaignMap = useMemo(() => campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {}), [campaigns]);
  const actionsByDate = useMemo(() => {
    const map = new Map();
    actions.forEach(action => {
      const dateStr = getLocalDateStr(action.datetime);
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr).push(action);
    });
    return map;
  }, [actions]);

  const selectedDateStr = getLocalDateStr(selectedDate);
  const actionsOnSelected = actionsByDate.get(selectedDateStr) || [];

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = getLocalDateStr(date);
    const dayActions = actionsByDate.get(dateStr) || [];
    if (dayActions.length === 0) return null;
    return (
      <div className="flex justify-center gap-0.5 mt-1">
        {dayActions.slice(0, 3).map((_, idx) => (
          <span key={idx} className="inline-block w-2 h-2 rounded-full bg-red-500" />
        ))}
        {dayActions.length > 3 && <span className="text-xs text-gray-600">+{dayActions.length - 3}</span>}
      </div>
    );
  };

  return (
    <Layout title="Campañas - Voces Palestinas por la Justicia">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Campañas</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Calendario minimalista */}
          <div className="lg:w-1/3">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Calendario</h2>
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                tileContent={tileContent}
                className="border-0 w-full"
              />
            </div>
          </div>

          {/* Listado de campañas */}
          <div className="lg:w-2/3">
            <h2 className="text-2xl font-semibold mb-4">Todas las campañas</h2>
            {loading ? (
              <p className="text-gray-500">Cargando...</p>
            ) : campaigns.length === 0 ? (
              <p className="text-gray-500">No hay campañas activas.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map(campaign => (
                  <Link key={campaign.id} href={`/campanas/${campaign.id}`} className="group block">
                    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition p-4 border-t-4" style={{ borderTopColor: campaign.color || '#ccc' }}>
                      {campaign.imageUrl && (
                        <img
                          src={`${process.env.NEXT_PUBLIC_BASE_URL}${campaign.imageUrl}`}
                          alt={campaign.name}
                          className="w-full h-36 object-cover rounded-t-lg mb-3"
                        />
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: campaign.color }} />
                        <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">{campaign.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Acciones del día seleccionado */}
            {actionsOnSelected.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3">
                  Acciones del {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <ul className="space-y-2">
                  {actionsOnSelected.map(action => (
                    <li key={action.id}>
                      <Link href={`/acciones/${action.id}`} className="block bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition">
                        <span className="font-medium">{action.title}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {new Date(action.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}