import React from 'react';
import { categoryLabels } from '../utils/categoryConfig';

export default function ActionPreview({ form = {}, featuredImage = null, images = [] }) {
  // Valores por defecto para evitar errores
  const {
    title = '',
    description = '',
    category = '',
    datetime = '',
    locationType = 'presencial',
    placeName = '',
    address = '',
    urgent = false,
    enableAttendance = false,
    groups = [],
    documentLink = '',
    documentFile = null,
  } = form;

  const catLabel = categoryLabels[category] || category || 'Sin categoría';
  const isOnline = locationType === 'online';
  const hasAddress = address || placeName;
  const hasImages = Array.isArray(images) && images.length > 0;
  const isUrgent = Boolean(urgent);
  const hasGroups = Array.isArray(groups) && groups.length > 0;

  return (
    <div className="sticky top-8">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Vista previa</h3>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Imagen destacada */}
        {featuredImage ? (
          <div className="relative w-full aspect-video bg-gray-100">
            <img
              src={featuredImage}
              alt={`Vista previa de ${title || 'la acción'}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Sin imagen destacada
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Título y urgente */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-lg font-bold text-gray-800 line-clamp-2">
              {title || 'Título de la acción'}
            </h4>
            {isUrgent && (
              <span className="flex-shrink-0 inline-block px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                🔥 Urgente
              </span>
            )}
          </div>

          {/* Fecha y categoría */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {datetime && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                {new Date(datetime).toLocaleDateString()} –{' '}
                {new Date(datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className="px-2 py-0.5 bg-fuchsia-50 text-fuchsia-700 rounded-full text-xs font-medium border border-fuchsia-200">
              {catLabel}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                isOnline
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}
            >
              {isOnline ? '💻 Online' : '📍 Presencial'}
            </span>
          </div>

          {/* Ubicación */}
          {!isOnline && hasAddress && (
            <div className="text-sm text-gray-600">
              {placeName && <span className="font-medium">{placeName}</span>}
              {placeName && address && <span className="mx-1">·</span>}
              {address && <span>{address}</span>}
            </div>
          )}

          {/* Mini galería */}
          {hasImages && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Galería ({images.length})</p>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {images.slice(0, 4).map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`Imagen ${idx + 1}`}
                    className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
                    loading="lazy"
                  />
                ))}
                {images.length > 4 && (
                  <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                    +{images.length - 4}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Badges adicionales */}
          <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-100">
            {enableAttendance && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                <span>📝</span> Asistencia
              </span>
            )}
            {(documentLink || documentFile) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                <span>📁</span> Documentos
              </span>
            )}
            {hasGroups && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">
                <span>💬</span> Grupos
              </span>
            )}
          </div>

          {/* Descripción (resumida) */}
          {description && (
            <p className="text-sm text-gray-600 line-clamp-3 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}