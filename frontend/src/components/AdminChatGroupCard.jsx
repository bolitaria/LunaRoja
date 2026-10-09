import Link from 'next/link';
import { FaEdit, FaWhatsapp, FaTelegram, FaSignal, FaComments, FaCheck, FaTimes } from 'react-icons/fa';

const PLATFORM_ICONS = {
  whatsapp: <FaWhatsapp className="w-5 h-5 text-green-600" />,
  telegram: <FaTelegram className="w-5 h-5 text-blue-500" />,
  signal: <FaSignal className="w-5 h-5 text-blue-700" />,
};

export default function AdminChatGroupCard({ group, associationLabel }) {
  const platformIcon = PLATFORM_ICONS[group.platform] || <FaComments className="w-5 h-5 text-gray-500" />;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {platformIcon}
            <span className="text-xs font-medium text-gray-500 uppercase">{group.platform}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${group.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
              {group.isPublic ? 'Público' : 'Privado'}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${group.isActive ? 'text-green-600' : 'text-gray-400'}`}>
              {group.isActive ? <FaCheck className="w-3 h-3" /> : <FaTimes className="w-3 h-3" />}
              {group.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{group.name}</h3>
        {group.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{group.description}</p>
        )}

        <div className="text-xs text-gray-500 mt-auto">
          <span className="font-medium">Asignado a: </span>
          <span>{associationLabel || 'General'}</span>
        </div>
      </div>
      <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-end bg-gray-50">
        <Link
          href={`/admin/chatGroups/${group.id}/edit`}
          className="p-1.5 text-gray-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors"
          title="Editar"
        >
          <FaEdit className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
