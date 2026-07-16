import api from '../../../lib/axios';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaFilter, FaTimes } from 'react-icons/fa';

function AdminCalendar() {
  const { user } = useAuth();
  const [actions, setActions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month | day
  const [filterCampaignId, setFilterCampaignId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showPast, setShowPast] = useState(true);
  const [showFuture, setShowFuture] = useState(true);

  const now = new Date();

  const fetchData = useCallback(async () => {
    try {
      const [actionsRes, campaignsRes] = await Promise.all([
        api.get('/actions'),
        api.get('/campaigns')
      ]);
      setActions(actionsRes.data);
      setCampaigns(campaignsRes.data);
    } catch (error) {
      console.error('Error fetching calendar data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtrar por campaña si el usuario es campaign_admin y solo ve sus campañas
  const userCampaignIds = useMemo(() => {
    if (!user) return [];
    if (user.role === 'superadmin') return campaigns.map(c => c.id); // ve todo
    if (user.role === 'campaign_admin' && user.campaigns) return user.campaigns.map(c => c.id);
    return [];
  }, [user, campaigns]);

  // Filtrar acciones según rol
  const filteredActions = useMemo(() => {
    let filtered = actions;
    if (user?.role === 'action_admin' && user.actions) {
      const actionIds = user.actions.map(a => a.id);
      filtered = filtered.filter(a => actionIds.includes(a.id));
    } else if (user?.role === 'campaign_admin' && userCampaignIds.length > 0) {
      filtered = filtered.filter(a => userCampaignIds.includes(a.campaignId));
    }

    // Filtros temporales
    if (!showPast) filtered = filtered.filter(a => new Date(a.datetime) >= now);
    if (!showFuture) filtered = filtered.filter(a => new Date(a.datetime) < now);

    // Filtro por campaña
    if (filterCampaignId) filtered = filtered.filter(a => a.campaignId === filterCampaignId);

    // Filtro por categoría
    if (filterCategory) filtered = filtered.filter(a => a.category === filterCategory);

    return filtered;
  }, [actions, user, showPast, showFuture, filterCampaignId, filterCategory, now, userCampaignIds]);

  // Obtener el mes actual (en base a selectedDate)
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  // Acciones del mes actual
  const monthActions = useMemo(() => {
    return filteredActions.filter(a => {
      const d = new Date(a.datetime);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }, [filteredActions, currentMonth, currentYear]);

  // Acciones del día seleccionado
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const dayActions = useMemo(() => {
    return filteredActions.filter(a => {
      const d = new Date(a.datetime);
      return d.toISOString().split('T')[0] === selectedDateStr;
    }).sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }, [filteredActions, selectedDateStr]);

  // Agrupar por días del mes (para vista mes)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthGrid = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    const dayActions = filteredActions.filter(a => {
      const d = new Date(a.datetime);
      return d.toISOString().split('T')[0] === dateStr;
    });
    return { day, date, dateStr, count: dayActions.length, actions: dayActions };
  });

  // Navegación
  const goToPrevMonth = () => setSelectedDate(new Date(currentYear, currentMonth - 1, 1));
  const goToNextMonth = () => setSelectedDate(new Date(currentYear, currentMonth + 1, 1));

  // Categorías para filtro
  const categoryLabels = {
    webinar: 'Webinar', talk: 'Charla', protest: 'Manifestación',
    bds: 'Acción BDS', strike: 'Huelga', march: 'Marcha',
    solidarity_action: 'Acción Solidaria', workshop: 'Taller'
  };

  const clearFilters = () => {
    setFilterCampaignId('');
    setFilterCategory('');
    setShowPast(true);
    setShowFuture(true);
  };

  if (loading) return <AdminLayout title="Calendario"><p className="text-center py-12 text-gray-500">Cargando calendario...</p></AdminLayout>;

  return (
    <AdminLayout title="Calendario">
      {/* Filtros y métricas */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${viewMode === 'month' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Vista mes
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${viewMode === 'day' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Vista día
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Campaña:</label>
            <select
              value={filterCampaignId}
              onChange={(e) => setFilterCampaignId(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
            >
              <option value="">Todas</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Categoría:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
            >
              <option value="">Todas</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowPast(!showPast)}
              className={`px-2 py-1 rounded text-xs font-medium border ${showPast ? 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-700' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
            >
              Pasadas {showPast ? '✓' : ''}
            </button>
            <button
              onClick={() => setShowFuture(!showFuture)}
              className={`px-2 py-1 rounded text-xs font-medium border ${showFuture ? 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-700' : 'bg-gray-100 border-gray-300 text-gray-600'}`}
            >
              Futuras {showFuture ? '✓' : ''}
            </button>
            <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-fuchsia-700 flex items-center gap-1">
              <FaTimes className="w-3 h-3" /> Limpiar filtros
            </button>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <span className="text-xs text-gray-500">Total acciones visibles: <strong className="text-gray-800">{filteredActions.length}</strong></span>
          <span className="text-xs text-gray-500">Este mes: <strong className="text-gray-800">{monthActions.length}</strong></span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendario visual */}
        <div className="lg:w-1/2 bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-4">
          {/* Navegación */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={goToPrevMonth} className="p-2 text-gray-600 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg">
              <FaChevronLeft />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {selectedDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={goToNextMonth} className="p-2 text-gray-600 hover:text-fuchsia-700 hover:bg-fuchsia-50 rounded-lg">
              <FaChevronRight />
            </button>
          </div>

          {/* Vista de mes: cuadrícula de días */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                <div key={d} className="text-xs font-semibold text-gray-500 py-1">{d}</div>
              ))}
              {/* Ajuste para que el primer día empiece en la columna correcta */}
              {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2"></div>
              ))}
              {monthGrid.map(({ day, date, dateStr, count, actions }) => {
                const isToday = date.toDateString() === now.toDateString();
                const isSelected = dateStr === selectedDateStr;
                return (
                  <button
                    key={day}
                    onClick={() => { setSelectedDate(date); setViewMode('day'); }}
                    className={`p-2 rounded-lg text-sm relative transition-colors ${
                      isSelected
                        ? 'bg-fuchsia-100 text-fuchsia-700 font-bold shadow-sm'
                        : isToday
                        ? 'bg-purple-50 text-purple-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="block">{day}</span>
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-fuchsia-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Vista día: muestra el detalle del día seleccionado */}
          {viewMode === 'day' && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="text-xs text-fuchsia-600 hover:underline"
                >
                  Ir a hoy
                </button>
              </div>
              {dayActions.length === 0 ? (
                <p className="text-gray-500 text-sm">Sin acciones para este día.</p>
              ) : (
                <ul className="space-y-2">
                  {dayActions.map(action => (
                    <li key={action.id} className="p-3 bg-fuchsia-50 rounded-lg border border-fuchsia-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link href={`/admin/actions/${action.id}/edit`} className="font-medium text-fuchsia-700 hover:underline">
                            {action.title}
                          </Link>
                          <div className="text-xs text-gray-500 mt-1">
                            {categoryLabels[action.category] || action.category} | {new Date(action.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {action.campaignId && (
                              <span> | Campaña: {campaigns.find(c => c.id === action.campaignId)?.name || ''}</span>
                            )}
                          </div>
                        </div>
                        <Link href={`/admin/actions/${action.id}/edit`} className="text-xs text-gray-400 hover:text-fuchsia-600">
                          Editar
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Lista de acciones del mes (acceso rápido) */}
        <div className="lg:w-1/2 bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FaFilter className="text-fuchsia-500" />
            {viewMode === 'month' ? 'Acciones del mes' : 'Acciones del día'}
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {(viewMode === 'month' ? monthActions : dayActions).map(action => (
              <div key={action.id} className="p-2 rounded-lg hover:bg-fuchsia-50 transition-colors flex items-center justify-between">
                <div>
                  <Link href={`/admin/actions/${action.id}/edit`} className="text-sm font-medium text-gray-800 hover:text-fuchsia-700">
                    {action.title}
                  </Link>
                  <div className="text-xs text-gray-500">
                    {new Date(action.datetime).toLocaleDateString()} - {categoryLabels[action.category]}
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${new Date(action.datetime) < now ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}`}>
                  {new Date(action.datetime) < now ? 'Pasada' : 'Próxima'}
                </span>
              </div>
            ))}
            {((viewMode === 'month' && monthActions.length === 0) || (viewMode === 'day' && dayActions.length === 0)) && (
              <p className="text-gray-500 text-sm">No hay acciones en este período.</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminCalendar;