// frontend/src/components/ReportPreview.js
// Vista previa de un blog o reporte. Renderiza el contenido HTML del editor
// con estilos tipo artículo (sin depender del plugin @tailwindcss/typography).

import React from 'react';
import DOMPurify from 'dompurify';

export default function ReportPreview({ form = {}, documents = [] }) {
  const {
    title = '',
    content = '',
    type = 'blog',
    source = '',
    author = '',
    publishedAt = '',
  } = form;

  const isBlog = type === 'blog';
  const typeLabel = isBlog ? 'Blog' : 'Reporte';
  const typeIcon = isBlog ? '📝' : '📄';
  const typeStyle = isBlog
    ? 'bg-fuchsia-100 text-fuchsia-800'
    : 'bg-blue-100 text-blue-800';

  const hasPdf = Array.isArray(documents) && documents.length > 0;
  const sanitizedContent = content ? DOMPurify.sanitize(content) : '';

  // Formateo de fecha
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Clases arbitrarias de Tailwind que aplican estilos al HTML inyectado
  const contentClasses = [
    'text-sm leading-relaxed text-gray-700',
    '[&_p]:my-2 [&_p]:leading-relaxed',
    '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-gray-900',
    '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-gray-900',
    '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-gray-900',
    '[&_strong]:font-semibold [&_strong]:text-gray-900',
    '[&_em]:italic',
    '[&_u]:underline',
    '[&_s]:line-through',
    '[&_a]:text-fuchsia-600 [&_a]:underline [&_a]:underline-offset-2',
    '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2',
    '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2',
    '[&_li]:my-1',
    '[&_blockquote]:border-l-4 [&_blockquote]:border-fuchsia-200 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-3',
    '[&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono',
    '[&_hr]:my-4 [&_hr]:border-gray-200',
  ].join(' ');

  return (
    <div className="sticky top-8">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Vista previa
      </h3>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-5 space-y-4">

          {/* Badge tipo */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${typeStyle}`}>
            <span>{typeIcon}</span> {typeLabel}
          </span>

          {/* Título */}
          <h4 className="text-xl font-bold text-gray-800 leading-snug">
            {title || 'Título del artículo…'}
          </h4>

          {/* Meta: autor + fuente + fecha */}
          {(author || source || formattedDate) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500 pb-3 border-b border-gray-100">
              {author && (
                <span className="inline-flex items-center gap-1">
                  <span>✍️</span>
                  <span className="font-medium text-gray-700">{author}</span>
                </span>
              )}
              {source && (
                <span className="inline-flex items-center gap-1">
                  <span>🔗</span>
                  <span className="truncate max-w-[180px]">{source}</span>
                </span>
              )}
              {formattedDate && (
                <span className="inline-flex items-center gap-1">
                  <span>📅</span> {formattedDate}
                </span>
              )}
            </div>
          )}

          {/* Contenido: PDF subido o HTML del editor */}
          {hasPdf ? (
            <div className="flex items-center gap-3 p-3 bg-fuchsia-50/60 rounded-xl border border-fuchsia-100">
              <span className="text-2xl flex-shrink-0">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {documents[0].name || 'Documento PDF'}
                </p>
                <p className="text-xs text-gray-500">Documento adjunto · PDF</p>
              </div>
            </div>
          ) : sanitizedContent ? (
            <div
              className={contentClasses}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          ) : (
            <p className="text-sm text-gray-400 italic py-4 text-center">
              El contenido aparecerá aquí…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
