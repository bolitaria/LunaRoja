import { useRouter } from 'next/router';
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function BDSDetalle() {
  const router = useRouter();
  const { id } = router.query;
  const [bds, setBds] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeFilter, setTimeFilter] = useState('todas');
  const [urgencyFilter, setUrgencyFilter] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [filterLocation, setFilterLocation] = useState('todos');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [bdsRes, actionsRes] = await Promise.all([
          api.get(`/bds/${id}`),
          api.get(`/actions?bdsId=${id}`),
        ]);
        setBds(bdsRes.data);
        setActions(actionsRes.data);
      } catch (error) {
        console.error('Error fetching BDS detail', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const toggleLocation = (value) => {
    setFilterLocation(prev => (prev === value ? 'todos' : value));
  };

  const filteredActions = useMemo(() => {
    let result = actions;

    // Filtro por fecha seleccionada en el calendario
    if (selectedDate) {
      const dateStr = getLocalDateStr(selectedDate);
      result = result.filter(action => getLocalDateStr(action.datetime) === dateStr);
    }

    // Filtro temporal (futuras / pasadas)
    if (timeFilter === 'futuras') {
      result = result.filter(a => new Date(a.datetime) > now);
    } else if (timeFilter === 'pasadas') {
      result = result.filter(a => new Date(a.datetime) <= now);
    }

    // Filtro de ubicación (presencial / online)
    if (filterLocation === 'online') {
      result = result.filter(a => a.locationType === 'online');
    } else if (filterLocation === 'presencial') {
      result = result.filter(a => a.locationType === 'presencial');
    }

    // Filtro de urgencia
    if (urgencyFilter) {
      result = result.filter(a => a.urgent);
    }

    // Filtro de categoría
    if (categoryFilter !== 'todas') {
      result = result.filter(a => a.category === categoryFilter);
    }

    return result;
  }, [actions, selectedDate, timeFilter, filterLocation, urgencyFilter, categoryFilter, now]);

  const tileContent = () => null;
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
    // Sin selección, hoy se muestra resaltado
    if (d.getTime() === now.getTime()) return 'selected-today';
    return null;
  };

  const timeBtnClass = (isActive) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition border border-gray-300 ${
      isActive
        ? 'bg-[#FE2C55] text-white border-[#FE2C55]'
        : 'bg-white text-gray-700 hover:bg-gray-100'
    }`;

  const locationBtnClass = (isActive) =>
    `px-2 py-1 rounded-full border transition text-xs ${
      isActive
        ? 'border-purple-400 bg-purple-100 text-purple-700'
        : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'
    }`;

  if (loading) return <Layout title="Cargando..."><div className="flex justify-center items-center min-h-[60vh]"><div className="animate-pulse text-xl text-gray-500">Cargando campaña BDS…</div></div></Layout>;
  if (!bds) return <Layout title="No encontrada"><div className="text-center py-20 text-gray-500">Campaña BDS no encontrada</div></Layout>;

  return (
    <Layout title={`${bds.name} - BDS Campañas y Acciones`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
        <button onClick={() => router.back()} className="inline-flex items-center text-sm text-gray-600 hover:text-[#E30613] transition mb-2">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Volver
        </button>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6 max-w-7xl">
        {/* Cabecera de la campaña BDS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8 flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 flex-shrink-0">
            {bds.imageUrl ? (
              <img src={`${baseUrl}${bds.imageUrl}`} alt={bds.name} className="w-full h-64 object-cover rounded-xl shadow-md border border-gray-200" />
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">Sin imagen</div>
            )}
          </div>

          <div className="md:w-2/3 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold text-gray-700">{bds.name}</h1>
              <span
                className="inline-block w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                style={{ backgroundColor: bds.color }}
                title={`Color de la campaña: ${bds.color}`}
              />
              {/* Badge BDS estilo movimiento */}
              <span className="ml-auto inline-block bg-[#E30613] text-white text-lg font-extrabold uppercase tracking-tighter px-5 py-2 rounded-full">
                BDS
              </span>
            </div>

            <p className="text-gray-600 text-lg mb-6">{bds.description || 'Sin descripción'}</p>

            {bds.groups?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Grupos de la campaña</h3>
                <div className="flex flex-wrap gap-2">
                  {bds.groups.map((g, i) => {
                    let icon;
                    if (g.platform === 'whatsapp') icon = <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472..."/></svg>;
                    else if (g.platform === 'telegram') icon = <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12..."/></svg>;
                    else if (g.platform === 'signal') icon = <img src="/assets/icons/Signal-Logo.svg" alt="Signal" className="w-4 h-4" />;
                    return (
                      <a key={i} href={g.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-700 transition">
                        {icon}
                        <span className="capitalize">{g.platform}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-auto flex flex-wrap justify-end gap-3 pt-4">
              {bds.documentLink && (
                <a
                  href={bds.documentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#E30613] transition underline underline-offset-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  Documento externo
                </a>
              )}
              {bds.document && (
                <a
                  href={`${baseUrl}${bds.document}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition text-sm font-medium"
                >
                  📁 Descargar documento
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Sección de Acciones con filtros y calendario */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-red-600 rounded-full"></span>
            Acciones de la campaña
          </h2>

          {/* Filtros en una sola línea */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Temporal */}
            {['todas','futuras','pasadas'].map(opt => (
              <button
                key={opt}
                onClick={() => setTimeFilter(opt)}
                className={timeBtnClass(timeFilter === opt)}
              >
                {opt === 'todas' ? 'Todas' : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}

            {/* Ubicación */}
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={() => toggleLocation('presencial')}
                className={locationBtnClass(filterLocation === 'presencial')}
              >
                📍 Presencial
              </button>
              <button
                onClick={() => toggleLocation('online')}
                className={locationBtnClass(filterLocation === 'online')}
              >
                💻 Online
              </button>
            </div>

            {/* Urgencia */}
            <button
              onClick={() => setUrgencyFilter(!urgencyFilter)}
              className={`ml-2 px-2 py-1 rounded-full border transition text-sm ${
                urgencyFilter
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'
              }`}
              aria-label="Solo urgentes"
            >
              🔥
            </button>

            {/* Categorías: borde fucsia siempre */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="ml-auto px-3 py-1.5 rounded-lg border border-fuchsia-500 bg-white text-sm text-gray-700 hover:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-300 transition"
            >
              <option value="todas">Todas las categorías</option>
              {Object.keys(categoryLabels).map(cat => (
                <option key={cat} value={cat}>{categoryLabels[cat]}</option>
              ))}
            </select>

            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition"
              >
                ✕ Limpiar fecha
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col items-center">
              <div className="sticky top-24">
                <Calendar
                  onChange={(value) => setSelectedDate(getLocalDateStr(value))}
                  value={selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date()}
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  className="rounded-xl border border-gray-200 shadow-sm p-2 bg-white"
                  locale="es-ES"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              {filteredActions.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-gray-400">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span>No hay acciones con los filtros actuales</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredActions.map(action => {
                    const actionDate = new Date(action.datetime);
                    const isPast = actionDate < now;
                    const catStyle = categoryStyles[action.category] || { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' };
                    const catLabel = categoryLabels[action.category] || action.category;
                    const isOnline = action.locationType === 'online';
                    let imageUrl = action.featuredImage ? `${baseUrl}${action.featuredImage}` : action.images?.[0]?.url ? `${baseUrl}${action.images[0].url}` : null;

                    return (
                      <Link key={action.id} href={`/acciones/${action.id}`} className="group">
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all h-full flex flex-col">
                          {imageUrl && <img src={imageUrl} alt={action.title} className="h-36 w-full object-cover" />}
                          <div className="p-4 flex flex-col flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-gray-700 group-hover:text-red-600 transition-colors line-clamp-2">{action.title}</h4>
                              {action.urgent && <span className="flex-shrink-0 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full">🔥</span>}
                            </div>
                            <div className="flex flex-wrap gap-1.5 text-[10px] mb-2">
                              <span className="px-2 py-0.5 rounded-full border" style={catStyle}>{catLabel}</span>
                              <span className={`px-2 py-0.5 rounded-full border ${isOnline ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-green-100 text-green-800 border-green-300'}`}>{isOnline ? '💻 Online' : '📍 Presencial'}</span>
                              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white">BDS</span>
                            </div>
                            <p className="text-xs text-gray-500 flex-1 line-clamp-2">{action.description || ''}</p>
                            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                              <span className={isPast ? 'text-gray-400' : 'text-green-600 font-medium'}>{isPast ? 'Pasado' : 'Próximo'}</span>
                              <span className="text-red-600 group-hover:underline">Ver más →</span>
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

        {/* Comunidad BDS */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Comunidad BDS</h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="#" className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp
              </a>
              <a href="#" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.26.33-.538.33l.193-2.74 4.99-4.51c.217-.193-.047-.3-.334-.108l-6.14 3.87-2.64-.82c-.575-.18-.59-.58.12-.86l10.35-3.99c.48-.17.89.11.73.86z"/></svg> Telegram
              </a>
              <a href="#" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 transition">
                <img src="/assets/icons/Signal-Logo.svg" alt="Signal" className="w-5 h-5" /> Signal
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-3">Únete a los grupos de chat para coordinar acciones BDS y compartir información</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .react-calendar__month-view__weekdays__weekend abbr { color: inherit !important; }
        .react-calendar__month-view__weekdays__weekday:last-child abbr { color: #dc2626 !important; }
        .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none !important; }

        .react-calendar__month-view__days__day--weekend { color: inherit !important; }
        .react-calendar__tile:nth-child(7n) { color: #dc2626 !important; }

        .react-calendar__tile--now {
          background: #fbff23 !important;
          border-radius: 9999px !important;
        }
        .react-calendar__tile--now abbr { color: #dc2626 !important; }

        .react-calendar__tile--active {
          background: transparent !important;
          color: inherit !important;
        }

        .react-calendar__tile:hover {
          border-radius: 9999px !important;
        }

        .selected-future { background: #34D399 !important; border-radius: 9999px !important; }
        .selected-past { background: #FCA5A5 !important; border-radius: 9999px !important; }
        .selected-today { background: #fbff23 !important; border-radius: 9999px !important; }

        .react-calendar__tileContent { display: none !important; }
      `}</style>
    </Layout>
  );
}