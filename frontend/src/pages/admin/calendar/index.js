import api from '../../../lib/axios';
import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Link from 'next/link';
import { useRouter } from 'next/router';

function AdminCalendar() {
  const router = useRouter();
  const { actionId: queryActionId } = router.query;

  const [actions, setActions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedActionId, setSelectedActionId] = useState(queryActionId || 'all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/actions');
        setActions(res.data || []);
      } catch (error) {
        console.error('Error fetching actions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (queryActionId) {
      setSelectedActionId(queryActionId);
    }
  }, [queryActionId]);

  const filteredActions = useMemo(() => {
    return selectedActionId === 'all'
      ? actions
      : actions.filter(a => a.id === parseInt(selectedActionId));
  }, [actions, selectedActionId]);

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      const actionsOnDate = filteredActions.filter(a => {
        const actionDate = new Date(a.datetime).toISOString().split('T')[0];
        return actionDate === dateStr;
      });
      if (actionsOnDate.length > 0) {
        return (
          <div className="flex justify-center gap-1">
            <span className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {actionsOnDate.length}
            </span>
          </div>
        );
      }
    }
    return null;
  };

  const safeSelectedDate = selectedDate instanceof Date && !isNaN(selectedDate) ? selectedDate : new Date();
  const selectedDateStr = safeSelectedDate.toISOString().split('T')[0];
  const actionsOnSelected = filteredActions.filter(a => {
    const actionDate = new Date(a.datetime).toISOString().split('T')[0];
    return actionDate === selectedDateStr;
  });

  const handleActionFilterChange = (e) => {
    const newActionId = e.target.value;
    setSelectedActionId(newActionId);
    router.push(`/admin/calendar${newActionId !== 'all' ? `?actionId=${newActionId}` : ''}`, undefined, { shallow: true });
  };

  return (
    <AdminLayout title="Calendario">
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
              {action.title}
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
          ) : actionsOnSelected.length === 0 ? (
            <p className="text-gray-500">No hay acciones en este día.</p>
          ) : (
            <ul className="space-y-2">
              {actionsOnSelected.map(a => (
                <li key={a.id} className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <Link href={`/admin/actions/${a.id}/edit`} className="text-purple-600 hover:underline font-medium">
                    {a.title}
                  </Link>
                  <span className="text-xs text-gray-500 ml-2">({a.category})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminCalendar;