import Link from 'next/link';
import { categoryLabels, categoryStyles } from '../utils/categoryConfig';

export default function ActionCard({ action, type }) {
  const date = action.datetime ? new Date(action.datetime).toLocaleDateString() : 'Fecha no disponible';
  const time = action.datetime ? new Date(action.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const style = categoryStyles[action.category] || { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' };
  const dateBorderColor = style.borderColor || '#d1d5db';

  return (
    <Link href={`/acciones/${action.id}`} className="block">
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">{action.title}</h3>
          <span className="text-xs px-2 py-1 rounded-full border" style={style}>
            {categoryLabels[action.category] || action.category}
          </span>
        </div>
        <p className="text-gray-600 mb-2 line-clamp-2">{action.description}</p>
        <p className="text-sm mb-2 inline-block px-2 py-1 rounded border text-gray-700" style={{ borderColor: dateBorderColor }}>
          {date} - {time}
        </p>
        {/* Etiqueta de ubicación (se ajusta al texto) */}
        {action.locationType === 'online' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">💻 Online</span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">📍 {action.placeName || 'Presencial'}</span>
        )}
        {type === 'past' && action.recordingUrl && (
          <span className="inline-block mt-2 text-gray-500 text-sm">Grabación disponible</span>
        )}
      </div>
    </Link>
  );
}