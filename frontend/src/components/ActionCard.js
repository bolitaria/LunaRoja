import Link from 'next/link';

export default function ActionCard({ action, type }) {
  const date = new Date(action.datetime).toLocaleDateString();
  const time = new Date(action.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const categoryLabels = {
    webinar: 'Webinar',
    talk: 'Charla',
    protest: 'Manifestación',
    bds: 'Acción BDS',
    strike: 'Huelga',
    march: 'Marcha',
    solidarity_action: 'Acción Solidaria',
    workshop: 'Taller'
  };

  const categoryColors = {
    webinar: 'bg-blue-100 text-blue-800',
    talk: 'bg-green-100 text-green-800',
    protest: 'bg-red-100 text-red-800',
    bds: 'bg-purple-100 text-purple-800',
    strike: 'bg-yellow-100 text-yellow-800',
    march: 'bg-orange-100 text-orange-800',
    solidarity_action: 'bg-indigo-100 text-indigo-800',
    workshop: 'bg-pink-100 text-pink-800'
  };

  return (
    <Link href={`/acciones/${action.id}`} className="block">
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">{action.title}</h3>
          <span className={`text-xs px-2 py-1 rounded ${categoryColors[action.category]}`}>
            {categoryLabels[action.category]}
          </span>
        </div>
        <p className="text-gray-600 mb-2 line-clamp-2">{action.description}</p>
        <p className="text-sm text-gray-500 mb-2">
          {date} - {time}
        </p>
        {action.locationType === 'online' ? (
          <p className="text-sm text-blue-600"> 💻 Online</p>
        ) : (
          <p className="text-sm text-gray-600"> 💻 {action.placeName || 'Presencial'}</p>
        )}
        {type === 'past' && action.recordingUrl && (
          <span className="inline-block mt-2 text-gray-500 text-sm">Grabación disponible</span>
        )}
      </div>
    </Link>
  );
}