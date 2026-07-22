import React from 'react';

export default function CampaignPreview({ name, description, color, image, groups, documents, privateLink }) {
  const hasGroups = groups && groups.length > 0;
  const hasDocs = documents && documents.length > 0;
  const hasPrivate = privateLink && privateLink.trim() !== '';

  return (
    <div className="sticky top-8">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Vista previa</h3>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {image ? (
          <div className="relative w-full aspect-video bg-gray-100">
            <img src={image} alt="Preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Sin imagen destacada
          </div>
        )}

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-lg font-bold text-gray-800 line-clamp-2">{name || 'Nombre de la campaña'}</h4>
            <span
              className="flex-shrink-0 inline-block px-2 py-0.5 text-xs font-medium rounded-full text-white"
              style={{ backgroundColor: color }}
            >
              Activa
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className="inline-block w-4 h-4 rounded-full border"
              style={{ backgroundColor: color, borderColor: color }}
            />
            {hasDocs && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                <span>📁</span> Documentos
              </span>
            )}
            {hasGroups && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">
                <span>💬</span> Grupos
              </span>
            )}
            {hasPrivate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">
                <span>🔒</span> Zona privada
              </span>
            )}
          </div>

          {description && (
            <p className="text-sm text-gray-600 line-clamp-3 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}