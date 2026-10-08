import React from 'react';

export default function NewsPreview({ form = {}, featuredImage = null }) {
  const {
    title = '',
    description = '',
    youtubeUrl = '',
    isNews = false,
    publishedAt = '',
    campaignName = '',
    actionName = '',
  } = form;

  const hasMeta = campaignName || actionName;

  return (
    <div className="sticky top-8">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Vista previa</h3>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {featuredImage ? (
          <div className="relative w-full aspect-video bg-gray-100">
            <img src={featuredImage} alt={`Vista previa de ${title || 'la noticia'}`} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : (
          <div className="w-full aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Sin miniatura
          </div>
        )}

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-lg font-bold text-gray-800 line-clamp-2">{title || 'Título de la noticia'}</h4>
            <span className={`flex-shrink-0 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${isNews ? 'bg-fuchsia-100 text-fuchsia-800' : 'bg-gray-100 text-gray-700'}`}>
              {isNews ? 'Noticia' : 'Artículo'}
            </span>
          </div>

          {publishedAt && (
            <div className="text-xs text-gray-500">
              📅 {new Date(publishedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          )}

          {hasMeta && (
            <div className="text-xs text-gray-500">
              {campaignName && <span>Campaña: <strong>{campaignName}</strong></span>}
              {campaignName && actionName && <span className="mx-1">·</span>}
              {actionName && <span>Acción: <strong>{actionName}</strong></span>}
            </div>
          )}

          {youtubeUrl && (
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-full border border-red-200">
              ▶️ YouTube
            </a>
          )}

          {description && (
            <p className="text-sm text-gray-600 line-clamp-3 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
