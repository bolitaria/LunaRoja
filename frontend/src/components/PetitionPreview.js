// frontend/src/components/PetitionPreview.js
// Vista previa pública — clon visual de /peticiones/[id].js.
// SIN customColors (esos solo aplican al email y se ven en el iframe del admin).
//
// Props:
//   - form: { title, description, type, urgency, deadline, external_url,
//             featured_image, email_subject, target_emails, signature_fields }
//   - emailPreviewUrl: URL del iframe del email (solo interna). Se abre
//     dentro de un modal para ver la apariencia real del correo.

import { useState } from 'react';
import AutoHeightIframe from './AutoHeightIframe';
import { FaEnvelope, FaExternalLinkAlt, FaFire, FaLock } from 'react-icons/fa';

export default function PetitionPreview({ form, emailPreviewUrl = null }) {
  const [showEmailModal, setShowEmailModal] = useState(false);

  const {
    title = '',
    description = '',
    type,
    urgency,
    deadline,
    external_url,
    featured_image,
    email_subject,
    target_emails = [],
    signature_fields = [],
  } = form || {};

  const isExternal = type === 'official' || type === 'external';
  const getImageUrl = (url) => (url && (url.startsWith('http') ? url : url)) || null;
  const recipients = target_emails || [];

  // ═══════════════════════════════════════════════════════════
  // EXTERNA — card blanca centrada
  // ═══════════════════════════════════════════════════════════
  if (isExternal) {
    return (
      <article className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-3xl mx-auto">
        {featured_image && (
          <img
            src={getImageUrl(featured_image)}
            alt={title}
            className="w-full aspect-video object-cover"
          />
        )}
        <div className="p-6 md:p-8 space-y-5 text-center">
          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
            🌐 Petición Externa
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
            {title || 'Título de la petición'}
          </h1>
          {description && (
            <p className="text-gray-600 leading-relaxed">{description}</p>
          )}
          <p className="text-gray-500 text-sm">
            Esta petición se encuentra alojada en una plataforma externa.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 bg-green-600 text-white font-bold py-3 px-7 rounded-xl text-base shadow-sm">
              Ir a la petición oficial
            </span>
          </div>
          {external_url && (
            <p className="text-xs text-gray-400 truncate pt-2">{external_url}</p>
          )}
        </div>
      </article>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // INTERNA — misma estética, apilado vertical
  // ═══════════════════════════════════════════════════════════
  return (
    <>
      <article className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-3xl mx-auto">
        {featured_image && (
          <img
            src={getImageUrl(featured_image)}
            alt={title}
            className="w-full aspect-video object-cover"
          />
        )}

        <div className="p-6 md:p-8 space-y-6">
          {/* Cabecera */}
          <div className="text-center space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-block bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                ✍️ Petición Interna
              </span>
              {urgency && (
                <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                  <FaFire className="w-3 h-3" /> Urgente
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
              {title || 'Título de la petición'}
            </h1>
            {deadline && (
              <p className="text-sm text-gray-500">
                📅 Fecha límite: {new Date(deadline).toLocaleDateString('es-ES')}
              </p>
            )}
            {description && (
              <p className="text-gray-600 leading-relaxed text-left md:text-center pt-2">
                {description}
              </p>
            )}
          </div>

          {/* Divisor */}
          <hr className="border-gray-100" />

          {/* Email a firmar — mosaico clicable */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FaEnvelope className="text-fuchsia-600" /> Email a firmar
            </h2>
            <button
              type="button"
              disabled={!emailPreviewUrl}
              onClick={() => emailPreviewUrl && setShowEmailModal(true)}
              className={`w-full text-left rounded-xl border p-4 transition group ${
                emailPreviewUrl
                  ? 'border-fuchsia-200 bg-fuchsia-50/50 hover:border-fuchsia-400 hover:bg-fuchsia-50 cursor-pointer'
                  : 'border-gray-200 bg-gray-50 cursor-default'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {email_subject ? (
                    <>
                      <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                        Asunto
                      </p>
                      <p className="text-base font-semibold text-gray-800 break-words">
                        {email_subject}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      Configura el asunto y el cuerpo del email
                    </p>
                  )}
                </div>
                {emailPreviewUrl && (
                  <FaExternalLinkAlt className="text-fuchsia-400 group-hover:text-fuchsia-600 w-4 h-4 flex-shrink-0 mt-1 transition" />
                )}
              </div>
              {emailPreviewUrl && (
                <p className="text-xs text-fuchsia-600 mt-2 font-medium">
                  Pulsa para ampliar la apariencia del email
                </p>
              )}
            </button>
          </div>

          {/* Divisor */}
          <hr className="border-gray-100" />

          {/* Formulario de firma (preview) */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Firma esta petición</h2>
            <p className="text-sm text-gray-500 mb-4">
              Completa los campos para dejar tu firma.
            </p>
            <div className="space-y-3">
              {signature_fields.map((field) => (
                <div key={field.name}>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      disabled
                      rows={2}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-sm"
                    />
                  ) : (
                    <input
                      type={field.type === 'email' ? 'email' : 'text'}
                      disabled
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-sm"
                    />
                  )}
                </div>
              ))}
              <button
                disabled
                className="w-full bg-green-600 text-white font-bold py-3 rounded-xl text-base opacity-80 cursor-not-allowed shadow-sm"
              >
                Firmar petición
              </button>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              <p className="text-3xl font-bold text-gray-800">0</p>
              <p className="text-xs text-gray-500 mt-0.5">personas han firmado</p>
            </div>
          </div>

          {/* Destinatarios */}
          {recipients.length > 0 && (
            <>
              <hr className="border-gray-100" />
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FaLock className="text-red-500" /> Destinatarios de la petición
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recipients.map((r, i) => (
                    <span
                      key={i}
                      className="bg-red-50 text-red-700 text-xs px-3 py-1.5 rounded-full border border-red-200"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </article>

      {/* Modal — apariencia del email */}
      {showEmailModal && emailPreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowEmailModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <FaEnvelope className="text-fuchsia-600" /> Apariencia del email
              </h3>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                title="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-4">
              <AutoHeightIframe
                src={emailPreviewUrl}
                title="Apariencia del email"
                minHeight={500}
                maxHeight={2400}
                className="bg-white rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
