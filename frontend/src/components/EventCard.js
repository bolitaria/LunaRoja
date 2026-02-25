export default function EventCard({ event, type }) {
  const date = new Date(event.datetime).toLocaleDateString();
  const time = new Date(event.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Renderizar información de ubicación
  const renderLocation = () => {
    if (event.locationType === 'online') {
      return (
        <p className="text-sm text-blue-600">
          📍 Online: <a href={event.onlineLink} target="_blank" rel="noopener" className="underline">Enlace de acceso</a>
        </p>
      );
    } else {
      return (
        <p className="text-sm text-gray-600">
          📍 Presencial: {event.placeName}<br />
          {event.address}
          {event.latitude && event.longitude && (
            <a
              href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
              target="_blank"
              rel="noopener"
              className="block text-blue-600 underline mt-1"
            >
              Ver en mapa
            </a>
          )}
        </p>
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
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