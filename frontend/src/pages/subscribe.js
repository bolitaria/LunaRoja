import { useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Subscribe() {
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
    <Layout title="Suscríbete - Voces Palestinas por la Justicia">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-700 tracking-tight">
              Suscríbete a nuestra newsletter
            </h1>
            <div className="h-1 w-full max-w-xs mx-auto bg-green-600 mt-3"></div>
            <p className="text-lg text-gray-600 mt-4 max-w-xl mx-auto">
              Recibe nuestras novedades, acciones y campañas directamente en tu correo.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit}>
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
            <p className="text-xs text-gray-500 mt-4 text-center">
              Puedes darte de baja en cualquier momento.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}