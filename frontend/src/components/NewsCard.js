import { useState } from 'react';
import Link from 'next/link';
import { FaYoutube, FaNewspaper, FaPenFancy, FaExternalLinkAlt, FaPlay, FaTimes, FaCalendarAlt } from 'react-icons/fa';

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

export default function NewsCard({ noticia, campaign, action }) {
  const [showVideo, setShowVideo] = useState(false);
  if (!noticia) return null;

  const type = noticia.newsType || 'youtube';
  const videoId = getYouTubeId(noticia.youtubeUrl);
  const date = noticia.publishedAtSource || noticia.publishedAt;

  // Elegir imagen mostrada
  const image =
    noticia.ogImage
    || noticia.thumbnail
    || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

  // Tag de contexto
  let newsTag = null;
  if (noticia.isNews) {
    if (action) newsTag = 'Noticia Acción';
    else if (campaign) newsTag = 'Noticia Campaña';
    else newsTag = 'Noticia';
  }

  const typeBadge = {
    youtube: { Icon: FaYoutube, label: 'Video', className: 'bg-red-100 text-red-800' },
    article: { Icon: FaNewspaper, label: noticia.source || 'Artículo', className: 'bg-blue-100 text-blue-800' },
    internal: { Icon: FaPenFancy, label: 'Redacción propia', className: 'bg-fuchsia-100 text-fuchsia-800' },
  }[type] || { Icon: FaNewspaper, label: 'Noticia', className: 'bg-gray-100 text-gray-700' };

  // ─── Comportamiento según tipo ───
  const cardContent = (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      {/* Imagen */}
      {image ? (
        <div className="relative w-full aspect-video bg-gray-200">
          <img
            src={image}
            alt={noticia.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {type === 'youtube' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all">
              <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                <FaPlay className="w-5 h-5 text-white ml-1" />
              </div>
            </div>
          )}
          {/* Badge tipo sobre imagen */}
          <div className="absolute top-2 left-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeBadge.className}`}>
              <typeBadge.Icon className="w-3 h-3" />
              {typeBadge.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full aspect-video bg-gradient-to-br from-fuchsia-50 to-purple-50 flex items-center justify-center">
          <typeBadge.Icon className="w-10 h-10 text-gray-300" />
        </div>
      )}

      {/* Contenido */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1">{noticia.title}</h3>
        </div>

        {date && (
          <div className="text-xs text-gray-500 flex items-center gap-1 mb-2">
            <FaCalendarAlt className="w-3 h-3" />
            {formatDate(date)}
          </div>
        )}

        {noticia.description && (
          <p className="text-gray-600 text-sm line-clamp-3">{noticia.description}</p>
        )}

        {/* Pie: etiquetas + CTA */}
        <div className="mt-auto pt-3 flex flex-wrap items-center gap-2">
          {newsTag && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              {newsTag}
            </span>
          )}
          {campaign && (
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: `${campaign.color}20`, color: campaign.color }}
            >
              {campaign.name}
            </span>
          )}
          {action && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {action.title}
            </span>
          )}

          {type === 'article' && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
              <FaExternalLinkAlt className="w-3 h-3" />
              Leer en {noticia.source || 'la fuente'}
            </span>
          )}
          {type === 'youtube' && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-red-600 font-medium">
              <FaYoutube className="w-3 h-3" />
              Ver video
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // ─── Wrapper según tipo ───
  if (type === 'article' && noticia.externalUrl) {
    return (
      <a
        href={noticia.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {cardContent}
      </a>
    );
  }

  if (type === 'youtube' && videoId) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowVideo(true)}
          className="text-left w-full h-full"
        >
          {cardContent}
        </button>
        {showVideo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
            onClick={() => setShowVideo(false)}
          >
            <div
              className="relative w-full max-w-4xl aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowVideo(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl"
                aria-label="Cerrar"
              >
                <FaTimes />
              </button>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={noticia.title}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // internal u otro
  return (
    <Link href={`/noticias/${noticia.id}`} className="block h-full">
      {cardContent}
    </Link>
  );
}
