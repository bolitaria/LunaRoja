// frontend/src/components/ChatGroupCard.js
export default function ChatGroupCard({ group }) {
  const platformInfo = {
    telegram: { name: 'Telegram', icon: '✈️', bgColor: 'bg-blue-500', hoverBg: 'hover:bg-blue-600', borderColor: 'border-blue-200', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800' },
    whatsapp: { name: 'WhatsApp', icon: '📱', bgColor: 'bg-green-500', hoverBg: 'hover:bg-green-600', borderColor: 'border-green-200', badgeBg: 'bg-green-100', badgeText: 'text-green-800' },
    signal:    { name: 'Signal',   icon: '🔒', bgColor: 'bg-purple-500', hoverBg: 'hover:bg-purple-600', borderColor: 'border-purple-200', badgeBg: 'bg-purple-100', badgeText: 'text-purple-800' },
  };

  const info = platformInfo[group.platform] || platformInfo.telegram;

  return (
    <div className={`group relative bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-t-4 ${info.borderColor}`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{group.name}</h3>
          </div>
          <div className={`p-2 rounded-full ${info.bgColor} bg-opacity-10`}>
            <div className={`w-8 h-8 flex items-center justify-center rounded-full ${info.bgColor} text-white text-xl`}>
              {info.icon}
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed mb-5 line-clamp-3">
          {group.description}
        </p>

        <a
          href={group.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center w-full px-4 py-2 rounded-lg font-medium text-white transition-colors ${info.bgColor} ${info.hoverBg}`}
        >
          🔗 Unirme en {info.name}
        </a>
      </div>
    </div>
  );
}