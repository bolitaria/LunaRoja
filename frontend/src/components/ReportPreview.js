import React from 'react';

export default function ReportPreview({ form = {} }) {
  const {
    title = '',
    description = '',
    content = '',
    fileUrl = '',
    type = 'blog',
    source = '',
    author = '',
    publishedAt = '',
  } = form;

  const typeLabel = type === 'blog' ? 'Blog' : 'Reporte';
  const typeStyle = type === 'blog'
    ? 'bg-fuchsia-100 text-fuchsia-800'
    : 'bg-blue-100 text-blue-800';

  return (
    <div className="sticky top-8">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Vista previa</h3>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-lg font-bold text-gray-800 line-clamp-2">{title || 'Título del reporte'}</h4>
            <span className={`flex-shrink-0 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${typeStyle}`}>
              {typeLabel}
            </span>
          </div>

          {publishedAt && (
            <div className="text-xs text-gray-500">
              📅 {new Date(publishedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          )}

          {(source || author) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {source && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                  🏷️ {source}
                </span>
              )}
              {author && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                  ✍️ {author}
                </span>
              )}
            </div>
          )}

          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
              📄 Documento adjunto
            </a>
          )}

          {description && (
            <p className="text-sm text-gray-600 line-clamp-3 mt-1">{description}</p>
          )}

          {content && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Contenido:</p>
              <p className="text-xs text-gray-600 line-clamp-4">{content}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
