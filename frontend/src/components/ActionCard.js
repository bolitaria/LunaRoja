export default function ActionCard({ action, index }) {
  const statusColors = {
    completed: 'bg-green-500',
    in_progress: 'bg-yellow-500',
    planned: 'bg-blue-500',
  };
  const statusText = {
    completed: 'Completada',
    in_progress: 'En curso',
    planned: 'Futura',
  };

  return (
    <div className="relative pl-8 pb-8 border-l-2 border-gray-300 last:border-l-0 last:pb-0">
      {/* Marcador de línea de tiempo */}
      <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full ${statusColors[action.status]}`}></div>
      <div className="bg-white p-6 rounded-lg shadow-md ml-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">{action.date}</span>
          <span className={`text-xs px-2 py-1 rounded text-white ${statusColors[action.status]}`}>
            {statusText[action.status]}
          </span>
        </div>
        <h3 className="text-xl font-semibold mb-2">{action.title}</h3>
        <p className="text-gray-600 mb-4">{action.description}</p>
        {action.imageUrl && (
          <img src={action.imageUrl} alt={action.title} className="mb-4 rounded max-h-48 object-cover" />
        )}
        {action.link && (
          <a href={action.link} target="_blank" rel="noopener" className="text-red-600 hover:underline">
            Más información →
          </a>
        )}
      </div>
    </div>
  );
}