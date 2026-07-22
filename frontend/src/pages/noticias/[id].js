import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../lib/axios';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';

export default function NoticiaDetalle() {
  const router = useRouter();
  const { id } = router.query;
  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchNoticia = async () => {
      try {
        const res = await api.get(`/news/${id}`);
        setNoticia(res.data);
      } catch (err) {
        console.error('Error fetching noticia:', err);
        setError('No se pudo cargar la noticia.');
        toast.error('Error al cargar la noticia');
      } finally {
        setLoading(false);
      }
    };
    fetchNoticia();
  }, [id]);

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return (
      <Layout title="Cargando..." bgClass="bg-gradient-to-b from-cyan-50 to-white min-h-screen">
        <div className="container mx-auto px-4 py-16 text-center text-gray-600">Cargando noticia...</div>
      </Layout>
    );
  }

  if (error || !noticia) {
    return (
      <Layout title="Error" bgClass="bg-gradient-to-b from-cyan-50 to-white min-h-screen">
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">{error || 'Noticia no encontrada'}</p>
          <Link href="/noticias" className="text-red-600 hover:underline">← Volver a Noticias</Link>
        </div>
      </Layout>
    );
  }

  const formattedDate = new Date(noticia.publishedAt || noticia.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const videoId = getYoutubeId(noticia.youtubeUrl);

  return (
    <Layout title={`${noticia.title} - Voces Palestinas por la Justicia`} bgClass="bg-gradient-to-b from-cyan-50 to-white min-h-screen">
      <article className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Link href="/noticias" className="text-red-600 hover:underline flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Noticias
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 md:p-8">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              📰 Noticia
            </span>
            {noticia.isNews && (
              <span className="ml-2 text-xs text-gray-500">Noticia en General</span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{noticia.title}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6 border-b border-gray-100 pb-4">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formattedDate}
            </span>
            {noticia.author && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {noticia.author}
              </span>
            )}
          </div>

          {noticia.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Resumen</h2>
              <p className="text-gray-600 leading-relaxed">{noticia.description}</p>
            </div>
          )}

          {noticia.imageUrl && (
            <div className="mb-6 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={noticia.imageUrl}
                alt={noticia.title}
                className="w-full max-h-96 object-cover"
                onError={(e) => e.target.style.display = 'none'}
                loading="lazy"
              />
            </div>
          )}

          {noticia.content && (
            <div className="prose prose-lg max-w-none text-gray-700 mb-6">
              <div dangerouslySetInnerHTML={{ __html: noticia.content }} />
            </div>
          )}

          {videoId ? (
            <div className="aspect-video rounded-lg overflow-hidden shadow-sm border border-gray-200">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={noticia.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : noticia.youtubeUrl ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
              <p>No se pudo incrustar el video.</p>
              <a
                href={noticia.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline mt-2 inline-block"
              >
                Ver en YouTube
              </a>
            </div>
          ) : null}
        </div>
      </article>
    </Layout>
  );
}