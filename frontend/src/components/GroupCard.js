export default function GroupCard({ group }) {
  const platformIcons = {
    telegram: '✈️',
    whatsapp: '📱'
  };
  const platformColors = {
    telegram: 'bg-blue-500 hover:bg-blue-600',
    whatsapp: 'bg-green-500 hover:bg-green-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold">{group.name}</h3>
        <span className="text-2xl" title={group.platform === 'telegram' ? 'Telegram' : 'WhatsApp'}>
          {platformIcons[group.platform]}
        </span>
      </div>
      {group.region && (
        <p className="text-sm text-gray-500 mb-2">🌍 {group.region}</p>
      )}
      <p className="text-gray-600 mb-4">{group.description}</p>
      <a
        href={group.link}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-white px-4 py-2 rounded inline-block ${platformColors[group.platform]}`}
      >
        Unirme en {group.platform === 'telegram' ? 'Telegram' : 'WhatsApp'}
      </a>
    </div>
  );
}