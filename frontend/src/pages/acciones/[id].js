import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    const fetchAction = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions/${id}`);
        setAction(res.data);
        if (res.data.campaignId) {
          const campaignRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${res.data.campaignId}`);
          setCampaign(campaignRes.data);
        }
      } catch (error) {
        console.error('Error fetching action', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAction();
  }, [id]);

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

  if (loading) return <Layout><p className="text-center py-20">Cargando...</p></Layout>;
  if (!action) return <Layout><p className="text-center py-20">Acción no encontrada</p></Layout>;

  const galleryImages = [];
  if (action.featuredImage) galleryImages.push({ id: 'featured', url: action.featuredImage });
  if (action.images) galleryImages.push(...action.images);

  const openModal = (i) => { setCurrentImageIndex(i); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);
  const nextImage = () => setCurrentImageIndex((p) => (p + 1) % galleryImages.length);
  const prevImage = () => setCurrentImageIndex((p) => (p - 1 + galleryImages.length) % galleryImages.length);

  const actionDate = new Date(action.datetime);
  const catStyle = categoryStyles[action.category] || { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' };
  const catLabel = categoryLabels[action.category] || action.category;

  const campaignBadgeStyle = campaign
    ? { backgroundColor: `${campaign.color}20`, color: '#1f2937', borderColor: campaign.color }
    : null;

  const previewImages = galleryImages.slice(0, 5);
  const totalImages = galleryImages.length;

  const isAdmin = user && ['superadmin', 'campaign_admin', 'action_admin'].includes(user.role);

  return (
    <Layout title={action.title}>
      <div className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Cabecera: título a la izquierda, solo la campaña (si existe) a la derecha */}
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-4xl font-bold text-gray-600">{action.title}</h1>
          {campaign && (
            <Link href={`/campanas/${campaign.id}`}>
              <span className="inline-block px-3 py-1 rounded-lg text-sm font-medium border cursor-pointer hover:opacity-80 transition" style={campaignBadgeStyle}>
                {campaign.name}
              </span>
            </Link>
          )}
        </div>

        {/* Fecha/hora + categoría en la misma línea */}
        <div className="flex items-center gap-3 mb-8">
          <span className="inline-block px-3 py-1 rounded-lg text-sm font-medium border" style={catStyle}>
            {actionDate.toLocaleDateString()} – {actionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium border" style={catStyle}>
            {catLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Información (izquierda) */}
          <div className="space-y-6">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-line">{action.description}</p>
            </div>

            <div className="flex items-center gap-2">
              {action.locationType === 'online' ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">💻 Online</span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">📍 Presencial</span>
              )}
              {action.locationType === 'presencial' && action.placeName && <span className="text-sm text-gray-600">{action.placeName}</span>}
              {action.locationType === 'presencial' && action.address && <span className="text-sm text-gray-500">{action.address}</span>}
            </div>

            {action.registrationLink && (
              <a href={action.registrationLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">Registrarse</a>
            )}
            {action.locationType === 'online' && action.onlineLink && (
              <a href={action.onlineLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Acceder al evento online
              </a>
            )}
            {action.recordingUrl && (
              <a href={action.recordingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition">Ver grabación</a>
            )}

            {action.document && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-medium mb-2">📁 Documento público</p>
                <a href={`${process.env.NEXT_PUBLIC_BASE_URL}${action.document}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Descargar documento</a>
              </div>
            )}
            {isAdmin && action.documentLink && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-medium mb-2">🔒 Documentación interna (solo administradores)</p>
                <a href={action.documentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Acceder a la carpeta de documentos</a>
              </div>
            )}

            {action.groups?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3 text-gray-600">Grupos de mensajería</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {action.groups.map((group, idx) => {
                    const icons = {
                      whatsapp: <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382..."/></svg>,
                      telegram: <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0..."/></svg>,
                      signal: <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0..."/></svg>,
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

          {/* Columna derecha: mapa + galería */}
          <div className="space-y-6">
            {action.locationType === 'presencial' && action.latitude != null && action.longitude != null && (
              <div className="rounded-lg overflow-hidden border-2 border-blue-600">
                <iframe
                  width="100%"
                  height="250"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${action.longitude-0.01},${action.latitude-0.01},${action.longitude+0.01},${action.latitude+0.01}&layer=mapnik&marker=${action.latitude},${action.longitude}`}
                />
              </div>
            )}

            {galleryImages.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-600 text-center">Galería</h2>
                <div className="grid grid-cols-2 gap-2">
                  {previewImages.map((img, index) => (
                    <div key={img.id} className="cursor-pointer overflow-hidden rounded-lg aspect-square" onClick={() => openModal(index)}>
                      <Image
                        src={`${process.env.NEXT_PUBLIC_BASE_URL}${img.url}`}
                        alt={`Imagen ${index + 1}`}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover hover:scale-105 transition"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
                {totalImages > 5 && (
                  <div className="mt-3 text-center">
                    <button onClick={() => openModal(0)} className="text-sm text-blue-600 hover:underline focus:outline-none">Ver todas las imágenes ({totalImages})</button>
                  </div>
                )}
                {totalImages <= 5 && totalImages > 0 && (
                  <div className="mt-3 text-center">
                    <button onClick={() => openModal(0)} className="text-sm text-blue-600 hover:underline focus:outline-none">Ampliar galería</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lightbox */}
        {isModalOpen && galleryImages.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center" onClick={closeModal}>
            <div className="relative w-[90vw] h-[90vh] max-w-6xl flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <button onClick={closeModal} className="absolute top-4 right-4 text-white text-4xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center">×</button>
              {galleryImages.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center">‹</button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl z-10 bg-black/50 rounded-full w-12 h-12 flex items-center justify-center">›</button>
                </>
              )}
              <Image
                src={`${process.env.NEXT_PUBLIC_BASE_URL}${galleryImages[currentImageIndex].url}`}
                alt={`Imagen ${currentImageIndex + 1}`}
                width={1200}
                height={800}
                className="max-w-full max-h-full object-contain"
              />
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} / {galleryImages.length}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}