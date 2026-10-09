import Link from 'next/link';
import { FaEye, FaEyeSlash, FaEdit, FaFire, FaBullhorn, FaCheckCircle } from 'react-icons/fa';

/**
 * Card de petición para la vista mosaico del admin.
 * Reutiliza el estilo visual de ActionCard / CampaignPreview.
 */
export default function PetitionCard({ petition, onToggleHidden }) {
  const image = petition.featured_image || petition.imageUrl;
  const isExternal = petition.type === 'official';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Imagen o placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-fuchsia-100 to-purple-100 flex items-center justify-center">
        {image ? (
          <img src={image} alt={petition.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">✍️</span>
        )}

        {/* Badge urgente */}
        {petition.urgency && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            <FaFire className="w-3 h-3" /> Urgente
          </span>
        )}

        {/* Badge tipo */}
        <span className={`absolute top-2 right-2 inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
          isExternal ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {isExternal ? <FaBullhorn className="w-3 h-3" /> : <FaCheckCircle className="w-3 h-3" />}
          {isExternal ? 'Externa' : 'Interna'}
        </span>

        {/* Badge oculta */}
        {petition.hidden && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
            <FaEyeSlash className="w-3 h-3" /> Oculta
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2" title={petition.title}>
          {petition.title}
        </h3>
        {petition.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{petition.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between text-sm text-gray-500">
          <span className="inline-flex items-center gap-1 font-medium text-fuchsia-700">
            {petition.total_signatures} firmas
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-1">
          <a
            href={`/peticiones/${petition.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Ver pública"
          >
            <FaEye className="w-4 h-4" />
          </a>
          {petition.total_signatures === 0 && (
            <Link
              href={`/admin/petitions/${petition.id}/edit`}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar"
            >
              <FaEdit className="w-4 h-4" />
            </Link>
          )}
        </div>
        <button
          onClick={() => onToggleHidden(petition.id, petition.hidden)}
          className={`p-1.5 rounded-lg ${petition.hidden ? 'text-gray-400 hover:text-yellow-600' : 'text-green-600 hover:text-green-800'}`}
          title={petition.hidden ? 'Mostrar al público' : 'Ocultar al público'}
        >
          {petition.hidden ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
