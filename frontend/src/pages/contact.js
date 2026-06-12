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
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Contacto y suscripción</h1>
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <p className="mb-6 text-center">
            Déjanos tu correo para recibir noticias, eventos y recordatorios importantes.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Suscribirme'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}