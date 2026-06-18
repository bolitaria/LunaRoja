import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import Layout from '../components/Layout';
import Link from 'next/link';

const Calendar = dynamic(() => import('react-calendar'), { ssr: false });

export default function Calendario() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`);
        setActions(res.data);
      } catch (error) {
        console.error('Error fetching actions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActions();
  }, []);

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = date.toISOString().split('T')[0];
    const count = actions.filter(a => {
      const actionDate = new Date(a.datetime).toISOString().split('T')[0];
      return actionDate === dateStr;
    }).length;
    return count > 0 ? (
      <span className="block w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center mx-auto">
        {count}
      </span>
    ) : null;
  };

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const actionsOnSelected = actions.filter(a => {
    const actionDate = new Date(a.datetime).toISOString().split('T')[0];
    return actionDate === selectedDateStr;
  });

  const categoryLabels = {
    webinar: 'Webinar', talk: 'Charla', protest: 'Concentración',
    bds: 'Acción BDS', strike: 'Huelga', march: 'Marcha Manifestación',
    solidarity_action: 'Acción Solidaria', workshop: 'Taller'
  };

  return (
    <Layout title="Calendario de Acciones - Voces Palestinas por la Justicia">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Calendario</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2 flex justify-center">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              tileContent={tileContent}
              className="rounded-lg shadow border-0"
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-2xl font-semibold mb-4">
              {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            {loading ? (
              <p className="text-gray-500">Cargando...</p>
            ) : actionsOnSelected.length === 0 ? (
              <p className="text-gray-500">No hay acciones en esta fecha.</p>
            ) : (
              <ul className="space-y-4">
                {actionsOnSelected.map(action => (
                  <li key={action.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-1">
                      <Link href={`/acciones/${action.id}`} className="text-lg font-semibold text-red-700 hover:underline">
                        {action.title}
                      </Link>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {categoryLabels[action.category] || action.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">{action.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(action.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}