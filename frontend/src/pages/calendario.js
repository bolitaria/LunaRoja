import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import Layout from '../components/Layout';
import Link from 'next/link';

const Calendar = dynamic(() => import('react-calendar'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const categoryLabels = {
  webinar: 'Webinar', talk: 'Charla', protest: 'Concentración',
  bds: 'Acción BDS', strike: 'Huelga', march: 'Marcha Manifestación',
  solidarity_action: 'Acción Solidaria', workshop: 'Taller'
};

export default function Calendario() {
  const [events, setEvents] = useState([]);        // actions + campaigns
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [actionsRes, campaignsRes] = await Promise.all([
          axios.get(`${API_URL}/actions`),
          axios.get(`${API_URL}/campaigns`)
        ]);

        // Normalizar campañas para que tengan una fecha (campo `startDate` o similar)
        // Ajusta el nombre del campo según tu modelo de campaña.
        const campaigns = campaignsRes.data.map(c => ({
          ...c,
          datetime: c.startDate || c.datetime,   // usa el campo correcto
          type: 'campaign'
        }));
        const actions = actionsRes.data.map(a => ({ ...a, type: 'action' }));

        setEvents([...actions, ...campaigns]);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Cuenta los eventos que ocurren en una fecha determinada
  const getEventCount = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => {
      if (!e.datetime) return false;
      const eventDate = new Date(e.datetime).toISOString().split('T')[0];
      return eventDate === dateStr;
    }).length;
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const count = getEventCount(date);
    return count > 0 ? (
      <span className="block w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center mx-auto">
        {count}
      </span>
    ) : null;
  };

  // Eventos que caen en la fecha seleccionada
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const eventsOnSelected = events.filter(e => {
    if (!e.datetime) return false;
    return new Date(e.datetime).toISOString().split('T')[0] === selectedDateStr;
  });

  return (
    <Layout title="Calendario de Acciones y Campañas - Voces Palestinas por la Justicia">
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
            ) : eventsOnSelected.length === 0 ? (
              <p className="text-gray-500">No hay eventos en esta fecha.</p>
            ) : (
              <ul className="space-y-4">
                {eventsOnSelected.map(event => (
                  <li key={event.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-1">
                      <Link
                        href={event.type === 'campaign' ? `/campanas/${event.id}` : `/acciones/${event.id}`}
                        className="text-lg font-semibold text-red-700 hover:underline"
                      >
                        {event.title || event.name}
                      </Link>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {event.type === 'campaign' ? 'Campaña' : categoryLabels[event.category] || event.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
                    {event.datetime && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(event.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
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