import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import ActionCard from '../components/ActionCard';

export default function Acciones() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, in_progress, planned

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const url = filter === 'all'
          ? `${process.env.NEXT_PUBLIC_API_URL}/actions`
          : `${process.env.NEXT_PUBLIC_API_URL}/actions?status=${filter}`;
        const res = await axios.get(url);
        setActions(res.data);
      } catch (error) {
        console.error('Error fetching actions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActions();
  }, [filter]);

  return (
    <Layout title="Acciones - LunaRoja">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4 text-center">Acciones</h1>
        <p className="text-center text-gray-600 mb-8">Conoce nuestro progreso y planes futuros</p>

        {/* Filtros */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            Completadas
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded ${filter === 'in_progress' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            En curso
          </button>
          <button
            onClick={() => setFilter('planned')}
            className={`px-4 py-2 rounded ${filter === 'planned' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            Futuras
          </button>
        </div>

        {loading ? (
          <p className="text-center">Cargando acciones...</p>
        ) : actions.length === 0 ? (
          <p className="text-center">No hay acciones en esta categoría.</p>
        ) : (
          <div className="max-w-3xl mx-auto">
            {actions.map((action, index) => (
              <ActionCard key={action.id} action={action} index={index} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}