import { FaEdit, FaTrash } from 'react-icons/fa';

export default function ActionTable({
  actions = [],
  onEdit,
  onDelete,
  campaignMap = {},
  showCampaignColumn = true,
  showBdsColumn = false,
}) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No hay acciones aún.</p>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 text-sm font-sans">
        <thead className="bg-orange-50 text-gray-700 uppercase tracking-wider text-xs font-semibold">
          <tr>
            <th className="px-6 py-3 text-left">Título</th>
            <th className="px-6 py-3 text-left hidden sm:table-cell">Categoría</th>
            <th className="px-6 py-3 text-left hidden md:table-cell">Fecha</th>
            <th className="px-6 py-3 text-left hidden md:table-cell">Ubicación</th>
            {showCampaignColumn && <th className="px-6 py-3 text-left hidden lg:table-cell">Campaña</th>}
            {showBdsColumn && <th className="px-6 py-3 text-left hidden lg:table-cell">BDS</th>}
            <th className="px-6 py-3 text-left">Estado</th>
            <th className="px-6 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {actions.map((action) => {
            const isPast = new Date(action.datetime) < new Date();
            const formattedDate = action.datetime
              ? new Date(action.datetime).toLocaleString()
              : 'Fecha no disponible';

            return (
              <tr key={action.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{action.title || 'Sin título'}</td>
                <td className="px-6 py-4 hidden sm:table-cell text-gray-600">
                  {action.category || '-'}
                </td>
                <td className="px-6 py-4 hidden md:table-cell text-gray-600">{formattedDate}</td>
                <td className="px-6 py-4 hidden md:table-cell text-gray-600">
                  {action.locationType === 'online' ? 'Online' : (action.placeName || 'Presencial')}
                </td>
                {showCampaignColumn && (
                  <td className="px-6 py-4 hidden lg:table-cell text-gray-600">
                    {campaignMap[action.campaignId]?.name || '-'}
                  </td>
                )}
                {showBdsColumn && (
                  <td className="px-6 py-4 hidden lg:table-cell text-gray-600">
                    {action.bds?.name || '-'}
                  </td>
                )}
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isPast ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {isPast ? 'Pasado' : 'Próximo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(action)}
                      className="p-1.5 text-gray-400 hover:text-fuchsia-600 transition-colors"
                      aria-label={`Editar acción ${action.title || ''}`}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => onDelete(action.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label={`Eliminar acción ${action.title || ''}`}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}