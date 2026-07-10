import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';
import 'react-calendar/dist/Calendar.css';

const Calendar = dynamic(() => import('react-calendar'), { ssr: false });

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
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeFilter, setTimeFilter] = useState('todas');
  const [filterUrgency, setFilterUrgency] = useState('todas');
  const [error, setError] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campRes, actionsRes] = await Promise.all([
          axios.get(`${apiUrl}/campaigns`),
          axios.get(`${apiUrl}/actions`),
        ]);
        setCampaigns(campRes.data);
        setActions(actionsRes.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('No se pudieron cargar las campañas.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [apiUrl]);

  const now = new Date();
  const campaignMap = useMemo(() => campaigns.reduce((m, c) => ({ ...m, [c.id]: c }), {}), [campaigns]);

  const actionsByDate = useMemo(() => {
    const map = new Map();
    actions.forEach(action => {
      const dateStr = getLocalDateStr(action.datetime);
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr).push(action);
    });
    return map;
  }, [actions]);

  const isActive = (campaignId) => {
    const campaignActions = actions.filter(a => a.campaignId === campaignId);
    return campaignActions.some(action => new Date(action.datetime) > now);
  };

  const hasUrgency = (campaignId, urgency) => {
    const campaignActions = actions.filter(a => a.campaignId === campaignId);
    if (urgency === 'urgente') return campaignActions.some(a => a.urgent);
    return true; // 'todas'
  };

  const getNextAction = (campaignId) => {
    const upcoming = actions
      .filter(a => a.campaignId === campaignId && new Date(a.datetime) > now)
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    return upcoming[0] || null;
  };

  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;
    // Filtro por fecha del calendario
    if (selectedDate) {
      const dateStr = getLocalDateStr(selectedDate);
      const actionsOnDate = actionsByDate.get(dateStr) || [];
      const campaignIds = new Set(actionsOnDate.map(a => a.campaignId));
      filtered = filtered.filter(c => campaignIds.has(c.id));
    }
    // Filtro de tiempo (futuras/pasadas)
    if (timeFilter === 'futuras' || timeFilter === 'pasadas') {
      filtered = filtered.filter(campaign => {
        const campaignActions = actions.filter(a => a.campaignId === campaign.id);
        if (campaignActions.length === 0) return false;
        return campaignActions.some(action => {
          const actionDate = new Date(action.datetime);
          return timeFilter === 'futuras' ? actionDate > now : actionDate <= now;
        });
      });
    }
    // Filtro de urgencia (todas / urgentes)
    if (filterUrgency === 'urgente') {
      filtered = filtered.filter(campaign => hasUrgency(campaign.id, 'urgente'));
    }
    // Ordenar: activas primero
    return filtered.sort((a, b) => {
      const aActive = isActive(a.id);
      const bActive = isActive(b.id);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return 0;
    });
  }, [campaigns, selectedDate, actionsByDate, actions, timeFilter, filterUrgency, now]);

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = getLocalDateStr(date);
    const dayActions = actionsByDate.get(dateStr) || [];
    if (dayActions.length === 0) return null;
    const colors = [...new Set(dayActions.map(a => campaignMap[a.campaignId]?.color).filter(Boolean))].slice(0, 3);
    return (
      <div className="flex justify-center gap-0.5 mt-1">
        {colors.map((color, idx) => (
          <span key={idx} className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        ))}
        {dayActions.length > colors.length && <span className="text-xs text-gray-500">+</span>}
      </div>
    );
  };

  const filterBtnBase = "px-4 py-2 rounded-lg text-sm font-medium transition border border-gray-300";

  if (loading) return <Layout><div className="text-center py-20">Cargando...</div></Layout>;

  return (
    <Layout title="Campañas - Voces Palestinas por la Justicia">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-600 mb-6 text-center">Campañas</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
            <button onClick={() => window.location.reload()} className="ml-2 underline font-medium hover:text-red-900">
              Reintentar
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterUrgency('todas')}
              className={`${filterBtnBase} ${filterUrgency === 'todas' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterUrgency('urgente')}
              className={`${filterBtnBase} ${filterUrgency === 'urgente' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              🔥 Urgentes
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTimeFilter('todas')}
              className={`${filterBtnBase} ${timeFilter === 'todas' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Todas
            </button>
            <button
              onClick={() => setTimeFilter('futuras')}
              className={`${filterBtnBase} ${timeFilter === 'futuras' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Futuras
            </button>
            <button
              onClick={() => setTimeFilter('pasadas')}
              className={`${filterBtnBase} ${timeFilter === 'pasadas' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              Pasadas
            </button>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="px-4 py-2 rounded-lg border text-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                ✕ Limpiar fecha
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Calendario estilo BDS */}
          <div className="lg:w-1/4">
            <div className="p-0 bg-transparent">
              <style jsx>{`
                .react-calendar {
                  border: none !important;
                  box-shadow: none !important;
                  font-family: 'Inter', sans-serif;
                  width: 100%;
                  background: transparent !important;
                }
                .react-calendar__month-view__weekdays {
                  text-transform: uppercase;
                  font-weight: 600;
                  font-size: 0.75rem;
                  color: #6b7280;
                }
                .react-calendar__month-view__weekdays abbr {
                  text-decoration: none !important;
                }
                .react-calendar__month-view__weekdays__weekday:first-child abbr {
                  color: #dc2626 !important;
                }
                .react-calendar__navigation {
                  margin-bottom: 0.5rem;
                }
                .react-calendar__navigation__label {
                  font-weight: 600;
                  color: #374151;
                }
                .react-calendar__navigation__label:hover {
                  text-decoration: underline;
                  text-decoration-color: #3b82f6;
                  text-underline-offset: 4px;
                }
                .react-calendar__tile {
                  padding: 0.75rem 0.25rem;
                  font-size: 0.9rem;
                  border-radius: 0.5rem;
                  background: transparent;
                  transition: all 0.1s ease;
                }
                .react-calendar__tile:enabled:hover {
                  background-color: #f3f4f6;
                }
                .react-calendar__tile--active {
                  background: #10b981 !important;
                  color: white !important;
                }
                .react-calendar__tile--active abbr {
                  color: white !important;
                }
                .react-calendar__tile--now {
                  background: #fef2f2 !important;
                }
                .react-calendar__tile--now abbr {
                  color: #dc2626 !important;
                }
              `}</style>
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate || new Date()}
                tileContent={tileContent}
                navigationLabel={({ date }) => (
                  <span className="text-gray-700 font-semibold px-2 py-1 rounded transition-colors cursor-pointer">
                    {date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              />
            </div>
          </div>

          {/* Listado de campañas */}
          <div className="lg:w-3/4">
            {filteredCampaigns.length === 0 ? (
              <p className="text-gray-600">{selectedDate ? 'Ninguna campaña tiene acciones en esta fecha.' : 'No hay campañas que coincidan con los filtros.'}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredCampaigns.map(campaign => {
                  const active = isActive(campaign.id);
                  const nextAction = getNextAction(campaign.id);
                  const activeActions = actions.filter(a => a.campaignId === campaign.id && new Date(a.datetime) > now).length;

                  let imageUrl = null;
                  if (campaign.imageUrl) {
                    imageUrl = `${baseUrl}${campaign.imageUrl}`;
                  }

                  return (
                    <Link key={campaign.id} href={`/campanas/${campaign.id}`} className="group">
                      <div
                        className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition h-full flex flex-col"
                        style={{ borderColor: campaign.color }}
                      >
                        {imageUrl && (
                          <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={campaign.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              loading="lazy"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        )}
                        <div className="p-6 flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: campaign.color }}
                            />
                            <h3 className="text-lg font-semibold text-gray-700 line-clamp-2 flex-1 group-hover:text-gray-900">
                              {campaign.name}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
                            {activeActions > 0 && (
                              <span className="font-medium text-green-600">{activeActions} acción{activeActions !== 1 ? 'es' : ''} activa{activeActions !== 1 ? 's' : ''}</span>
                            )}
                            {nextAction && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span>
                                  Próxima: {new Date(nextAction.datetime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })} a las {new Date(nextAction.datetime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 flex-1">
                            {campaign.description || 'Sin descripción'}
                          </p>
                          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                            <span className="text-fuchsia-600 group-hover:underline text-sm font-medium">
                              Ver más →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}