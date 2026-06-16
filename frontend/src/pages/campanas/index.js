import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';
import 'react-calendar/dist/Calendar.css';
import { categoryLabels, categoryStyles } from '../../utils/categoryConfig';

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

  const filteredCampaigns = useMemo(() => {
    if (!selectedDate) return campaigns;
    const dateStr = getLocalDateStr(selectedDate);
    const actionsOnDate = actionsByDate.get(dateStr) || [];
    const campaignIds = new Set(actionsOnDate.map(a => a.campaignId));
    return campaigns.filter(c => campaignIds.has(c.id));
  }, [selectedDate, campaigns, actionsByDate]);

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

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
      return 'bg-green-600 text-white rounded-lg';
    }
    return null;
  };

  return (
    <Layout title="Campañas - Voces Palestinas por la Justicia">
      <div className="container mx-auto px-4 py-8 pb-16">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-600">Campañas</h1>

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-gray-600">Calendario de Campañas</h2>
          <div className="flex gap-2">
            <button onClick={() => setTimeFilter('todas')} className={`px-4 py-2 rounded-lg border font-medium text-sm ${timeFilter === 'todas' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Todas</button>
            <button onClick={() => setTimeFilter('futuras')} className={`px-4 py-2 rounded-lg border font-medium text-sm ${timeFilter === 'futuras' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Futuras</button>
            <button onClick={() => setTimeFilter('pasadas')} className={`px-4 py-2 rounded-lg border font-medium text-sm ${timeFilter === 'pasadas' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Pasadas</button>
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="px-4 py-2 rounded-lg border text-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                ✕ Limpiar fecha
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <div className="p-0 bg-transparent">
              <style jsx>{`
                .react-calendar__month-view__weekdays abbr {
                  text-decoration: none !important;
                }
                .react-calendar__month-view__weekdays__weekday:first-child abbr {
                  color: #dc2626 !important;
                }
                .react-calendar__navigation__label:hover {
                  text-decoration: underline;
                  text-decoration-color: #3b82f6;
                  text-underline-offset: 4px;
                }
                .react-calendar__tile:not(.bg-green-600):hover abbr {
                  text-decoration: underline;
                  text-decoration-color: #10b981;
                  text-underline-offset: 2px;
                }
              `}</style>
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate || new Date()}
                tileContent={tileContent}
                tileClassName={tileClassName}
                className="!border-0 !shadow-none !bg-transparent w-full text-lg"
                navigationLabel={({ date }) => (
                  <span className="text-gray-700 font-semibold px-2 py-1 rounded transition-colors cursor-pointer">
                    {date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              />
            </div>
          </div>

          <div className="lg:w-3/4">
            {loading ? <p className="text-gray-600">Cargando...</p> : filteredCampaigns.length === 0 ? (
              <p className="text-gray-600">{selectedDate ? 'Ninguna campaña tiene acciones en esta fecha.' : 'No hay campañas activas.'}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCampaigns.map(campaign => {
                  const dateStr = selectedDate ? getLocalDateStr(selectedDate) : null;
                  const campaignActions = selectedDate
                    ? (actionsByDate.get(dateStr) || []).filter(a => a.campaignId === campaign.id)
                    : [];
                  return (
                    <Link key={campaign.id} href={`/campanas/${campaign.id}`} className="group block">
                      <div
                        className="rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border"
                        style={{
                          backgroundColor: `${campaign.color}10`,
                          borderColor: campaign.color,
                        }}
                      >
                        {campaign.imageUrl && (
                          <img src={`${process.env.NEXT_PUBLIC_BASE_URL}${campaign.imageUrl}`} alt={campaign.name} className="h-36 w-full object-cover" />
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-700 group-hover:text-red-600 transition-colors mb-2">
                            {campaign.name}
                          </h3>
                          {!selectedDate && <p className="text-sm text-gray-600 line-clamp-3">{campaign.description || 'Sin descripción'}</p>}
                          {selectedDate && campaignActions.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {campaignActions.map(action => {
                                const isPast = new Date(action.datetime) < now;
                                const isOnline = action.locationType === 'online';
                                const catStyle = categoryStyles[action.category] || { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' };
                                const catLabel = categoryLabels[action.category] || action.category;
                                return (
                                  <div key={action.id} className={`text-sm p-2 rounded ${isPast ? 'bg-gray-100' : 'bg-green-50'}`}>
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <span className="font-medium text-gray-700">{action.title}</span>
                                      </div>
                                      <span className="text-xs px-2 py-0.5 rounded-full border" style={catStyle}>
                                        {catLabel}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${isOnline ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{isOnline ? '💻 Online' : '📍 Presencial'}</span>
                                      <span>{new Date(action.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      <span>{isPast ? '(Pasada)' : '(Próxima)'}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
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