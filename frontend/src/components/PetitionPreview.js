import DOMPurify from 'dompurify';

export default function PetitionPreview({ form, customColors }) {
  const {
    title,
    description,
    content,
    type,
    urgency,
    deadline,
    target_emails = [],
    external_url,
    signature_fields = [],
    featured_image,
    email_subject,
  } = form;

  const colors = {
    headerColor: customColors?.headerColor || '#b91c1c',
    titleColor: customColors?.titleColor || '#ffffff',
    footerColor: customColors?.footerColor || '#1f2937',
    footerTitleColor: customColors?.footerTitleColor || '#ffffff',
    buttonColor: customColors?.buttonColor || '#16a34a',
    backgroundColor: customColors?.backgroundColor || '#f3f4f6',
  };

  const sanitizedContent = content ? DOMPurify.sanitize(content) : '';
  const sanitizedDescription = description ? DOMPurify.sanitize(description) : '';

  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url || '...';
    }
  };

  const isExternal = type === 'official' || type === 'external';

  return (
    <div
      className="rounded-2xl shadow-lg overflow-hidden max-w-2xl mx-auto"
      style={{ backgroundColor: colors.backgroundColor }}
    >
      {/* Cabecera */}
      <div
        className="px-6 py-4"
        style={{ backgroundColor: colors.headerColor, color: colors.titleColor }}
      >
        <h2 className="text-2xl font-bold leading-tight">
          {title || 'Título de la petición'}
        </h2>
        {email_subject && (
          <p className="text-sm opacity-90 mt-1">Asunto: {email_subject}</p>
        )}
      </div>

      {/* Cuerpo */}
      <div className="p-6 space-y-4">
        {urgency && (
          <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
            🔥 Urgente
          </span>
        )}

        {featured_image && (
          <img
            src={featured_image}
            alt="Vista previa"
            className="w-full h-48 object-cover rounded-lg"
          />
        )}

        {sanitizedDescription && (
          <div
            className="prose text-gray-700"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        )}

        {deadline && (
          <p className="text-sm text-gray-500">
            Fecha límite: {new Date(deadline).toLocaleDateString()}
          </p>
        )}

        {isExternal ? (
          <div className="space-y-3">
            <p className="text-gray-700">
              Serás redirigido al sitio oficial de{' '}
              <strong>{external_url ? getDomain(external_url) : '...'}</strong>.
            </p>
            {target_emails?.length > 0 && (
              <div>
                <span className="text-sm font-medium">Dirigido a:</span>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  {target_emails.map((email, idx) => (
                    <li key={idx}>{email}</li>
                  ))}
                </ul>
              </div>
            )}
            <a
              href={external_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-white px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.buttonColor }}
            >
              Ir a la petición oficial
            </a>
          </div>
        ) : (
          <div>
            <div
              className="prose mb-4"
              dangerouslySetInnerHTML={{
                __html: sanitizedContent || '<p>Contenido de la petición...</p>',
              }}
            />
            {signature_fields.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Firmar esta petición</h4>
                {signature_fields.map((f) => (
                  <div key={f.name} className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    {f.type === 'textarea' ? (
                      <textarea
                        className="w-full border p-2 rounded bg-white"
                        disabled
                        placeholder={f.label}
                      />
                    ) : (
                      <input
                        type={f.type === 'email' ? 'email' : 'text'}
                        className="w-full border p-2 rounded bg-white"
                        disabled
                        placeholder={f.label}
                      />
                    )}
                  </div>
                ))}
                <button
                  className="text-white px-4 py-2 rounded"
                  style={{ backgroundColor: colors.buttonColor }}
                  disabled
                >
                  Firmar petición
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-6 py-4 flex justify-between items-center"
        style={{ backgroundColor: colors.footerColor, color: colors.footerTitleColor }}
      >
        <span className="text-sm">Voces Palestinas por la Justicia</span>
        <span className="text-xs">© {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}