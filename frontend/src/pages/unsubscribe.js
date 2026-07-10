import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '../components/Layout';

export default function Unsubscribe() {
  const router = useRouter();
  const { email } = router.query;
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const handleUnsubscribe = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/subscribers/unsubscribe`, { email });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la baja.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Darse de baja - Voces Palestinas por la Justicia">
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
          {!done ? (
            <>
              <h1 className="text-2xl font-bold text-gray-600 mb-4">Darse de baja</h1>
              <p className="text-gray-600 mb-6">
                Vas a cancelar la suscripción de <strong>{email || 'tu correo'}</strong>.<br />
                Dejarás de recibir nuestros correos.
              </p>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <button
                onClick={handleUnsubscribe}
                disabled={loading || !email}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Confirmar baja'}
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-green-600 mb-4">Baja realizada</h1>
              <p className="text-gray-600">Tu suscripción ha sido cancelada. Lamentamos verte partir.</p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}