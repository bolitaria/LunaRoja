import api from '../../../lib/axios';
// pages/admin/calendar/index.js
import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../../components/AdminLayout';
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
          api.get('/actions'),
          api.get('/events')
        ]);
        setActions(actionsRes.data || []);
        setEvents(eventsRes.data || []);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Sincronizar el filtro con la URL
  useEffect(() => {
    if (queryActionId) {
      setSelectedActionId(queryActionId);
    }
  }, [queryActionId]);

  const filteredEvents = useMemo(() => {
    return selectedActionId === 'all'
      ? events
      : events.filter(e => e.actionId === parseInt(selectedActionId));
  }, [events, selectedActionId]);

  const filteredActions = useMemo(() => {
    return selectedActionId === 'all'
      ? actions
      : actions.filter(a => a.id === parseInt(selectedActionId));
  }, [actions, selectedActionId]);

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

  // Asegurar que selectedDate es un objeto Date válido
  const safeSelectedDate = selectedDate instanceof Date && !isNaN(selectedDate) ? selectedDate : new Date();
  const selectedDateStr = safeSelectedDate.toISOString().split('T')[0];
  const actionsOnSelected = filteredActions.filter(a => a.date === selectedDateStr);
  const eventsOnSelected = filteredEvents.filter(e => {
    const eventDate = new Date(e.datetime).toISOString().split('T')[0];
    return eventDate === selectedDateStr;
  });

  const handleActionFilterChange = (e) => {
    const newActionId = e.target.value;
    setSelectedActionId(newActionId);
    router.push(`/admin/calendar${newActionId !== 'all' ? `?actionId=${newActionId}` : ''}`, undefined, { shallow: true });
  };

  return (
    <AdminLayout title="Calendario de Acciones y Eventos">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label htmlFor="actionFilter" className="font-semibold text-gray-700">Filtrar por acción:</label>
        <select
          id="actionFilter"
          value={selectedActionId}
          onChange={handleActionFilterChange}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-fuchsia-500 bg-white"
        >
          <option value="all">Todas las acciones</option>
          {actions.map(action => (
            <option key={action.id} value={action.id}>
              {action.title} ({action.date})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <Calendar
              onChange={setSelectedDate}
              value={safeSelectedDate}
              tileContent={tileContent}
              className="w-full"
            />
          </div>
        </div>
        <div className="lg:w-1/2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {safeSelectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : (
            <>
              {actionsOnSelected.length === 0 && eventsOnSelected.length === 0 ? (
                <p className="text-gray-500">No hay actividades en este día.</p>
              ) : (
                <>
                  {actionsOnSelected.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-blue-700 mb-2">Acciones</h3>
                      <ul className="space-y-2">
                        {actionsOnSelected.map(a => (
                          <li key={a.id} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <Link href={`/admin/actions?edit=${a.id}`} className="text-blue-600 hover:underline font-medium">
                              {a.title}
                            </Link>
                            <span className="text-xs text-gray-500 ml-2">({a.actionType === 'concrete' ? 'Concreta' : 'Permanente'})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {eventsOnSelected.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-green-700 mb-2">Eventos</h3>
                      <ul className="space-y-2">
                        {eventsOnSelected.map(e => (
                          <li key={e.id} className="bg-green-50 p-3 rounded-lg border border-green-100">
                            <Link href={`/admin/events?edit=${e.id}`} className="text-green-600 hover:underline font-medium">
                              {e.title}
                            </Link>
                            <span className="text-xs text-gray-500 ml-2">({e.category})</span>
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

export default AdminCalendar;