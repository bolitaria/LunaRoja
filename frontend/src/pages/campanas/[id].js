import { useRouter } from 'next/router';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';
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

// Iconos de plataforma (pueden ir en archivo compartido)
const platformIcons = {
  whatsapp: (
    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  telegram: (
    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.26.33-.538.33l.193-2.74 4.99-4.51c.217-.193-.047-.3-.334-.108l-6.14 3.87-2.64-.82c-.575-.18-.59-.58.12-.86l10.35-3.99c.48-.17.89.11.73.86z"/>
    </svg>
  ),
  signal: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.203 18.37l-.796-.405c-.313-.16-.438-.49-.272-.78.166-.29.542-.396.857-.233l.478.243c.313.16.438.49.272.78-.166.29-.542-.396-.857.233l.318-.165zm-.203 1.63c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm0-6c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm0-6c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z"/>
    </svg>
  ),
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const isAdmin = user && ['superadmin', 'campaign_admin', 'action_admin'].includes(user.role);

  // Grupos de la campaña
  const [campaignGroups, setCampaignGroups] = useState([]);
  const [platformFilter, setPlatformFilter] = useState(null); // 'whatsapp', 'telegram', 'signal'

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  const openModal = (index = 0) => { setCurrentImageIndex(index); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);
  const nextImage = () => setCurrentImageIndex((p) => (p + 1) % galleryImages.length);
  const prevImage = () => setCurrentImageIndex((p) => (p - 1 + galleryImages.length) % galleryImages.length);

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
      } catch (error) { console.error('Error fetching campaign', error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id, apiUrl]);

  // Cargar grupos de esta campaña
  useEffect(() => {
    if (!campaign?.id) return;
    axios.get(`${apiUrl}/chat-groups?campaignId=${campaign.id}`)
      .then(res => setCampaignGroups(res.data))
      .catch(console.error);
  }, [campaign?.id, apiUrl]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, currentImageIndex]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

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
    if (timeFilter === 'futuras') result = result.filter(a => new Date(a.datetime) > now);
    else if (timeFilter === 'pasadas') result = result.filter(a => new Date(a.datetime) <= now);
    return result;
  }, [actions, selectedDate, timeFilter, actionsByDate, now]);

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

  if (loading) return <Layout><p className="text-center py-20">Cargando...</p></Layout>;
  if (!campaign) return <Layout><p className="text-center py-20">Campaña no encontrada</p></Layout>;

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${baseUrl}${url}`;
  };

  const getFileDetails = (url) => {
    if (!url) return { name: 'documento', type: 'desconocido', icon: '📎' };
    const parts = url.split('/').pop().split('?')[0].split('.');
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';
    const name = parts.join('.') || 'documento';
    const icons = { pdf: '📕', doc: '📄', docx: '📄', xls: '📊', xlsx: '📊', ppt: '📽️', pptx: '📽️', txt: '📝', zip: '🗜️', rar: '🗜️' };
    return { name, type: ext || 'archivo', icon: icons[ext] || '📎' };
  };

  const validGroups = campaign.groups?.filter(g => g.link && g.link.trim() !== '') || [];
  const galleryImages = [];
  if (campaign.imageUrl) galleryImages.push({ id: 'main', url: campaign.imageUrl });
  if (campaign.images && Array.isArray(campaign.images)) {
    campaign.images.forEach(img => { if (img && img.url && img.url.trim() !== '') galleryImages.push({ id: img.id || img.url, url: img.url }); });
  }

  // Filtrar grupos por plataforma
  const filteredCampaignGroups = platformFilter
    ? campaignGroups.filter(g => g.platform === platformFilter)
    : campaignGroups;

  return (
    <Layout title={`${campaign.name} - Voces Palestinas por la Justicia`}>
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-7xl bg-white rounded-xl shadow-sm border border-gray-200">
        {/* CABECERA */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-8 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-700">{campaign.name}</h1>
            <span className="inline-block w-16 h-8 border border-gray-300 shadow-sm flex-shrink-0 rounded" style={{ backgroundColor: campaign.color }} title={`Color: ${campaign.color}`} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {campaign.active ? <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">Activa</span> : <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">Inactiva</span>}
          </div>
        </div>

        {/* CUERPO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <div className="prose max-w-none"><p className="text-gray-700 whitespace-pre-line">{campaign.description}</p></div>
            <div className="space-y-3">
              {campaign.document && (() => {
                const { name, type, icon } = getFileDetails(campaign.document);
                return (
                  <div className="p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between hover:shadow-sm transition">
                    <div className="flex items-center gap-3"><span className="text-2xl">{icon}</span><div><p className="text-gray-800 font-medium">{name}.{type}</p><p className="text-xs text-gray-500">Documento público</p></div></div>
                    <a href={getImageUrl(campaign.document)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">Descargar</a>
                  </div>
                );
              })()}
              {isAdmin && campaign.documentLink && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium mb-1">🔒 Documentación interna</p>
                  <p className="text-xs text-gray-500 mb-2">Acceso restringido a administradores</p>
                  <a href={campaign.documentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Acceder a la carpeta de documentos</a>
                </div>
              )}
            </div>
            {validGroups.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3 text-gray-700">Grupos de mensajería</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {validGroups.map((group, idx) => {
                    const icons = {
                      whatsapp: <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472..."/></svg>,
                      telegram: <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12..."/></svg>,
                      signal: <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12..."/></svg>,
                    };
                    return (
                      <a key={idx} href={group.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition group">
                        <span className="w-8 h-8 flex items-center justify-center">{icons[group.platform] || icons.whatsapp}</span>
                        <span className="flex-1 font-medium text-gray-700 capitalize">{group.platform}</span>
                        <span className="text-sm text-gray-400 group-hover:text-gray-600 transition">Unirse →</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {campaign.imageUrl ? (
              <div className="relative w-full aspect-video overflow-hidden rounded-xl shadow-md bg-gray-50"><img src={getImageUrl(campaign.imageUrl)} alt={campaign.name} className="absolute inset-0 w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} /></div>
            ) : (
              <div className="w-full aspect-video bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300"><svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span className="ml-2 text-sm font-medium">Sin imagen</span></div>
            )}
            {galleryImages.length > 0 && (
              <div className="text-center">
                <button onClick={() => openModal(0)} className="group inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"><svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>Ver galería ({galleryImages.length})</button>
              </div>
            )}
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-8 rounded-xl shadow-sm border border-gray-200 px-4 lg:px-8 py-4" style={{ background: `linear-gradient(135deg, ${campaign.color}15 0%, ${campaign.color}05 100%)`, borderColor: `${campaign.color}40` }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">Acciones de la campaña</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setTimeFilter('todas')} className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition ${timeFilter === 'todas' ? 'bg-white text-fuchsia-600 border-2 border-fuchsia-600 shadow-sm' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>Todas</button>
              <button onClick={() => setTimeFilter('futuras')} className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition ${timeFilter === 'futuras' ? 'bg-white text-fuchsia-600 border-2 border-fuchsia-600 shadow-sm' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>Futuras</button>
              <button onClick={() => setTimeFilter('pasadas')} className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition ${timeFilter === 'pasadas' ? 'bg-white text-fuchsia-600 border-2 border-fuchsia-600 shadow-sm' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>Pasadas</button>
              {selectedDate && <button onClick={() => setSelectedDate(null)} className="px-3 py-1.5 rounded-lg border text-xs bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition">✕ Limpiar fecha</button>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex justify-center">
              <Calendar
                onChange={(value) => setSelectedDate(getLocalDateStr(value))}
                value={selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date()}
                tileClassName={tileClassName}
                tileContent={tileContent}
                className="rounded-lg border border-gray-200 shadow-sm p-2 bg-white"
                locale="es-ES"
              />
            </div>
            <div className="lg:col-span-2">
              {filteredActions.length === 0 ? (
                <p className="text-gray-600 text-sm">No hay acciones para mostrar.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredActions.map(action => {
                    const isPast = new Date(action.datetime) < now;
                    const isOnline = action.locationType === 'online';
                    const catLabel = categoryLabels[action.category] || action.category;
                    const dateObj = new Date(action.datetime);
                    const weekday = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
                    const dateStr = dateObj.toLocaleDateString('es-ES');
                    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <Link key={action.id} href={`/acciones/${action.id}`} className="block">
                        <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-semibold text-gray-700 text-sm">{action.title}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-purple-100 text-purple-800 border-purple-200 whitespace-nowrap">{catLabel}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{weekday}, {dateStr}</span>
                            <span className="text-gray-400">·</span>
                            <span className="inline-flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{timeStr}</span>
                            <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs ${isOnline ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{isOnline ? '💻 Online' : '📍 Presencial'}</span>
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

        {/* GRUPOS DE LA CAMPAÑA (NUEVA SECCIÓN) */}
        {campaignGroups.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Grupos de esta campaña
            </h3>
            <div className="flex gap-2 mb-6">
              {['whatsapp', 'telegram', 'signal'].map(platform => (
                <button
                  key={platform}
                  onClick={() => setPlatformFilter(platformFilter === platform ? null : platform)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                    platformFilter === platform
                      ? 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {platform === 'whatsapp' ? 'WhatsApp' : platform === 'telegram' ? 'Telegram' : 'Signal'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCampaignGroups.map(group => (
                <a
                  key={group.id}
                  href={group.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-fuchsia-200 transition flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {platformIcons[group.platform] || platformIcons.whatsapp}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-gray-700 truncate">{group.name}</h4>
                    <p className="text-xs text-gray-500 capitalize">
                      {group.platform}
                      {group.region && ` · 📍 ${group.region}`}
                    </p>
                  </div>
                  <span className="text-xs text-fuchsia-600 ml-auto whitespace-nowrap">Unirse →</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* MODAL GALERÍA */}
        {isModalOpen && galleryImages.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={closeModal}>
            <div className="relative w-[90vw] h-[90vh] max-w-6xl flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeModal} className="absolute top-4 right-4 text-white text-4xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition">×</button>
              {galleryImages.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition">‹</button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition">›</button>
                </>
              )}
              <img src={getImageUrl(galleryImages[currentImageIndex].url)} alt={`Imagen ${currentImageIndex + 1}`} className="max-w-full max-h-full object-contain" onError={(e) => { e.target.src = '/placeholder-image.png'; }} />
              <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white bg-black/60 px-4 py-2 rounded-full text-sm">{currentImageIndex + 1} / {galleryImages.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* ESTILOS CALENDARIO */}
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
        .selected-future { background: #34D399 !important; border-radius: 9999px !important; }
        .selected-past { background: #FCA5A5 !important; border-radius: 9999px !important; }
        .selected-today { background: #fbff23 !important; border-radius: 9999px !important; }
        .react-calendar__tileContent { display: none !important; }
      `}</style>
    </Layout>
  );
}