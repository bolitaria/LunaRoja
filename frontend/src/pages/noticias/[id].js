import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/axios';
import Layout from '../../components/Layout';
import {
  FaArrowLeft, FaYoutube, FaNewspaper, FaPenFancy,
  FaExternalLinkAlt, FaCalendarAlt, FaPlay
} from 'react-icons/fa';

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(YOUTUBE_REGEX);
  return m ? m[1] : null;
}

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch { return ''; }
}

export default function NoticiaDetalle() {
  const router = useRouter();
  const { id } = router.query;
  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const res = await api.get(`/news/${id}`);
        setNoticia(res.data);
      } catch (err) {
        console.error('Error fetching noticia:', err);
        setError('No se pudo cargar la noticia.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <Layout title="Cargando noticia...">
        <div className="container mx-auto px-4 py-20 text-center text-gray-500">
          Cargando noticia...
        </div>
      </Layout>
    );
  }

  if (error || !noticia) {
    return (
      <Layout title="Noticia no encontrada">
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-red-600 mb-4">{error || 'Noticia no encontrada'}</p>
          <Link href="/noticias" className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-800">
            <FaArrowLeft /> Volver a Noticias
          </Link>
        </div>
      </Layout>
    );
  }

  const type = noticia.newsType || 'youtube';
  const videoId = getYouTubeId(noticia.youtubeUrl);
  const date = noticia.publishedAtSource || noticia.publishedAt;
  const image = noticia.ogImage || noticia.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null);

  // ─── YOUTUBE ───
  if (type === 'youtube' && videoId) {
    return (
      <Layout title={`${noticia.title} - Voces Palestinas`}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Link href="/noticias" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <FaArrowLeft /> Volver a Noticias
          </Link>

          <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={noticia.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-6 md:p-8 space-y-4">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <FaYoutube className="w-3 h-3" /> Video YouTube
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{noticia.title}</h1>
              {date && (
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <FaCalendarAlt className="w-3 h-3" /> {formatDate(date)}
                </div>
              )}
              {noticia.description && (
                <p className="text-gray-700 leading-relaxed">{noticia.description}</p>
              )}
              <a
                href={noticia.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                <FaYoutube /> Ver en YouTube
              </a>
            </div>
          </article>
        </div>
      </Layout>
    );
  }

  // ─── ARTICLE ───
  if (type === 'article') {
    return (
      <Layout title={`${noticia.title} - Voces Palestinas`}>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Link href="/noticias" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <FaArrowLeft /> Volver a Noticias
          </Link>

          <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {image && (
              <div className="relative w-full aspect-video bg-gray-100">
                <img src={image} alt={noticia.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <FaNewspaper className="w-3 h-3" /> {noticia.source || 'Artículo externo'}
                </span>
                {date && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <FaCalendarAlt className="w-3 h-3" /> {formatDate(date)}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{noticia.title}</h1>
              {noticia.description && (
                <p className="text-gray-700 leading-relaxed text-lg">{noticia.description}</p>
              )}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-4">
                  Este artículo está alojado en {noticia.source || 'un sitio externo'}. Haz clic para leerlo completo allí.
                </p>
                <a
                  href={noticia.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-3 rounded-xl transition-colors"
                >
                  <FaExternalLinkAlt />
                  Leer en {noticia.source || 'la fuente'}
                </a>
              </div>
            </div>
          </article>
        </div>
      </Layout>
    );
  }

  // ─── INTERNAL ───
  return (
    <Layout title={`${noticia.title} - Voces Palestinas`}>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/noticias" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <FaArrowLeft /> Volver a Noticias
        </Link>

        <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {image && (
            <div className="relative w-full aspect-video bg-gray-100">
              <img src={image} alt={noticia.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6 md:p-8 space-y-4">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-fuchsia-100 text-fuchsia-800">
              <FaPenFancy className="w-3 h-3" /> Redacción propia
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{noticia.title}</h1>
            {date && (
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <FaCalendarAlt className="w-3 h-3" /> {formatDate(date)}
              </div>
            )}
            {noticia.description && (
              <p className="text-gray-600 italic text-lg">{noticia.description}</p>
            )}
            {noticia.content && (
              <div
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: noticia.content }}
              />
            )}
          </div>
        </article>
      </div>
    </Layout>
  );
}
