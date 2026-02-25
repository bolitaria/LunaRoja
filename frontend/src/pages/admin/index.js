import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';

function AdminDashboard() {
  const [stats, setStats] = useState({ videos: 0, reports: 0, subscribers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [videosRes, reportsRes, subsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/videos`, { headers }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`, { headers }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/subscribers`, { headers })
        ]);
        setStats({
          videos: videosRes.data.length,
          reports: reportsRes.data.length,
          subscribers: subsRes.data.length,
        });
      } catch (error) {
        console.error('Error fetching stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <p>Cargando estadísticas...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm uppercase">Videos</h3>
            <p className="text-3xl font-bold">{stats.videos}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm uppercase">Reportes</h3>
            <p className="text-3xl font-bold">{stats.reports}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm uppercase">Suscriptores</h3>
            <p className="text-3xl font-bold">{stats.subscribers}</p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default withAuth(AdminDashboard);