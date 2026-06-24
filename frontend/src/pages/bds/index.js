import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import api from '../../lib/axios';          // usa la instancia con cookies (sin token)
import Layout from '../../components/Layout';
import Link from 'next/link';
import 'react-calendar/dist/Calendar.css';
import { categoryLabels, categoryStyles } from '../../utils/categoryConfig';

const Calendar = dynamic(() => import('react-calendar'), { ssr: false });

const getLocalDateStr = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function BDSList() {
  const [bdsList, setBdsList] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeFilter, setTimeFilter] = useState('todas');
  const [filterLocation, setFilterLocation] = useState('todos');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bdsRes, actionsRes] = await Promise.all([
          api.get('/bds'),
          api.get('/actions'),
        ]);
        setBdsList(bdsRes.data);
        setActions(actionsRes.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching BDS data:', err);
        setError('No se pudieron cargar las campañas BDS.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const now = new Date();
  const bdsMap = useMemo(() => bdsList.reduce((m, b) => ({ ...m, [b.id]: b }), {}), [bdsList]);

  const actionsByDate = useMemo(() => {
    const map = new Map();
    actions.forEach(action => {
      const dateStr = getLocalDateStr(action.datetime);
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr).push(action);
    });
    return map;
  }, [actions]);

  // ... resto de la lógica de filtrado (igual que en campanas/index.js pero con bds)

  if (loading) return <Layout><div className="text-center py-20">Cargando...</div></Layout>;

  return (
    <Layout title="Campañas BDS - Voces Palestinas por la Justicia">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-700 mb-6 text-center">Campañas BDS</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
            <button onClick={() => window.location.reload()} className="ml-2 underline">Reintentar</button>
          </div>
        )}

        {/* Filtros, calendario y lista de tarjetas (copia exacta del código de campanas/index.js) */}
        {/* ... */}

      </div>
    </Layout>
  );
}