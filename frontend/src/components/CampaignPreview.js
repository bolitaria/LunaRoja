import React from 'react';
import { FaExpand, FaTimes } from 'react-icons/fa';

export default function CampaignPreview({
  name, description, color, image,
  groups = [], documents = [], privateLink,
  document: docPath = null,
  subscriberCount = 0, actionCount = 0, urgentActionCount = 0,
  onExpand = null,   // callback para abrir modal
  full = false,      // modo "vista completa" (sin sticky, sin truncar)
}) {
  const publicGroups = (groups || []).filter(g => g.isPublic !== false);
  const privateGroups = (groups || []).filter(g => g.isPublic === false);
  const hasGroups = publicGroups.length > 0 || privateGroups.length > 0;
  const hasDocs = (documents && documents.length > 0) || Boolean(docPath);
  const hasPrivate = privateLink && privateLink.trim() !== '';
  const hasMetrics = subscriberCount > 0 || actionCount > 0 || urgentActionCount > 0;

  const baseUrl = '';  // rutas relativas: nginx sirve /uploads/
  const getDocUrl = (p) => (p && p.startsWith('http') ? p : `${p}`);

  const descriptionClass = full
    ? 'text-sm text-gray-700 whitespace-pre-wrap'
    : 'text-sm text-gray-600 line-clamp-3';

  const imageClass = full
    ? 'w-full max-h-96 object-cover'
    : 'w-full h-full object-cover';

  const wrapperClass = full
    ? 'bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden'
    : 'sticky top-8';

  const innerClass = full
    ? ''
    : 'bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden';

  const imageWrapper = full
    ? 'relative w-full bg-gray-100'
    : 'relative w-full aspect-video bg-gray-100';

  const content = (
    <div className={innerClass}>
      {image ? (
        <div className={imageWrapper}>
          <img src={image} alt="Preview" className={imageClass} />
        </div>
      ) : (
        <div className={`${full ? 'w-full h-48' : 'w-full aspect-video'} bg-gray-100 flex items-center justify-center text-gray-400 text-sm`}>
          Sin imagen destacada
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`font-bold text-gray-800 ${full ? 'text-2xl' : 'text-lg line-clamp-2'}`}>
            {name || 'Sin nombre'}
          </h4>
          <span
            className="flex-shrink-0 inline-block px-2 py-0.5 text-xs font-medium rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            Activa
          </span>
        </div>

        {hasMetrics && (
          <div className="flex flex-wrap gap-2 text-xs">
            {subscriberCount > 0 && (
              <span className="px-2 py-0.5 bg-fuchsia-50 text-fuchsia-700 rounded-full border border-fuchsia-200">
                👥 {subscriberCount} suscriptores
              </span>
            )}
            {actionCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                📅 {actionCount} acciones
              </span>
            )}
            {urgentActionCount > 0 && (
              <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded-full border border-red-200">
                🔥 {urgentActionCount} urgentes
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-block w-4 h-4 rounded-full border" style={{ backgroundColor: color, borderColor: color }} />
          {hasDocs && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
              📁 Documentos
            </span>
          )}
          {hasGroups && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">
              💬 {publicGroups.length} públicos
              {privateGroups.length > 0 && ` · 🔒 ${privateGroups.length} privados`}
            </span>
          )}
          {hasPrivate && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">
              🔒 Zona privada
            </span>
          )}
        </div>

        {description && (
          <p className={descriptionClass + ' mt-1'}>{description}</p>
        )}

        {docPath && (
          <a
            href={getDocUrl(docPath)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => full && e.stopPropagation()}
            className="block text-xs text-blue-600 hover:text-blue-800 truncate pt-2 border-t border-gray-100"
          >
            📄 Ver documento adjunto
          </a>
        )}

        {/* Grupos en detalle (solo modo full) */}
        {full && publicGroups.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Grupos públicos</p>
            <div className="flex flex-wrap gap-2">
              {publicGroups.map((g, i) => (
                <a key={i} href={g.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200 hover:bg-purple-100">
                  💬 {g.platform || 'grupo'}
                </a>
              ))}
            </div>
          </div>
        )}

        {full && privateGroups.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Grupos privados 🔒</p>
            <div className="flex flex-wrap gap-2">
              {privateGroups.map((g, i) => (
                <a key={i} href={g.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200 hover:bg-amber-100">
                  🔒 {g.platform || 'grupo'}
                </a>
              ))}
            </div>
          </div>
        )}

        {full && privateLink && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Zona privada</p>
            <a href={privateLink} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 break-all">
              {privateLink}
            </a>
          </div>
        )}
      </div>
    </div>
  );

  // Modo full (modal): no envuelve con sticky ni cabecera
  if (full) {
    return <div className={wrapperClass}>{content}</div>;
  }

  // Modo preview normal
  return (
    <div className={wrapperClass}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Vista previa</h3>
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            className="inline-flex items-center gap-1 text-xs text-fuchsia-600 hover:text-fuchsia-800 font-medium"
            title="Ver como se verá en el sitio público"
          >
            <FaExpand className="w-3 h-3" /> Ver completa
          </button>
        )}
      </div>
      <div
        className={`relative ${onExpand ? 'cursor-pointer group' : ''}`}
        onClick={onExpand || undefined}
      >
        {content}
        {onExpand && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-xl flex items-center justify-center pointer-events-none">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3 shadow-lg">
              <FaExpand className="w-5 h-5 text-fuchsia-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
