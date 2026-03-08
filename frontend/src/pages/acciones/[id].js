import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function AccionDetalle() {
  const router = useRouter();
  const { id } = router.query;
  const [action, setAction] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
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
    }
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, currentImageIndex, action?.galleryImages?.length]);

  if (loading) return <Layout><p className="text-center py-20">Cargando...</p></Layout>;
  if (!action) return <Layout><p className="text-center py-20">Acción no encontrada</p></Layout>;

  // Construir galería combinada
  const galleryImages = [];
  if (action.featuredImage) {
    galleryImages.push({ id: 'featured', url: action.featuredImage, isFeatured: true });
  }
  if (action.images) {
    galleryImages.push(...action.images);
  }

  const openModal = (index) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const actionDate = new Date(action.datetime);
  const categoryLabels = {
    webinar: 'Webinar', talk: 'Charla', protest: 'Manifestación',
    bds: 'Acción BDS', strike: 'Huelga', march: 'Marcha',
    solidarity_action: 'Acción Solidaria', workshop: 'Taller'
  };

  const categoryColors = {
    webinar: 'bg-blue-100 text-blue-800', talk: 'bg-green-100 text-green-800',
    protest: 'bg-red-100 text-red-800', bds: 'bg-purple-100 text-purple-800',
    strike: 'bg-yellow-100 text-yellow-800', march: 'bg-orange-100 text-orange-800',
    solidarity_action: 'bg-indigo-100 text-indigo-800', workshop: 'bg-pink-100 text-pink-800'
  };

  return (
    <Layout title={action.title}>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Columna izquierda: Información principal */}
          <div className="lg:w-2/3">
            <h1 className="text-4xl font-bold mb-4">{action.title}</h1>
            
            {/* Fecha, hora y categoría */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{actionDate.toLocaleDateString()} - {actionDate.toLocaleTimeString()}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[action.category] || 'bg-gray-100 text-gray-800'}`}>
                {categoryLabels[action.category] || action.category}
              </span>
            </div>

            {/* Campaña */}
            {campaign && (
              <div className="mb-4">
                <span className="text-gray-600">Campaña: </span>
                <Link href={`/campanas/${campaign.id}`} className="text-blue-600 hover:underline font-medium">
                  {campaign.name}
                </Link>
              </div>
            )}

            {/* Descripción */}
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 whitespace-pre-line">{action.description}</p>
            </div>

            {/* Ubicación */}
            {action.locationType === 'online' ? (
              action.onlineLink ? (
                <a
                  href={action.onlineLink}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Acceder al evento online
                </a>
              ) : null
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="font-semibold mb-1">{action.placeName}</p>
                <p className="text-gray-600 mb-2">{action.address}</p>
                {action.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(action.address)}`}
                    target="_blank"
                    rel="noopener"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ver en Google Maps
                  </a>
                )}
              </div>
            )}

            {/* Grabación */}
            {action.recordingUrl && (
              <a
                href={action.recordingUrl}
                target="_blank"
                rel="noopener"
                className="mt-6 inline-flex items-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Ver grabación
              </a>
            )}
          </div>

          {/* Columna derecha: Galería de imágenes */}
          {galleryImages.length > 0 && (
            <div className="lg:w-1/3">
              <h2 className="text-xl font-semibold mb-4">Galería</h2>
              <div className="grid grid-cols-2 gap-2">
                {galleryImages.map((img, index) => (
                  <div
                    key={img.id}
                    className="cursor-pointer overflow-hidden rounded-lg aspect-square"
                    onClick={() => openModal(index)}
                  >
                    <img
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}${img.url}`}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Lightbox */}
        {isModalOpen && galleryImages.length > 0 && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
            onClick={closeModal}
          >
            <div
              className="relative w-[90vw] h-[90vh] max-w-6xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
              >
                ×
              </button>
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-5xl font-bold hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-5xl font-bold hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                  >
                    ›
                  </button>
                </>
              )}
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}${galleryImages[currentImageIndex].url}`}
                  alt={`Imagen ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} / {galleryImages.length}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}