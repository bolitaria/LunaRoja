import { useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Contact() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-700">Contacto y suscripción</h1>
        
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
          {/* Información de contacto */}
          <div className="mb-8 text-center">
            <p className="text-gray-600 mb-2">
              Si tienes preguntas, sugerencias o deseas colaborar, escríbenos a:
            </p>
            <a
              href="mailto:contacto@vocespalestinas.org"
              className="inline-block text-lg font-semibold text-fuchsia-600 hover:text-fuchsia-800 hover:underline transition"
            >
              contacto@vocespalestinas.org
            </a>
            <p className="text-sm text-gray-500 mt-2">
              Respondemos en un plazo máximo de 48 horas.
            </p>
          </div>

          <hr className="my-6 border-gray-200" />

          {/* Formulario de suscripción */}
          <div>
            <p className="text-center text-gray-600 mb-6">
              Déjanos tu correo para recibir noticias, eventos y recordatorios importantes.
            </p>
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-fuchsia-600 text-white py-2.5 rounded-lg font-semibold hover:bg-fuchsia-700 transition disabled:opacity-50"
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