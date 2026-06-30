import { useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Contact() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/subscribers`, { email });
      toast.success('¡Suscripción exitosa! Revisa tu correo para confirmar (si aplica).');
      setEmail('');
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Este email ya está suscrito.');
      } else {
        toast.error('Error al suscribir. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Contacto - Voces Palestinas por la Justicia">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold mb-10 text-center text-red-600">
          Contacto y suscripción
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Columna de información de contacto */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Escríbenos</h2>
              <p className="text-gray-600 mb-4">
                Para consultas, sugerencias o colaboraciones:
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="inline-block text-lg font-bold text-green-600 hover:text-green-700 hover:underline transition"
              >
                {contactEmail}
              </a>
              <p className="text-sm text-gray-500 mt-3">
                Respondemos en un máximo de 48 horas.
              </p>
            </div>

            {/* Redes sociales */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <p className="text-center text-sm text-gray-500 mb-3">Síguenos en</p>
              <div className="flex justify-center gap-4">
                <a
                  href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-red-600 transition"
                  aria-label="Instagram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-red-600 transition"
                  aria-label="Twitter"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.555-2.005.959-3.127 1.184-.896-.959-2.173-1.559-3.591-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124C7.691 8.094 4.066 6.13 1.64 3.161c-.427.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63.961-.689 1.8-1.56 2.46-2.548l-.047-.02z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-red-600 transition"
                  aria-label="Facebook"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Columna de suscripción */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Recibe nuestras novedades
            </h2>
            <p className="text-gray-600 mb-6 text-center text-sm">
              Déjanos tu correo y te avisaremos de nuevas acciones, campañas y noticias.
            </p>
            <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-gray-700"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Suscribirme'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}