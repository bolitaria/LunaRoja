export default function EventCard({ event, type }) {
  const date = new Date(event.datetime).toLocaleDateString();
  const time = new Date(event.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const categoryLabels = {
      protest: 'Manifestación',
      bds: 'Acción BDS',
      strike: 'Huelga',
      march: 'Marcha',
      solidarity_action: 'Acción Solidaria',
      workshop: 'Taller',
      talk: 'Charla',
      webinar: 'Webinar'
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

  const renderLocation = () => {
    if (event.locationType === 'online') {
      return (
        <p className="text-sm text-blue-600">
          💻 Online: <a href={event.onlineLink} target="_blank" rel="noopener" className="underline">Enlace de acceso</a>
        </p>
      );
    } else {
      return (
        <p className="text-sm text-gray-600">
          📍 Presencial: {event.placeName}<br />
          {event.address}
          {event.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
              target="_blank"
              rel="noopener"
              className="text-blue-600 underline text-sm block mt-1"
            >
              Ver en Google Maps
            </a>
          )}
        </p>
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-semibold">{event.title}</h3>
        <span className={`text-xs px-2 py-1 rounded ${categoryColors[event.category]}`}>
          {categoryLabels[event.category]}
        </span>
      </div>
      <p className="text-gray-600 mb-2">{event.description}</p>
      <p className="text-sm text-gray-500 mb-2">
        {date} - {time}
      </p>
      {renderLocation()}
      {type === 'upcoming' && event.registrationLink && (
        <a
          href={event.registrationLink}
          target="_blank"
          rel="noopener"
          className="bg-red-600 text-white px-4 py-2 rounded inline-block hover:bg-red-700 mt-4"
        >
          Registrarme
        </a>
      )}
      {type === 'past' && event.recordingUrl && (
        <a
          href={event.recordingUrl}
          target="_blank"
          rel="noopener"
          className="bg-gray-600 text-white px-4 py-2 rounded inline-block hover:bg-gray-700 mt-4"
        >
          Ver grabación
        </a>
      )}
    </div>
  );
}