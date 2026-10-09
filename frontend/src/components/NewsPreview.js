import React from 'react';
import { FaYoutube, FaNewspaper, FaPenFancy, FaExternalLinkAlt, FaPlay } from 'react-icons/fa';

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(YOUTUBE_REGEX);
  return m ? m[1] : null;
}

export default function NewsPreview({ form = {}, featuredImage = null }) {
  const {
    newsType = 'youtube',
    title = '',
    description = '',
    youtubeUrl = '',
    externalUrl = '',
    source = '',
    ogImage = '',
    content = '',
    thumbnail = '',
    isNews = false,
    publishedAt = '',
    campaignName = '',
    actionName = '',
  } = form;

  const hasMeta = campaignName || actionName;
  const videoId = getYouTubeId(youtubeUrl);

  // Imagen destacada según tipo
  const displayImage = featuredImage
    || (newsType === 'article' ? ogImage : null)
    || thumbnail
    || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

  // Etiqueta de tipo con icono y color
  const typeBadge = {
    youtube: { label: 'Video YouTube', Icon: FaYoutube, className: 'bg-red-100 text-red-800 border-red-200' },
    article: { label: source || 'Artículo externo', Icon: FaNewspaper, className: 'bg-blue-100 text-blue-800 border-blue-200' },
    internal: { label: 'Redacción propia', Icon: FaPenFancy, className: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' },
  }[newsType] || { label: 'Noticia', Icon: FaNewspaper, className: 'bg-gray-100 text-gray-700 border-gray-200' };

  return (
    <div className="sticky top-8">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Vista previa</h3>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Imagen/video */}
        {displayImage ? (
          <div className="relative w-full aspect-video bg-gray-100">
            <img
              src={displayImage}
              alt={title || 'Vista previa'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {newsType === 'youtube' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                  <FaPlay className="w-5 h-5 text-white ml-1" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full aspect-video bg-gradient-to-br from-fuchsia-50 to-purple-50 flex items-center justify-center text-gray-400 text-sm">
            Sin miniatura
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Tipo + Noticia/Artículo */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${typeBadge.className}`}>
              <typeBadge.Icon className="w-3 h-3" />
              {typeBadge.label}
            </span>
            <span className={`flex-shrink-0 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${isNews ? 'bg-fuchsia-100 text-fuchsia-800' : 'bg-gray-100 text-gray-700'}`}>
              {isNews ? 'Noticia' : 'Artículo'}
            </span>
          </div>

          {/* Título */}
          <h4 className="text-lg font-bold text-gray-800 line-clamp-2">
            {title || 'Título de la noticia'}
          </h4>

          {/* Fecha */}
          {publishedAt && (
            <div className="text-xs text-gray-500">
              📅 {new Date(publishedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          )}

          {/* Meta (campaña/acción) */}
          {hasMeta && (
            <div className="text-xs text-gray-500">
              {campaignName && <span>Campaña: <strong>{campaignName}</strong></span>}
              {campaignName && actionName && <span className="mx-1">·</span>}
              {actionName && <span>Acción: <strong>{actionName}</strong></span>}
            </div>
          )}

          {/* Descripción / resumen */}
          {description && (
            <p className="text-sm text-gray-600 line-clamp-3 mt-1">{description}</p>
          )}

          {/* Cuerpo según tipo */}
          {newsType === 'youtube' && videoId && (
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-900 font-medium"
            >
              <FaYoutube className="w-3 h-3" /> Ver en YouTube
            </a>
          )}

          {newsType === 'article' && externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <FaExternalLinkAlt className="w-3 h-3" />
              Leer en {source || 'la fuente'}
            </a>
          )}

          {newsType === 'internal' && content && (
            <div className="text-xs text-gray-500 italic">
              (Redacción propia · {content.replace(/<[^>]*>/g, '').length} caracteres)
            </div>
          )}
        </div>
      </div>

      {/* Debug opcional */}
      {!title && !description && !displayImage && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Rellena los campos para ver la vista previa
        </p>
      )}
    </div>
  );
}
