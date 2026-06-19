import Link from 'next/link';
import { categoryLabels, categoryStyles } from '../utils/categoryConfig';

export default function ActionCard({ action, type }) {
  if (!action) return null;

  const date = action.datetime ? new Date(action.datetime).toLocaleDateString() : 'Fecha no disponible';
  const time = action.datetime ? new Date(action.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  // Estilo para la categoría (similar a las etiquetas de noticias)
  const categoryStyle = categoryStyles[action.category] || { backgroundColor: '#f3f4f6', color: '#1f2937' };

  return (
    <Link href={`/acciones/${action.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="p-4">
          {/* Título y fecha en la misma línea */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">{action.title}</h3>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {date}
            </span>
          </div>

          {/* Descripción */}
          <p className="text-gray-600 text-sm line-clamp-3 mb-2">{action.description}</p>

          {/* Metadatos: hora, ubicación y categoría */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Hora */}
            {time && (
              <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {time}
              </span>
            )}

            {/* Ubicación */}
            {action.locationType === 'online' ? (
              <span className="inline-flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                💻 Online
              </span>
            ) : (
              <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                📍 {action.placeName || 'Presencial'}
              </span>
            )}

            {/* Categoría (si existe) */}
            {action.category && (
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{ backgroundColor: categoryStyle.backgroundColor, color: categoryStyle.color }}
              >
                {categoryLabels[action.category] || action.category}
              </span>
            )}

            {/* Si es una acción pasada con grabación */}
            {type === 'past' && action.recordingUrl && (
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
    </Link>
  );
}