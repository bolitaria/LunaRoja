import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api, { fetchCsrfToken } from '../../lib/axios';
import DOMPurify from 'dompurify';
import Link from 'next/link';
import Layout from '../../components/Layout';

export default function PetitionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [petition, setPetition] = useState(null);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailHtml, setEmailHtml] = useState('');

  useEffect(() => {
    if (id) {
      api.get(`/petitions/${id}`)
        .then(res => {
          setPetition(res.data);
          if (res.data.type !== 'official') {
            const initial = {};
            res.data.signature_fields.forEach(f => { initial[f.name] = ''; });
            setFormData(initial);
            fetchCsrfToken();
          }
        })
        .catch(() => setError('Petición no encontrada'));
    }
  }, [id]);

  useEffect(() => {
    if (petition && petition.type !== 'official') {
      const templateId = petition.emailTemplateId || 121;
      const url = `/api/email-templates/${templateId}/preview?headerColor=${encodeURIComponent(petition.header_color || '#b91c1c')}&titleColor=${encodeURIComponent(petition.title_color || '#ffffff')}&footerColor=${encodeURIComponent(petition.footer_color || '#1f2937')}&footerTitleColor=${encodeURIComponent(petition.footer_title_color || '#ffffff')}&title=${encodeURIComponent(petition.title || '')}&content=${encodeURIComponent(petition.content || '')}&subject=${encodeURIComponent(petition.email_subject || '')}`;
      fetch(url)
        .then(res => res.text())
        .then(html => setEmailHtml(html))
        .catch(() => setEmailHtml(''));
    }
  }, [petition]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/petitions/${id}/sign`, formData);
      setMessage('¡Gracias! Tu firma ha sido registrada.');
      setError('');
      const cleared = {};
      petition.signature_fields.forEach(f => { cleared[f.name] = ''; });
      setFormData(cleared);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar la firma');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return url;
  };

  const recipients = petition?.target_emails || [];

  if (!petition) return <Layout title="Cargando..."><div className="container mx-auto p-8">Cargando...</div></Layout>;

  if (petition.type === 'official') {
    return (
      <Layout title={`${petition.title} - Petición Oficial`}>
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {petition.featured_image && (
              <img src={getImageUrl(petition.featured_image)} alt={petition.title} className="w-full h-64 md:h-80 object-cover rounded-xl mb-6" />
            )}
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-3">Petición Oficial</span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{petition.title}</h1>
            <p className="text-gray-600 mb-8">Esta petición se encuentra alojada en una plataforma externa.</p>
            <a
              href={petition.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition text-lg"
            >
              Ir a la petición oficial
            </a>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout title={`${petition.title} - Firma Petición`}>
      <main className="max-w-7xl mx-auto px-4 py-8 bg-gray-50">
        {/* Título limpio, sin etiquetas */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">{petition.title}</h1>
          {petition.deadline && (
            <p className="text-sm text-gray-500 mt-2">
              Fecha límite: {new Date(petition.deadline).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna izquierda: email template (más estrecha ahora) */}
          <div className="lg:col-span-7 space-y-6">
            {petition.email_subject && (
              <div className="bg-gray-50 rounded-2xl shadow-sm border border-gray-200 p-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase mb-1">Asunto del correo</h2>
                <p className="text-lg text-gray-800 font-medium">{petition.email_subject}</p>
              </div>
            )}

            {emailHtml && (
              <div
                dangerouslySetInnerHTML={{ __html: emailHtml }}
                className="w-full"
                style={{ backgroundColor: '#f9fafb' }}
              />
            )}
          </div>

          {/* Columna derecha: imagen, firma, destinatarios (más ancha) */}
          <div className="lg:col-span-5 mt-12 space-y-6">
            {/* Box de firma */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {petition.featured_image && (
                <img
                  src={getImageUrl(petition.featured_image)}
                  alt={petition.title}
                  className="w-full h-auto max-h-96 object-contain bg-gray-50"
                />
              )}
              <div className="p-6 space-y-4">
                {/* Etiquetas de tipo y urgencia */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                    Petición Interna
                  </span>
                  {petition.urgency && (
                    <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">
                      🔥 Urgente
                    </span>
                  )}
                </div>

                {petition.description && (
                  <p className="text-gray-600 text-lg">{petition.description}</p>
                )}

                {!message ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Firma esta petición</h2>
                    <p className="text-sm text-gray-500 mb-4">Completa los campos para dejar tu firma.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {petition.signature_fields.map(field => (
                        <div key={field.name}>
                          <label className="block mb-1 text-sm font-medium text-gray-600">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              name={field.name}
                              value={formData[field.name] || ''}
                              onChange={handleChange}
                              required={field.required}
                              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm"
                              rows={3}
                            />
                          ) : (
                            <input
                              type={field.type === 'email' ? 'email' : 'text'}
                              name={field.name}
                              value={formData[field.name] || ''}
                              onChange={handleChange}
                              required={field.required}
                              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm"
                            />
                          )}
                        </div>
                      ))}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 text-lg shadow-sm"
                      >
                        {loading ? 'Enviando...' : 'Firmar petición'}
                      </button>
                    </form>
                    <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                      <p className="text-3xl font-bold text-gray-800">{petition.total_signatures || 0}</p>
                      <p className="text-sm text-gray-500 mt-1">personas han firmado</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Gracias por firmar!</h2>
                    <p className="text-gray-600 mb-6">{message}</p>
                    <Link href="/subscribe" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                      Suscribirme a noticias
                    </Link>
                  </div>
                )}
                {error && <p className="mt-4 text-red-600 text-sm text-center">{error}</p>}
              </div>
            </div>

            {/* Destinatarios, ahora debajo del box de firma */}
            {recipients.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Destinatarios de la petición
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recipients.map((recipient, idx) => (
                    <span key={idx} className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-full border border-red-400 shadow-sm">
                      {recipient}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
}
