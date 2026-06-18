import { useRouter } from 'next/router';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
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

export default function CampanaDetalle() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeFilter, setTimeFilter] = useState('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user && ['superadmin', 'campaign_admin', 'action_admin'].includes(user.role);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [campRes, actionsRes] = await Promise.all([
          axios.get(`${apiUrl}/campaigns/${id}`),
          axios.get(`${apiUrl}/actions?campaignId=${id}`),
        ]);
        setCampaign(campRes.data);
        setActions(actionsRes.data);
      } catch (error) {
        console.error('Error fetching campaign', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, apiUrl]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

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
    let result = actions;
    if (selectedDate) {
      const dateStr = getLocalDateStr(selectedDate);
      result = actionsByDate.get(dateStr) || [];
    }
    if (timeFilter === 'futuras') result = result.filter(a => new Date(a.datetime) > now && a.isLive);
    else if (timeFilter === 'pasadas') result = result.filter(a => new Date(a.datetime) <= now || !a.isLive);
    return result;
  }, [actions, selectedDate, timeFilter, actionsByDate, now]);

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dateStr = getLocalDateStr(date);
    const dayActions = actionsByDate.get(dateStr) || [];
    if (dayActions.length === 0) return null;
    return (
      <div className="flex justify-center gap-0.5 mt-1">
        <span className={`inline-block w-2 h-2 rounded-full ${dayActions.some(a => new Date(a.datetime) > now) ? 'bg-green-500' : 'bg-gray-400'}`} />
        {dayActions.length > 1 && <span className="text-xs text-gray-600">+{dayActions.length-1}</span>}
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

  if (loading) return <Layout><p className="text-center py-20">Cargando...</p></Layout>;
  if (!campaign) return <Layout><p className="text-center py-20">Campaña no encontrada</p></Layout>;

  return (
    <Layout title={`${campaign.name} - Voces Palestinas por la Justicia`}>
      <div className="container mx-auto px-4 py-8 pb-16 max-w-7xl">
        <div className="flex justify-end mb-4">
          <span
            className="inline-block px-4 py-1.5 rounded-lg text-sm font-medium border"
            style={{
              backgroundColor: `${campaign.color}20`,
              color: '#1f2937',
              borderColor: campaign.color,
            }}
          >
            {campaign.name}
          </span>
        </div>

        <h1 className="text-4xl font-bold text-gray-600 mb-8">{campaign.name}</h1>
        <div className="mb-8">
          <p className="text-gray-700 whitespace-pre-line">{campaign.description}</p>
        </div>

        {campaign.imageUrl && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="relative w-full max-w-2xl aspect-video overflow-hidden rounded-xl shadow-md">
                <Image
                  src={`${baseUrl}${campaign.imageUrl}`}
                  alt={campaign.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
            </div>
            <div className="mb-8 text-center">
              <button
                onClick={openModal}
                className="group inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Ver imagen
              </button>
            </div>
          </>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-600">Acciones de Campaña {campaign.name}</h2>
          <div className="flex gap-2">
            <button onClick={() => setTimeFilter('todas')} className={`px-4 py-2 rounded-lg border font-medium text-sm ${timeFilter === 'todas' ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Todas</button>
            <button onClick={() => setTimeFilter('futuras')} className={`px-4 py-2 rounded-lg border font-medium text-sm ${timeFilter === 'futuras' ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Futuras</button>
            <button onClick={() => setTimeFilter('pasadas')} className={`px-4 py-2 rounded-lg border font-medium text-sm ${timeFilter === 'pasadas' ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Pasadas</button>
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
                .react-calendar__month-view__weekdays abbr { text-decoration: none !important; }
                .react-calendar__month-view__weekdays__weekday:first-child abbr { color: #dc2626 !important; }
                .react-calendar__navigation__label:hover { text-decoration: underline; text-decoration-color: #3b82f6; text-underline-offset: 4px; }
                .react-calendar__tile:not(.bg-green-600):hover abbr { text-decoration: underline; text-decoration-color: #10b981; text-underline-offset: 2px; }
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
            {filteredActions.length === 0 ? (
              <p className="text-gray-600">No hay acciones para mostrar.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActions.map(action => {
                  const isPast = new Date(action.datetime) < now;
                  const isOnline = action.locationType === 'online';
                  const catStyle = categoryStyles[action.category] || { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' };
                  const catLabel = categoryLabels[action.category] || action.category;
                  return (
                    <Link key={action.id} href={`/acciones/${action.id}`} className="block">
                      <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-700">{action.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{new Date(action.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full border" style={catStyle}>
                              {catLabel}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${isOnline ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {isOnline ? '💻 Online' : '📍 Presencial'}
                          </span>
                          <span className="text-xs text-gray-400">{isPast ? 'Pasada' : 'Próxima'}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {campaign.document && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium mb-2">📁 Documento público</p>
              <a href={`${baseUrl}${campaign.document}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Descargar documento
              </a>
            </div>
          )}
          {isAdmin && campaign.documentLink && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-medium mb-2">🔒 Documentación interna (solo administradores)</p>
              <a href={campaign.documentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Acceder a la carpeta de documentos
              </a>
            </div>
          )}
        </div>

        {campaign.groups?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-600">Grupos de mensajería</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campaign.groups.map((group, idx) => {
                const icons = {
                  whatsapp: <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
                  telegram: <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.26.33-.538.33l.193-2.74 4.99-4.51c.217-.193-.047-.3-.334-.108l-6.14 3.87-2.64-.82c-.575-.18-.59-.58.12-.86l10.35-3.99c.48-.17.89.11.73.86z"/></svg>,
                  signal: <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.203 18.37l-.796-.405c-.313-.16-.438-.49-.272-.78.166-.29.542-.396.857-.233l.478.243c.313.16.438.49.272.78-.166.29-.542.396-.857.233l.318-.165zm-.203 1.63c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm0-6c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm0-6c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z"/></svg>,
                };
                return (
                  <a key={idx} href={group.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition">
                    {icons[group.platform] || icons.whatsapp}
                    <span className="capitalize">{group.platform}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && campaign.imageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center" onClick={closeModal}>
          <div className="relative w-[90vw] h-[90vh] max-w-6xl flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-white text-4xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center">×</button>
            <Image
              src={`${baseUrl}${campaign.imageUrl}`}
              alt={campaign.name}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain"
            />
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm">
              1 / 1
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
}