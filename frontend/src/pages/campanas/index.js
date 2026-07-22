import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import api from '../../lib/axios';
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const whatsappLink = process.env.NEXT_PUBLIC_CAMPAIGNS_WHATSAPP || '#';
  const telegramLink = process.env.NEXT_PUBLIC_CAMPAIGNS_TELEGRAM || '#';
  const signalLink = process.env.NEXT_PUBLIC_CAMPAIGNS_SIGNAL || '#';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campRes, actionsRes] = await Promise.all([
          api.get('/campaigns'),
          api.get('/actions'),
        ]);
        setCampaigns(campRes.data);
        setActions(actionsRes.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('No se pudieron cargar las campañas.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayStr = getLocalDateStr(now);

  const actionsByDate = useMemo(() => {
    const map = new Map();
    actions.forEach(action => {
      const dateStr = getLocalDateStr(action.datetime);
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr).push(action);
    });
    return map;
  }, [actions]);

  const hasActionToday = (campaignId) => {
    const campaignActions = actions.filter(a => a.campaignId === campaignId);
    return campaignActions.some(a => getLocalDateStr(a.datetime) === todayStr);
  };

  const isActive = (campaignId) => actions.filter(a => a.campaignId === campaignId).some(action => new Date(action.datetime) > now);

  const hasUrgency = (campaignId) => {
    const campaignActions = actions.filter(a => a.campaignId === campaignId);
    return campaignActions.some(a => a.urgent);
  };

  const getNextAction = (campaignId) => {
    const upcoming = actions
      .filter(a => a.campaignId === campaignId && new Date(a.datetime) > now)
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    return upcoming[0] || null;
  };

  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    if (selectedDate) {
      const dateStr = getLocalDateStr(selectedDate);
      const actionsOnDate = actionsByDate.get(dateStr) || [];
      const campaignIds = new Set(actionsOnDate.map(a => a.campaignId));
      filtered = filtered.filter(c => campaignIds.has(c.id));
    }

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

    if (filterUrgency === 'urgente') {
      filtered = filtered.filter(campaign => hasUrgency(campaign.id));
    }

    return filtered.sort((a, b) => {
      if (selectedDate) {
        const aActive = isActive(a.id);
        const bActive = isActive(b.id);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        const aNext = getNextAction(a.id);
        const bNext = getNextAction(b.id);
        if (aNext && bNext) return new Date(aNext.datetime) - new Date(bNext.datetime);
        if (aNext) return -1;
        if (bNext) return 1;
        return 0;
      } else {
        const aToday = hasActionToday(a.id);
        const bToday = hasActionToday(b.id);
        if (aToday && !bToday) return -1;
        if (!aToday && bToday) return 1;

        const aActive = isActive(a.id);
        const bActive = isActive(b.id);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        const aNext = getNextAction(a.id);
        const bNext = getNextAction(b.id);
        if (aNext && bNext) return new Date(aNext.datetime) - new Date(bNext.datetime);
        if (aNext) return -1;
        if (bNext) return 1;
        return 0;
      }
    });
  }, [campaigns, selectedDate, actionsByDate, actions, timeFilter, filterUrgency, now, todayStr]);

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    if (selectedDate) {
      const sel = new Date(selectedDate + 'T12:00:00');
      if (d.toDateString() === sel.toDateString()) {
        if (d.getTime() === now.getTime()) return 'selected-today';
        return d < now ? 'selected-past' : 'selected-future';
      }
      return null;
    }

    if (d.getTime() === now.getTime()) return 'selected-today';
    return null;
  };

  const tileContent = () => null;

  const filterBtnBase = "px-4 py-2 rounded-lg text-sm font-medium transition border border-gray-300";

  if (loading) return <Layout bgClass="bg-gradient-to-b from-[#7B2D8B]/10 to-white min-h-screen"><div className="text-center py-20">Cargando...</div></Layout>;

  return (
    <Layout title="Campañas - Voces Palestinas por la Justicia" bgClass="bg-gradient-to-b from-[#7B2D8B]/10 to-white min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-700 mb-6 text-center">Campañas</h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">{error}<button onClick={() => window.location.reload()} className="ml-2 underline font-medium hover:text-red-900">Reintentar</button></div>}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilterUrgency('todas')} className={`${filterBtnBase} ${filterUrgency === 'todas' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Todas</button>
            <button onClick={() => setFilterUrgency('urgente')} className={`${filterBtnBase} ${filterUrgency === 'urgente' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>🔥 Urgentes</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setTimeFilter('todas')} className={`${filterBtnBase} ${timeFilter === 'todas' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Todas</button>
            <button onClick={() => setTimeFilter('futuras')} className={`${filterBtnBase} ${timeFilter === 'futuras' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Futuras</button>
            <button onClick={() => setTimeFilter('pasadas')} className={`${filterBtnBase} ${timeFilter === 'pasadas' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Pasadas</button>
            {selectedDate && <button onClick={() => setSelectedDate(null)} className="px-4 py-2 rounded-lg border text-sm bg-white text-gray-700 border-gray-300 hover:bg-gray-50">✕ Limpiar fecha</button>}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date()}
              tileClassName={tileClassName}
              tileContent={tileContent}
              navigationLabel={({ date }) => (
                <span className="text-gray-700 font-semibold px-2 py-1 rounded transition-colors cursor-pointer">
                  {date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
              )}
              locale="es-ES"
              className="rounded-lg border border-gray-200 shadow-sm p-2 bg-white"
            />
          </div>

          <div className="lg:w-3/4">
            {filteredCampaigns.length === 0 ? (
              <p className="text-gray-600">{selectedDate ? 'Ninguna campaña tiene acciones en esta fecha.' : 'No hay campañas que coincidan con los filtros.'}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredCampaigns.map(campaign => {
                  const nextAction = getNextAction(campaign.id);
                  const activeActions = actions.filter(a => a.campaignId === campaign.id && new Date(a.datetime) > now).length;
                  let imageUrl = null;
                  if (campaign.imageUrl) imageUrl = `${baseUrl}${campaign.imageUrl}`;

                  return (
                    <Link key={campaign.id} href={`/campanas/${campaign.id}`} className="group">
                      <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition h-full flex flex-col" style={{ borderColor: campaign.color, background: `linear-gradient(135deg, ${campaign.color}10 0%, ${campaign.color}05 100%)` }}>
                        {imageUrl && <div className="relative w-full h-48 bg-gray-100 overflow-hidden"><img src={imageUrl} alt={campaign.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} /></div>}
                        <div className="p-6 flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-2"><span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: campaign.color }} /><h3 className="text-lg font-semibold text-gray-700 line-clamp-2 flex-1 group-hover:text-gray-900">{campaign.name}</h3></div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
                            {activeActions > 0 && <span className="font-medium text-green-600">{activeActions} acción{activeActions !== 1 ? 'es' : ''} activa{activeActions !== 1 ? 's' : ''}</span>}
                            {nextAction && <><span className="text-gray-300">•</span><span>Próxima: {new Date(nextAction.datetime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })} a las {new Date(nextAction.datetime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span></>}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 flex-1">{campaign.description || 'Sin descripción'}</p>
                          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end"><span className="text-fuchsia-600 group-hover:underline text-sm font-medium">Ver más →</span></div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Comunidad de Campañas</h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/grupos-chat?platform=whatsapp&filterType=campaign" className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp
              </Link>
              <Link href="/grupos-chat?platform=telegram&filterType=campaign" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.26.33-.538.33l.193-2.74 4.99-4.51c.217-.193-.047-.3-.334-.108l-6.14 3.87-2.64-.82c-.575-.18-.59-.58.12-.86l10.35-3.99c.48-.17.89.11.73.86z"/></svg> Telegram
              </Link>
              <Link href="/grupos-chat?platform=signal&filterType=campaign" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 transition">
                <img src="/assets/icons/Signal-Logo.svg" alt="Signal" className="w-5 h-5" /> Signal
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-3">Únete a los grupos de chat de las campañas y colabora activamente</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .react-calendar__month-view__weekdays__weekend abbr { color: inherit !important; }
        .react-calendar__month-view__weekdays__weekday:last-child abbr { color: #f71717 !important; }
        .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none !important; }

        .react-calendar__month-view__days__day--weekend { color: inherit !important; }
        .react-calendar__tile:nth-child(7n) { color: #f71717 !important; }

        .react-calendar__tile--now {
          background: #fbff23 !important;
          border-radius: 9999px !important;
        }
        .react-calendar__tile--now abbr { color: #f71717 !important; }

        .react-calendar__tile--active {
          background: transparent !important;
          color: inherit !important;
        }
        .react-calendar__tile--active abbr { color: inherit !important; }

        .selected-future { background: #34D399 !important; color: inherit !important; border-radius: 9999px !important; }
        .selected-future abbr { color: inherit !important; }
        .selected-past { background: #FCA5A5 !important; color: inherit !important; border-radius: 9999px !important; }
        .selected-past abbr { color: inherit !important; }
        .selected-today { background: #fbff23 !important; color: inherit !important; border-radius: 9999px !important; }
        .selected-today abbr { color: inherit !important; }

        .react-calendar__tileContent { display: none !important; }
      `}</style>
    </Layout>
  );
}