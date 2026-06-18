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

  // Construir URL absoluta para imágenes
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${baseUrl}${url}`;
  };

  // Obtener nombre del archivo y extensión
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

  // Mapa estático de vista previa
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

  // Mapa interactivo en modal
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

  // Abrir galería (cierra mapa)
  const openModal = (i) => {
    setShowMapModal(false);
    setCurrentImageIndex(i);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);
  const nextImage = () => setCurrentImageIndex((p) => (p + 1) % galleryImages.length);
  const prevImage = () => setCurrentImageIndex((p) => (p - 1 + galleryImages.length) % galleryImages.length);

  // Abrir mapa (cierra galería)
  const openMapModal = () => {
    setIsModalOpen(false);
    setShowMapModal(true);
  };

  const actionDate = new Date(action.datetime);
  const isPast = new Date() > actionDate;
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
      <div className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-gray-600">{action.title}</h1>
            {action.urgent && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full border border-red-300">
                <span className="text-lg">🔥</span> Urgente
              </span>
            )}
          </div>
          <div className="text-right flex flex-col items-end gap-1">
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna izquierda */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span
                className="inline-block px-3 py-1 rounded-lg text-sm font-medium border"
                style={{
                  backgroundColor: catStyle.backgroundColor,
                  color: catStyle.color,
                  borderColor: catStyle.borderColor,
                }}
              >
                {actionDate.toLocaleDateString()} – {actionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${isOnline ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                {isOnline ? '💻 Online' : '📍 Presencial'}
              </span>
            </div>

            {!isOnline && (action.placeName || action.address) && (
              <div className="text-sm text-gray-600">
                {action.placeName && <span className="font-medium">{action.placeName}</span>}
                {action.placeName && action.address && <span className="mx-1">·</span>}
                {action.address && <span>{action.address}</span>}
              </div>
            )}

            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{action.description}</p>
            </div>

            {/* Documentos debajo de descripción */}
            <div className="space-y-3">
              {action.document && (() => {
                const { name, type, icon } = getFileDetails(action.document);
                return (
                  <div className="p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-gray-800 font-medium mb-1">{icon} Documento público</p>
                      <p className="text-xs text-gray-500">
                        {name}.{type} – Disponible para todos los usuarios
                      </p>
                    </div>
                    <a
                      href={getImageUrl(action.document)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-4 flex-shrink-0"
                    >
                      Descargar documento
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
            </div>

            <div className="flex flex-wrap gap-3">
              {action.enableAttendance && (
                <button
                  onClick={() => alert('Registro de asistencia (por implementar)')}
                  className="inline-flex items-center bg-fuchsia-600 text-white px-6 py-3 rounded-lg hover:bg-fuchsia-700 transition"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Registrar asistencia
                </button>
              )}

              {(!isPast || !isOnline) && action.registrationLink && (
                <a href={action.registrationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
                  Registrarse
                </a>
              )}

              {isOnline && !isPast && action.onlineLink && (
                <a href={action.onlineLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Acceder al evento online
                </a>
              )}

              {action.recordingUrl && (
                <a href={action.recordingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition">
                  Ver grabación
                </a>
              )}
            </div>

            {validGroups.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3 text-gray-600">Grupos de mensajería</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {validGroups.map((group, idx) => {
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

          {/* Columna derecha: imagen -> galería -> mapa */}
          <div className="space-y-6">
            {action.featuredImage && (
              <div className="relative w-full aspect-video overflow-hidden rounded-xl shadow-md bg-gray-50">
                <img
                  src={getImageUrl(action.featuredImage)}
                  alt={action.title}
                  className="absolute inset-0 w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {galleryImages.length > 0 && (
              <div className="text-center">
                <button
                  onClick={() => openModal(0)}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Ver galería ({galleryImages.length})
                </button>
              </div>
            )}

            {!isOnline && action.latitude != null && action.longitude != null && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden z-0 relative">
                <div ref={previewMapRef} style={{ height: '250px', width: '100%' }} />
                <div className="p-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    {action.placeName && <p className="text-sm font-medium text-gray-700">{action.placeName}</p>}
                    {action.address && <p className="text-sm text-gray-600 mt-0.5">{action.address}</p>}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`https://www.openstreetmap.org/directions?from=&to=${action.latitude},${action.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      Cómo llegar
                    </a>
                    <button
                      onClick={openMapModal}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                      Expandir mapa
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Galería modal (imágenes) – z‑60 */}
        {isModalOpen && galleryImages.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center" onClick={closeModal}>
            <div className="relative w-[90vw] h-[90vh] max-w-6xl flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeModal} className="absolute top-4 right-4 text-white text-4xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center">×</button>
              {galleryImages.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center">‹</button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center">›</button>
                </>
              )}
              <img
                src={getImageUrl(galleryImages[currentImageIndex].url)}
                alt={`Imagen ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} / {galleryImages.length}
              </p>
            </div>
          </div>
        )}

        {/* Modal mapa ampliado (Leaflet) – z‑50 */}
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
      </div>
    </Layout>
  );
}