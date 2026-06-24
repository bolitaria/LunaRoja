import { useRouter } from 'next/router';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import api from '../../lib/axios';      // ajusta la ruta si es necesario
import Layout from '../../components/Layout';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import 'react-calendar/dist/Calendar.css';
import { categoryLabels, categoryStyles } from '../../utils/categoryConfig';

const Calendar = dynamic(() => import('react-calendar'), { ssr: false });

const getLocalDateStr = (date) => { /* igual que antes */ };

export default function BDSDetalle() {
  const router = useRouter();
  const { id } = router.query;
  const [bds, setBds] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user && ['superadmin', 'bds_admin', 'action_admin'].includes(user.role);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [bdsRes, actionsRes] = await Promise.all([
          api.get(`/bds/${id}`),
          api.get(`/actions?bdsId=${id}`),
        ]);
        setBds(bdsRes.data);
        setActions(actionsRes.data);
      } catch (error) {
        console.error('Error fetching BDS detail', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ... resto del código (misma estructura que campanas/[id].js, cambiando campaign por bds)

  if (loading) return <Layout><p className="text-center py-20">Cargando...</p></Layout>;
  if (!bds) return <Layout><p className="text-center py-20">BDS no encontrada</p></Layout>;

  return (
    <Layout title={`${bds.name} - Voces Palestinas por la Justicia`}>
      {/* mismo diseño que la página de detalle de campaña */}
    </Layout>
  );
}