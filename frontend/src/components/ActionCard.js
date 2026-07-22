import Link from 'next/link';
import { categoryLabels, categoryStyles } from '../utils/categoryConfig';

export default function ActionCard({ action, type = 'upcoming' }) {
  // Protección contra datos undefined
  if (!action || typeof action !== 'object') return null;

  const { id, title, description, datetime, category, locationType, placeName, recordingUrl } = action;

  // Formateo seguro de fecha
  let dateStr = 'Fecha no disponible';
  let timeStr = '';
  if (datetime) {
    try {
      const dateObj = new Date(datetime);
      dateStr = dateObj.toLocaleDateString();
      timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      // Si falla, mantener valores por defecto
    }
  }

  const categoryStyle = categoryStyles[category] || { backgroundColor: '#f3f4f6', color: '#1f2937' };
  const catLabel = categoryLabels[category] || category || 'Sin categoría';

  const isPast = type === 'past';
  const isOnline = locationType === 'online';

  return (
    <Link href={`/acciones/${id}`} passHref legacyBehavior>
      <a className="block">
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="p-4">
            {/* Título y fecha */}
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">{title || 'Sin título'}</h3>
              <span className="text-xs text-gray-400 whitespace-nowrap">{dateStr}</span>
            </div>

            {/* Descripción */}
            <p className="text-gray-600 text-sm line-clamp-3 mb-2">
              {description || 'Sin descripción'}
            </p>

            {/* Metadatos */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Hora */}
              {timeStr && (
                <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {timeStr}
                </span>
              )}

              {/* Ubicación */}
              {isOnline ? (
                <span className="inline-flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  💻 Online
                </span>
              ) : (
                <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  📍 {placeName || 'Presencial'}
                </span>
              )}

              {/* Categoría */}
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: categoryStyle.backgroundColor,
                  color: categoryStyle.color,
                }}
              >
                {catLabel}
              </span>

              {/* Si es pasada y tiene grabación */}
              {isPast && recordingUrl && (
                <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.5-4.5M15 10l-4.5 4.5M15 10l4.5 4.5M15 10l-4.5-4.5" />
                  </svg>
                  Grabación disponible
                </span>
              )}
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
}