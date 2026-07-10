import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { categoryLabels, categoryStyles } from '../../utils/categoryConfig';

export default function AccionDetalle() {
  const router = useRouter();
  const { id } = router.query;
  const [action, setAction] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  // Leaflet
  const [mapApiLoaded, setMapApiLoaded] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const previewMapRef = useRef(null);
  const modalMapRef = useRef(null);
  const leafletModalMapRef = useRef(null);
  const scriptLoadingRef = useRef(false);

  const loadLeaflet = () => {
    if (typeof window === 'undefined') return;
    if (window.L) {
      setMapApiLoaded(true);
      return;
    }
    if (scriptLoadingRef.current) return;
    scriptLoadingRef.current = true;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setMapApiLoaded(true);
      scriptLoadingRef.current = false;
    };
    script.onerror = () => {
      console.error('Error al cargar Leaflet');
      scriptLoadingRef.current = false;
    };
    document.head.appendChild(script);
  };

  useEffect(() => {
    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchAction = async () => {
      try {
        const res = await axios.get(`${apiUrl}/actions/${id}`);
        setAction(res.data);
        if (res.data.campaignId) {
          const campaignRes = await axios.get(`${apiUrl}/campaigns/${res.data.campaignId}`);
          setCampaign(campaignRes.data);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching action:', err);
        setError('No se pudo cargar la acción. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    fetchAction();
  }, [id, apiUrl]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      if (e.key === 'ArrowLeft') prevImage();
      else if (e.key === 'ArrowRight') nextImage();
      else if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, currentImageIndex]);

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
    const icons = {
      pdf: '📕', doc: '📄', docx: '📄', xls: '📊', xlsx: '📊',
      ppt: '📽️', pptx: '📽️', txt: '📝', zip: '🗜️', rar: '🗜️',
    };
    return {
      name,
      type: ext || 'archivo',
      icon: icons[ext] || '📎',
    };
  };

  // Mapa estático
  useEffect(() => {
    if (!action || !mapApiLoaded || !previewMapRef.current) return;
    if (!action.latitude || !action.longitude) return;

    if (previewMapRef.current._leaflet_id) {
      previewMapRef.current._leaflet_map.remove();
    }

    const map = L.map(previewMapRef.current, {
      center: [parseFloat(action.latitude), parseFloat(action.longitude)],
      zoom: 15,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    L.marker([parseFloat(action.latitude), parseFloat(action.longitude)]).addTo(map);

    return () => map.remove();
  }, [action, mapApiLoaded]);

  // Mapa modal
  useEffect(() => {
    if (!showMapModal || !mapApiLoaded || !modalMapRef.current || !action) return;
    if (leafletModalMapRef.current) leafletModalMapRef.current.remove();

    const map = L.map(modalMapRef.current).setView(
      [parseFloat(action.latitude || 40.416775), parseFloat(action.longitude || -3.703790)],
      15
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.marker([parseFloat(action.latitude), parseFloat(action.longitude)]).addTo(map);

    leafletModalMapRef.current = map;

    return () => {
      if (leafletModalMapRef.current) {
        leafletModalMapRef.current.remove();
        leafletModalMapRef.current = null;
      }
    };
  }, [showMapModal, mapApiLoaded, action]);

  if (loading) return <Layout><p className="text-center py-20">Cargando...</p></Layout>;
  if (error) return <Layout><p className="text-center py-20 text-red-600">{error}</p></Layout>;
  if (!action) return <Layout><p className="text-center py-20">Acción no encontrada</p></Layout>;

  const galleryImages = [];
  if (action.featuredImage && action.featuredImage.trim() !== '') {
    galleryImages.push({ id: 'featured', url: action.featuredImage });
  }
  if (action.images && Array.isArray(action.images)) {
    action.images.forEach((img) => {
      if (img && img.url && img.url.trim() !== '') {
        galleryImages.push({ id: img.id || img.url, url: img.url });
      }
    });
  }

  const openModal = (i) => {
    setShowMapModal(false);
    setCurrentImageIndex(i);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);
  const nextImage = () => setCurrentImageIndex((p) => (p + 1) % galleryImages.length);
  const prevImage = () => setCurrentImageIndex((p) => (p - 1 + galleryImages.length) % galleryImages.length);

  const openMapModal = () => {
    setIsModalOpen(false);
    setShowMapModal(true);
  };

  const actionDate = new Date(action.datetime);
  const now = new Date();
  const isPast = now > actionDate;
  const catStyle = categoryStyles[action.category] || { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' };
  const catLabel = categoryLabels[action.category] || action.category;
  const campaignBadgeStyle = campaign
    ? { backgroundColor: `${campaign.color}20`, color: '#1f2937', borderColor: campaign.color }
    : null;
  const isAdmin = user && ['superadmin', 'campaign_admin', 'action_admin'].includes(user.role);
  const isOnline = action.locationType === 'online';
  const validGroups = action.groups?.filter(g => g.link && g.link.trim() !== '') || [];

  return (
    <Layout title={action.title}>
      {/* Contenedor principal igual que campaña */}
      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-7xl bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Cabecera estilo campaña */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-8 pb-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-700">{action.title}</h1>
            {action.urgent && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full border border-red-300">
                <span className="text-lg">🔥</span> Urgente
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {campaign && (
              <Link href={`/campanas/${campaign.id}`}>
                <span
                  className="inline-block px-3 py-1 rounded-lg text-sm font-medium border cursor-pointer hover:opacity-80 transition"
                  style={campaignBadgeStyle}
                >
                  {campaign.name}
                </span>
              </Link>
            )}
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium border" style={catStyle}>
              {catLabel}
            </span>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${isPast ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
              {isPast ? 'Pasada' : 'Próxima'}
            </span>
          </div>
        </div>

        {/* Información de la acción (fecha, hora, ubicación) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{actionDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{actionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{isOnline ? 'Online' : (action.placeName || 'Presencial')}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="capitalize">{isOnline ? 'Online' : 'Presencial'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Descripción */}
            {action.description && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-3">Descripción</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{action.description}</p>
                </div>
              </div>
            )}

            {/* Imagen destacada (si solo hay una) */}
            {action.featuredImage && galleryImages.length === 1 && (
              <div className="relative w-full aspect-video overflow-hidden rounded-xl shadow-sm bg-gray-50 border border-gray-200">
                <img
                  src={getImageUrl(action.featuredImage)}
                  alt={action.title}
                  className="absolute inset-0 w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Galería en miniaturas */}
            {galleryImages.length > 1 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-3">Galería</h2>
                <div className="grid grid-cols-3 gap-3">
                  {galleryImages.slice(0, 6).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => openModal(idx)}
                      className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 hover:shadow-md transition"
                    >
                      <img
                        src={getImageUrl(img.url)}
                        alt={`Imagen ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      {idx === 5 && galleryImages.length > 6 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-lg font-bold">
                          +{galleryImages.length - 6}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => openModal(0)}
                  className="mt-3 inline-flex items-center gap-2 text-sm text-fuchsia-600 hover:underline"
                >
                  Ver todas las imágenes →
                </button>
              </div>
            )}

            {/* Documentos */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Documentos</h2>
              <div className="space-y-3">
                {action.document && (() => {
                  const { name, type, icon } = getFileDetails(action.document);
                  return (
                    <div className="p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between hover:shadow-sm transition">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <div>
                          <p className="text-gray-800 font-medium">{name}.{type}</p>
                          <p className="text-xs text-gray-500">Documento público</p>
                        </div>
                      </div>
                      <a
                        href={getImageUrl(action.document)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        Descargar
                      </a>
                    </div>
                  );
                })()}
                {isAdmin && action.documentLink && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 font-medium mb-1">🔒 Documentación interna</p>
                    <p className="text-xs text-gray-500 mb-2">Acceso restringido a administradores</p>
                    <a href={action.documentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Acceder a la carpeta de documentos
                    </a>
                  </div>
                )}
                {!action.document && !action.documentLink && (
                  <p className="text-gray-400 text-sm">No hay documentos adjuntos.</p>
                )}
              </div>
            </div>
          </div>

          {/* Columna lateral (1/3) */}
          <div className="space-y-6">
            {/* Botones de acción */}
            <div className="flex flex-col gap-3">
              {action.enableAttendance && (
                <button
                  onClick={() => alert('Registro de asistencia (por implementar)')}
                  className="inline-flex items-center justify-center bg-fuchsia-600 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-700 transition"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Registrar asistencia
                </button>
              )}

              {(!isPast || !isOnline) && action.registrationLink && (
                <a href={action.registrationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
                  Registrarse
                </a>
              )}

              {isOnline && !isPast && action.onlineLink && (
                <a href={action.onlineLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Acceder al evento online
                </a>
              )}

              {action.recordingUrl && (
                <a href={action.recordingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition">
                  Ver grabación
                </a>
              )}
            </div>

            {/* Mapa (solo presencial) */}
            {!isOnline && action.latitude != null && action.longitude != null && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div ref={previewMapRef} style={{ height: '200px', width: '100%' }} />
                <div className="p-3 bg-gray-50 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {action.placeName && <span className="font-medium">{action.placeName}</span>}
                    {action.address && <span className="block text-xs text-gray-500">{action.address}</span>}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`https://www.openstreetmap.org/directions?from=&to=${action.latitude},${action.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-green-100 text-green-800 hover:bg-green-200 transition"
                    >
                      Cómo llegar
                    </a>
                    <button
                      onClick={openMapModal}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                    >
                      Ampliar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Grupos de mensajería */}
            {validGroups.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Grupos de chat</h3>
                <div className="space-y-2">
                  {validGroups.map((group, idx) => {
                    const icons = {
                      whatsapp: <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
                      telegram: <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.26.33-.538.33l.193-2.74 4.99-4.51c.217-.193-.047-.3-.334-.108l-6.14 3.87-2.64-.82c-.575-.18-.59-.58.12-.86l10.35-3.99c.48-.17.89.11.73.86z"/></svg>,
                      signal: <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.203 18.37l-.796-.405c-.313-.16-.438-.49-.272-.78.166-.29.542-.396.857-.233l.478.243c.313.16.438.49.272.78-.166.29-.542-.396-.857.233l.318-.165zm-.203 1.63c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm0-6c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm0-6c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z"/></svg>,
                    };
                    return (
                      <a
                        key={idx}
                        href={group.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition group"
                      >
                        <span className="w-8 h-8 flex items-center justify-center">
                          {icons[group.platform] || icons.whatsapp}
                        </span>
                        <span className="flex-1 font-medium text-gray-700 capitalize">{group.platform}</span>
                        <span className="text-sm text-gray-400 group-hover:text-gray-600 transition">Unirse →</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de galería */}
      {isModalOpen && galleryImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4" onClick={closeModal}>
          <div className="relative w-[90vw] h-[90vh] max-w-6xl flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-white text-4xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition">×</button>
            {galleryImages.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition">‹</button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/70 transition">›</button>
              </>
            )}
            <img
              src={getImageUrl(galleryImages[currentImageIndex].url)}
              alt={`Imagen ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => { e.target.src = '/placeholder-image.png'; }}
            />
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white bg-black/60 px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {galleryImages.length}
            </p>
          </div>
        </div>
      )}

      {/* Modal mapa */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowMapModal(false)}>
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-700">Ubicación</h3>
              <button onClick={() => setShowMapModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            {!mapApiLoaded ? (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Cargando mapa...</p>
              </div>
            ) : (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <div ref={modalMapRef} className="absolute inset-0 w-full h-full rounded-lg border border-gray-300" />
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}