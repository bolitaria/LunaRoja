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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const backendRoot = process.env.NEXT_PUBLIC_BASE_URL || apiUrl.replace(/\/api$/, '');

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

  const cleanContent = typeof window !== 'undefined' ? DOMPurify.sanitize(petition?.content || '') : '';

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const root = (backendRoot || '').replace(/\/$/, '');
    return `${root}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const recipients = petition?.email_recipients || [];

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
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 p-6 md:p-8">
              {petition.featured_image && (
                <img
                  src={getImageUrl(petition.featured_image)}
                  alt={petition.title}
                  className="w-full h-64 md:h-80 object-cover rounded-xl mb-6"
                />
              )}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">Petición Interna</span>
                {petition.urgency && (
                  <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full">🔥 Urgente</span>
                )}
              </div>
              {petition.deadline && (
                <p className="text-sm text-gray-500 mb-4">
                  <span className="font-medium">Fecha límite:</span> {new Date(petition.deadline).toLocaleDateString()}
                </p>
              )}
              <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: cleanContent }} />

              {recipients.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Destinatarios de esta petición
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recipients.map((recipient, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-200">
                        {recipient}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 md:p-8 flex flex-col border-l border-gray-100">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 hidden lg:block">
                {petition.title}
              </h1>

              {!message ? (
                <>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Firma esta petición</h2>
                  <form onSubmit={handleSubmit} className="space-y-4 flex-1">
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
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                    >
                      {loading ? 'Enviando...' : 'Firmar petición'}
                    </button>
                  </form>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold text-gray-700">{petition.total_signatures || 0}</span> personas han firmado
                    </p>
                    {petition.goal && (
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5 max-w-xs mx-auto">
                        <div
                          className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((petition.total_signatures / petition.goal) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-6 flex-1 flex flex-col justify-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Gracias por firmar!</h2>
                  <p className="text-gray-600 mb-6 text-sm">{message}</p>
                  <Link
                    href="/subscribe"
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Suscribirme a noticias
                  </Link>
                </div>
              )}
              {error && <p className="mt-4 text-red-600 text-sm text-center">{error}</p>}
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}