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
    if (!selectedDate) return [];
    return actions.filter(action => getLocalDateStr(action.datetime) === selectedDate);
  }, [actions, selectedDate]);

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = getLocalDateStr(date);
    const dayActions = actionsByDate.get(dateStr);
    if (!dayActions) return null;
    return (
      <div className="flex flex-wrap justify-center gap-0.5 mt-1">
        {dayActions.slice(0, 3).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-red-500" />
        ))}
      </div>
    );
  };

  if (loading) return <Layout title="Cargando..."><p className="text-center py-20">Cargando...</p></Layout>;
  if (!bds) return <Layout title="No encontrada"><p className="text-center py-20">Campaña BDS no encontrada.</p></Layout>;

  return (
    <Layout title={`${bds.name} - Voces Palestinas por la Justicia`}>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Cabecera de la campaña */}
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div className="md:w-1/3">
            {bds.imageUrl ? (
              <img src={`${baseUrl}${bds.imageUrl}`} alt={bds.name} className="w-full h-64 object-cover rounded-xl shadow-md" />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                Sin imagen
              </div>
            )}
          </div>
          <div className="md:w-2/3">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-6 h-6 rounded-full" style={{ backgroundColor: bds.color }} />
              <h1 className="text-3xl font-bold text-gray-800">{bds.name}</h1>
            </div>
            <p className="text-gray-600 text-lg mb-4">{bds.description || 'Sin descripción'}</p>
            {bds.groups && bds.groups.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Grupos de la campaña</h3>
                <div className="flex flex-wrap gap-2">
                  {bds.groups.map((g, i) => (
                    <a key={i} href={g.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm hover:bg-gray-200">
                      {g.platform === 'whatsapp' ? '📱 WhatsApp' : g.platform === 'telegram' ? '✈️ Telegram' : g.platform === 'signal' ? '🔒 Signal' : g.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {bds.documentLink && (
              <a href={bds.documentLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-fuchsia-600 hover:underline text-sm">
                📄 Documento externo
              </a>
            )}
            {bds.document && (
              <a href={`${baseUrl}${bds.document}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-fuchsia-600 hover:underline text-sm ml-4">
                📁 Descargar documento
              </a>
            )}
          </div>
        </div>

        {/* Calendario */}
        <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">Calendario de acciones</h2>
        <div className="flex justify-center mb-10">
          <Calendar
            onChange={(value) => setSelectedDate(getLocalDateStr(value))}
            value={selectedDate ? new Date(selectedDate + 'T12:00:00') : null}
            tileContent={tileContent}
            className="rounded-lg border border-gray-200 shadow-sm p-2 bg-white"
            locale="es-ES"
          />
        </div>

        {/* Acciones del día seleccionado */}
        {selectedDate && (
          <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              Acciones del {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            {filteredActions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay acciones para este día.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredActions.map(action => {
                  const actionDate = new Date(action.datetime);
                  const isPast = actionDate < now;
                  const catStyle = categoryStyles[action.category] || { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' };
                  const catLabel = categoryLabels[action.category] || action.category;
                  const isOnline = action.locationType === 'online';
                  let imageUrl = null;
                  if (action.featuredImage) {
                    imageUrl = `${baseUrl}${action.featuredImage}`;
                  } else if (action.images && action.images.length > 0) {
                    imageUrl = `${baseUrl}${action.images[0].url}`;
                  }

                  return (
                    <Link key={action.id} href={`/acciones/${action.id}`} className="group">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition h-full flex flex-col">
                        {imageUrl && (
                          <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                            <img src={imageUrl} alt={action.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                          </div>
                        )}
                        <div className="p-3 flex flex-col flex-1">
                          <h3 className="text-sm font-semibold text-gray-600 line-clamp-2 mb-1">{action.title}</h3>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs mb-1.5">
                            <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium border" style={catStyle}>{catLabel}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${isOnline ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                              {isOnline ? '💻 Online' : '📍 Presencial'}
                            </span>
                            <span className="text-[10px] text-gray-500">{actionDate.toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 flex-1">{action.description || 'Sin descripción'}</p>
                          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                            <span className={`text-[10px] font-medium ${isPast ? 'text-gray-500' : 'text-green-600'}`}>{isPast ? 'Pasado' : 'Próximo'}</span>
                            <span className="text-fuchsia-600 group-hover:underline text-xs font-medium">Ver más →</span>
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
      </div>
    </Layout>
  );
}