import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import EventCard from '../components/EventCard';

export default function Webinars() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/events`);
        setEvents(res.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.datetime) > now && e.isLive);
  const past = events.filter(e => new Date(e.datetime) <= now || !e.isLive);

  return (
    <Layout title="Webinars y Charlas - LunaRoja">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Webinars y Charlas</h1>

        <h2 className="text-2xl font-semibold mb-4">Próximos eventos</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : upcoming.length === 0 ? (
          <p className="mb-8">No hay próximos eventos programados.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {upcoming.map(event => (
              <EventCard key={event.id} event={event} type="upcoming" />
            ))}
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-4">Eventos pasados (grabaciones)</h2>
        {past.length === 0 ? (
          <p>No hay grabaciones disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {past.map(event => (
              <EventCard key={event.id} event={event} type="past" />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}