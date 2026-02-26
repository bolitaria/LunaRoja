import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Link from 'next/link';
import { useRouter } from 'next/router';

function AdminCalendar() {
  const router = useRouter();
  const { actionId: queryActionId } = router.query;

  const [actions, setActions] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedActionId, setSelectedActionId] = useState(queryActionId || 'all');
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [actionsRes, eventsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/events`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setActions(actionsRes.data);
        setEvents(eventsRes.data);
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrar eventos por acción seleccionada
  const filteredEvents = selectedActionId === 'all'
    ? events
    : events.filter(e => e.actionId === parseInt(selectedActionId));

  // Las acciones siempre se muestran todas (o podríamos filtrar también si se desea)
  const filteredActions = selectedActionId === 'all'
    ? actions
    : actions.filter(a => a.id === parseInt(selectedActionId));

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      const actionsOnDate = filteredActions.filter(a => a.date === dateStr);
      const eventsOnDate = filteredEvents.filter(e => {
        const eventDate = new Date(e.datetime).toISOString().split('T')[0];
        return eventDate === dateStr;
      });
      if (actionsOnDate.length > 0 || eventsOnDate.length > 0) {
        return (
          <div className="flex justify-center gap-1">
            {actionsOnDate.length > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {actionsOnDate.length}
              </span>
            )}
            {eventsOnDate.length > 0 && (
              <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {eventsOnDate.length}
              </span>
            )}
          </div>
        );
      }
    }
    return null;
  };

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const actionsOnSelected = filteredActions.filter(a => a.date === selectedDateStr);
  const eventsOnSelected = filteredEvents.filter(e => {
    const eventDate = new Date(e.datetime).toISOString().split('T')[0];
    return eventDate === selectedDateStr;
  });

  const handleActionFilterChange = (e) => {
    const newActionId = e.target.value;
    setSelectedActionId(newActionId);
    // Actualizar la URL sin recargar la página
    router.push(`/admin/calendar${newActionId !== 'all' ? `?actionId=${newActionId}` : ''}`, undefined, { shallow: true });
  };

  return (
    <AdminLayout title="Calendario de Acciones y Eventos">
      <div className="mb-4 flex items-center gap-4">
        <label htmlFor="actionFilter" className="font-semibold">Filtrar por acción:</label>
        <select
          id="actionFilter"
          value={selectedActionId}
          onChange={handleActionFilterChange}
          className="border rounded px-3 py-2"
        >
          <option value="all">Todas las acciones</option>
          {actions.map(action => (
            <option key={action.id} value={action.id}>
              {action.title} ({action.date})
            </option>
          ))}
        </select>
      </div>

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
          <h2 className="text-xl font-semibold mb-4">
            {selectedDate.toLocaleDateString()}
          </h2>
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <>
              {actionsOnSelected.length === 0 && eventsOnSelected.length === 0 ? (
                <p>No hay actividades en este día.</p>
              ) : (
                <>
                  {actionsOnSelected.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-blue-700">Acciones</h3>
                      <ul className="list-disc pl-5">
                        {actionsOnSelected.map(a => (
                          <li key={a.id}>
                            <Link href={`/admin/actions?edit=${a.id}`} className="text-blue-600 hover:underline">
                              {a.title} ({a.actionType === 'concrete' ? 'Concreta' : 'Permanente'})
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {eventsOnSelected.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-green-700">Acciones y Eventos</h3>
                      <ul className="list-disc pl-5">
                        {eventsOnSelected.map(e => (
                          <li key={e.id}>
                            <Link href={`/admin/events?edit=${e.id}`} className="text-green-600 hover:underline">
                              {e.title} ({e.category})
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(AdminCalendar);