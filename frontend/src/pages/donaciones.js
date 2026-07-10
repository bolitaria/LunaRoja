import { useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

export default function Donaciones() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState(null);

  const paypalUrl = process.env.NEXT_PUBLIC_PAYPAL_DONATE_URL;

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
    <Layout title="Donaciones - Voces Palestinas por la Justicia">
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-700 tracking-tight">
              Donaciones
            </h1>
            <div className="h-1 w-full max-w-xs mx-auto bg-green-600 mt-3"></div>
            <p className="text-lg text-gray-600 mt-4">Próximamente disponibles</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-gray-700 mb-4">
              Gracias de corazón por tu interés en apoyar este proyecto.
            </p>
            <p className="text-gray-700 mb-4">
              En estos momentos, las donaciones no están activadas en nuestra web. Estamos en pleno proceso de constitución formal y, para garantizar la máxima transparencia desde el inicio, hemos decidido no aceptar aportaciones hasta que todo esté legalmente establecido y podamos ofreceros la seguridad que os merecéis.
            </p>
            <p className="text-gray-700 mb-8">
              Si quieres ser el primero en saber cuándo estén operativas, suscríbete a nuestra lista y te enviaremos un aviso por email en cuanto podamos recibir vuestro apoyo.
            </p>

            <div className="max-w-md mx-auto mb-8">
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

            {paypalUrl && (
              <a
                href={paypalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition"
              >
                Donar con PayPal
              </a>
            )}

            <p className="mt-8 text-gray-500 text-sm">
              Valoramos profundamente vuestra confianza y vuestro entusiasmo. ¡Pronto tendremos buenas noticias!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}