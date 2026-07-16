import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import api from '../../lib/axios';
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

export default function BDSList() {
  const [bdsList, setBdsList] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeFilter, setTimeFilter] = useState('todas');
  const [filterLocation, setFilterLocation] = useState('todos');
  const [filterCategory, setFilterCategory] = useState('todas');
  const [filterUrgency, setFilterUrgency] = useState(false);
  const [error, setError] = useState(null);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
  const whatsappLink = process.env.NEXT_PUBLIC_BDS_WHATSAPP || '#';
  const telegramLink = process.env.NEXT_PUBLIC_BDS_TELEGRAM || '#';
  const signalLink = process.env.NEXT_PUBLIC_BDS_SIGNAL || '#';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bdsRes, actionsRes] = await Promise.all([
          api.get('/bds'),
          api.get('/actions?bdsId=any'),
        ]);
        setBdsList(bdsRes.data);
        setActions(actionsRes.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching BDS data:', err);
        setError('No se pudieron cargar las campañas BDS.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const bdsMap = useMemo(() => bdsList.reduce((m, b) => ({ ...m, [b.id]: b }), {}), [bdsList]);
  const actionsByDate = useMemo(() => {
    const map = new Map();
    actions.forEach(action => {
      const dateStr = getLocalDateStr(action.datetime);
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr).push(action);
    });
    return map;
  }, [actions]);

  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      const actionDate = new Date(action.datetime);
      if (timeFilter === 'futuras' && actionDate <= now) return false;
      if (timeFilter === 'pasadas' && actionDate > now) return false;
      if (filterLocation === 'online' && action.locationType !== 'online') return false;
      if (filterLocation === 'presencial' && action.locationType !== 'presencial') return false;
      if (filterCategory !== 'todas' && action.category !== filterCategory) return false;
      if (filterUrgency && !action.urgent) return false;
      if (selectedDate) {
        const actionDateStr = getLocalDateStr(action.datetime);
        if (actionDateStr !== selectedDate) return false;
      }
      return true;
    });
  }, [actions, timeFilter, filterLocation, filterCategory, filterUrgency, selectedDate, now]);

  const bdsActions = useMemo(() => actions.filter(a => a.bdsId), [actions]);

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const sel = selectedDate ? new Date(selectedDate + 'T12:00:00') : null;
    if (sel && d.toDateString() === sel.toDateString()) {
      if (d.getTime() === now.getTime()) return 'selected-today';
      return d < now ? 'selected-past' : 'selected-future';
    }
    return null;
  };
  const tileContent = () => null;

  const toggleLocation = (value) => setFilterLocation(prev => prev === value ? 'todos' : value);

  const CATEGORIES = ['todas','protest','march','bds','solidarity_action','workshop','webinar','talk','strike'];

  if (loading) return <Layout title="BDS Campañas y Acciones - Voces Palestinas por la Justicia" bgClass="bg-gradient-to-b from-[#7B2D8B]/10 to-white min-h-screen"><div className="text-center py-20 text-gray-600">Cargando...</div></Layout>;

  const headerDate = selectedDate ? new Date(selectedDate + 'T12:00:00') : null;
  const formattedHeaderDate = headerDate ? headerDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return (
    <Layout title="BDS Campañas y Acciones - Voces Palestinas por la Justicia" bgClass="bg-gradient-to-b from-[#7B2D8B]/10 to-white min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-700">BDS Campañas y Acciones</h1>
            <span className="inline-block bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">BDS</span>
          </div>
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">
            Boicot · Desinversión · Sanciones
            <span className="mx-2 text-gray-300">|</span>
            <a href="https://bdsmovement.net/es" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg> Movimiento BDS
            </a>
          </p>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">{error}<button onClick={() => window.location.reload()} className="ml-2 underline">Reintentar</button></div>}

        {/* Filtros */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${filterCategory === cat ? 'border-red-600 text-red-600 bg-red-50' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>
                {cat === 'todas' ? 'Todas' : (categoryLabels[cat] || cat)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex gap-1.5">
              <button onClick={() => setTimeFilter('todas')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${timeFilter === 'todas' ? 'border-red-600 text-red-600 bg-red-50' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>Todas</button>
              <button onClick={() => setTimeFilter('futuras')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${timeFilter === 'futuras' ? 'border-red-600 text-red-600 bg-red-50' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>Futuras</button>
              <button onClick={() => setTimeFilter('pasadas')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${timeFilter === 'pasadas' ? 'border-red-600 text-red-600 bg-red-50' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>Pasadas</button>
            </div>
            <div className="w-px h-6 bg-gray-300 hidden sm:block" />
            <button onClick={() => setFilterUrgency(!filterUrgency)} className={`px-3 py-1.5 rounded-full border text-sm font-medium transition ${filterUrgency ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>🔥</button>
            <div className="w-px h-6 bg-gray-300 hidden sm:block" />
            <div className="flex gap-1.5">
              <button onClick={() => toggleLocation('presencial')} className={`px-4 py-1.5 rounded-full border text-sm font-medium transition ${filterLocation === 'presencial' ? 'border-fuchsia-500 text-fuchsia-700 bg-fuchsia-50' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>Presencial</button>
              <button onClick={() => toggleLocation('online')} className={`px-4 py-1.5 rounded-full border text-sm font-medium transition ${filterLocation === 'online' ? 'border-fuchsia-500 text-fuchsia-700 bg-fuchsia-50' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>Online</button>
            </div>
          </div>
        </div>

        {/* Calendario */}
        <div className="flex justify-center mb-8">
          <Calendar
            onChange={(value) => setSelectedDate(getLocalDateStr(value))}
            value={selectedDate ? new Date(selectedDate + 'T12:00:00') : null}
            tileClassName={tileClassName}
            tileContent={tileContent}
            className="rounded-lg border border-gray-200 shadow-sm p-2 bg-white"
            locale="es-ES"
          />
        </div>

        {/* Tarjetas BDS */}
        <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center gap-2"><span className="w-2 h-8 bg-red-600 rounded-full"></span> Campañas activas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
          {bdsList.map(bds => (
            <Link key={bds.id} href={`/bds/${bds.id}`} className="group">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 h-full flex flex-col hover:border-red-300">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2"><span className="w-4 h-4 rounded-full" style={{ backgroundColor: bds.color }} /><h3 className="text-lg font-semibold text-gray-800 group-hover:text-red-600 transition-colors">{bds.name}</h3></div>
                  <p className="text-sm text-gray-600 line-clamp-2">{bds.description || 'Sin descripción'}</p>
                  <div className="mt-3 text-xs text-gray-400">{bdsActions.filter(a => a.bdsId === bds.id).length} acciones</div>
                </div>
                {bds.imageUrl && <div className="h-40 bg-gray-100 overflow-hidden"><img src={`${baseUrl}${bds.imageUrl}`} alt={bds.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /></div>}
              </div>
            </Link>
          ))}
          {bdsList.length === 0 && <p className="text-gray-500 col-span-full text-center">No hay campañas BDS todavía.</p>}
        </div>

        {/* Acciones del día */}
        {selectedDate && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center gap-2"><span className="w-2 h-8 bg-red-600 rounded-full"></span> Acciones del {formattedHeaderDate}</h2>
            {filteredActions.length === 0 ? <p className="text-gray-500 text-center py-4">No hay acciones para este día.</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredActions.map(action => {
                  const actionDate = new Date(action.datetime);
                  const isPast = actionDate < now;
                  const catStyle = categoryStyles[action.category] || { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' };
                  const catLabel = categoryLabels[action.category] || action.category;
                  const isOnline = action.locationType === 'online';
                  const bds = bdsMap[action.bdsId];
                  let imageUrl = null;
                  if (action.featuredImage) imageUrl = `${baseUrl}${action.featuredImage}`;
                  else if (action.images && action.images.length > 0) imageUrl = `${baseUrl}${action.images[0].url}`;
                  return (
                    <Link key={action.id} href={`/acciones/${action.id}`} className="group">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition h-full flex flex-col">
                        {imageUrl && <div className="relative w-full h-40 bg-gray-100 overflow-hidden"><img src={imageUrl} alt={action.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} /></div>}
                        <div className="p-3 flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1"><h3 className="text-sm font-semibold text-gray-600 line-clamp-2 flex-1">{action.title}</h3>{action.urgent && <span className="flex-shrink-0 inline-block px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-medium rounded-full">🔥 Urgente</span>}</div>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs mb-1.5">
                            <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium border" style={catStyle}>{catLabel}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${isOnline ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-green-100 text-green-800 border-green-300'}`}>{isOnline ? '💻 Online' : '📍 Presencial'}</span>
                            {bds && <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-600 text-white border-red-600">BDS</span>}
                            <span className="text-[10px] text-gray-500">{actionDate.toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 flex-1">{action.description || 'Sin descripción'}</p>
                          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                            <span className={`text-[10px] font-medium ${isPast ? 'text-gray-500' : 'text-green-600'}`}>{isPast ? 'Pasado' : 'Próximo'}</span>
                            <span className="text-red-600 group-hover:underline text-xs font-medium">Ver más →</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Comunidad BDS */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Comunidad BDS</h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/grupos-chat?platform=whatsapp&filterType=bds" className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp
              </Link>
              <Link href="/grupos-chat?platform=telegram&filterType=bds" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.26.33-.538.33l.193-2.74 4.99-4.51c.217-.193-.047-.3-.334-.108l-6.14 3.87-2.64-.82c-.575-.18-.59-.58.12-.86l10.35-3.99c.48-.17.89.11.73.86z"/></svg> Telegram
              </Link>
              <Link href="/grupos-chat?platform=signal&filterType=bds" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 transition">
                <img src="/assets/icons/Signal-Logo.svg" alt="Signal" className="w-5 h-5" /> Signal
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-3">Únete a los grupos de chat para coordinar acciones BDS y compartir información</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .react-calendar__month-view__weekdays__weekend abbr { color: inherit !important; }
        .react-calendar__month-view__weekdays__weekday:last-child abbr { color: #f71717  !important; }
        .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none !important; }

        .react-calendar__month-view__days__day--weekend { color: inherit !important; }
        .react-calendar__tile:nth-child(7n) { color: #f71717  !important; }

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