export default function PetitionPreview({ form }) {
  const { title, content, type, urgency, deadline, targetEmails, externalUrl, signature_fields = [], featured_image } = form;

  const getDomain = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-xl">
      {urgency && (
        <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full mb-3">
          🔥 Urgente
        </span>
      )}
      {featured_image && (
        <img src={featured_image} alt="Vista previa" className="w-full h-48 object-cover rounded-lg mb-4" />
      )}
      <h2 className="text-2xl font-bold mb-2">{title || 'Título de la petición'}</h2>
      {deadline && (
        <p className="text-sm text-gray-500 mb-3">
          Fecha límite: {new Date(deadline).toLocaleDateString()}
        </p>
      )}

      {type === 'official' ? (
        <div className="space-y-3">
          <p className="text-gray-700">
            Serás redirigido al sitio oficial de <strong>{externalUrl ? getDomain(externalUrl) : '...'}</strong>.
          </p>
          {targetEmails && (
            <div>
              <span className="text-sm font-medium">Dirigido a:</span>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                {targetEmails.split(',').map((email, idx) => (
                  <li key={idx}>{email.trim()}</li>
                ))}
              </ul>
            </div>
          )}
          <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Ir a la petición oficial
          </a>
        </div>
      ) : (
        <div>
          <div className="prose mb-4" dangerouslySetInnerHTML={{ __html: content || '<p>Contenido de la petición...</p>' }} />
          {signature_fields.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Firmar esta petición</h4>
              {signature_fields.map(f => (
                <div key={f.name} className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  {f.type === 'textarea' ? (
                    <textarea className="w-full border p-2 rounded" disabled placeholder={f.label} />
                  ) : (
                    <input type={f.type === 'email' ? 'email' : 'text'} className="w-full border p-2 rounded" disabled placeholder={f.label} />
                  )}
                </div>
              ))}
              <button className="bg-fuchsia-600 text-white px-4 py-2 rounded" disabled>Firmar petición</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
