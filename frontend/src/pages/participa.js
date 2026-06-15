import { useState } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Layout from '../components/Layout';

export default function Participa() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState(null);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/subscribers`, { email });
      setSubscribed(true);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al suscribirse. Inténtalo de nuevo.');
    }
  };

  return (
    <Layout title="Participa - Voces Palestinas por la Justicia">
      <Head>
        <title>Participa - Voces Palestinas por la Justicia</title>
      </Head>

      <div className="container mx-auto px-4 py-16">   {/* mayor separación vertical */}
        <h1 className="text-4xl font-bold text-center mb-12">Participa</h1>   {/* más espacio debajo del título */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sección Dona */}
          <div id="dona" className="bg-white p-6 rounded-lg shadow-md text-center flex flex-col justify-between h-full">
            <div>
              <span className="text-5xl">❤️</span>
              <h2 className="text-2xl font-semibold mt-4 mb-2">Dona</h2>
              <p className="text-gray-600 mb-4">
                Tu contribución nos ayuda a mantener nuestras campañas y acciones.
              </p>
            </div>
            <a
              href="https://www.paypal.com/donate?hosted_button_id=XXXXXXXX"   // Reemplaza con tu enlace real
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 transition"
            >
              Donar ahora
            </a>
          </div>

          {/* Sección Instagram */}
          <div className="bg-white p-6 rounded-lg shadow-md text-center flex flex-col justify-between h-full">
            <div>
              <svg className="w-12 h-12 mx-auto text-pink-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <h2 className="text-2xl font-semibold mt-4 mb-2">Síguenos en Instagram</h2>
              <p className="text-gray-600 mb-4">
                Entérate de las últimas novedades y acciones.
              </p>
            </div>
            <a
              href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border-2 border-pink-600 text-pink-600 px-6 py-2 rounded-full font-semibold hover:bg-pink-50 transition"
            >
              Ir a Instagram
            </a>
          </div>

          {/* Sección Suscríbete con icono de correo azul */}
          <div className="bg-white p-6 rounded-lg shadow-md text-center flex flex-col justify-between h-full">
            <div>
              {/* Icono de sobre azul */}
              <svg className="w-12 h-12 mx-auto text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h2 className="text-2xl font-semibold mt-4 mb-2">Suscríbete</h2>
              <p className="text-gray-600 mb-4">
                Recibe notificaciones de nuevas actividades y eventos.
              </p>
            </div>
            {subscribed ? (
              <p className="text-green-600 font-medium">¡Gracias por suscribirte!</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full px-4 py-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 transition"
                >
                  Suscribirme
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}