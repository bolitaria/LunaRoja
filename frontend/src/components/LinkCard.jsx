import Link from 'next/link';
import { FaEdit, FaTrash, FaExternalLinkAlt, FaCheck, FaTimes, FaGlobe } from 'react-icons/fa';
import { LINK_REGION_LABELS } from '../utils/linkRegions';

const CATEGORY_STYLES = {
  local: 'bg-green-100 text-green-800',
  nacional: 'bg-blue-100 text-blue-800',
  europeo: 'bg-purple-100 text-purple-800',
  internacional: 'bg-orange-100 text-orange-800',
  literatura: 'bg-pink-100 text-pink-800',
  bibliografia: 'bg-amber-100 text-amber-800',
};

const CATEGORY_LABELS = {
  local: 'Local', nacional: 'Nacional', europeo: 'Europeo',
  internacional: 'Internacional', literatura: 'Literatura', bibliografia: 'Bibliografía',
};

export default function LinkCard({ link, onDelete }) {
  const catStyle = CATEGORY_STYLES[link.category] || 'bg-gray-100 text-gray-800';
  const catLabel = CATEGORY_LABELS[link.category] || link.category;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${catStyle}`}>{catLabel}</span>
            {link.category === 'internacional' && link.region && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                <FaGlobe className="w-3 h-3" />
                {LINK_REGION_LABELS[link.region] || link.region}
              </span>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${link.active ? 'text-green-600' : 'text-gray-400'}`}>
            {link.active ? <FaCheck className="w-3 h-3" /> : <FaTimes className="w-3 h-3" />}
            {link.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{link.title}</h3>
        {link.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{link.description}</p>
        )}
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline truncate mt-auto inline-flex items-center gap-1"
          title={link.url}
        >
          <FaExternalLinkAlt className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{link.url}</span>
        </a>
      </div>
      <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-end gap-1 bg-gray-50">
        <Link
          href={`/admin/links/${link.id}/edit`}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Editar"
        >
          <FaEdit className="w-4 h-4" />
        </Link>
        <button
          onClick={() => onDelete(link.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar"
        >
          <FaTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
