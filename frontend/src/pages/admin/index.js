import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    videos: 0,
    actions: 0,
    campaigns: 0,
    groups: 0,
    subscribers: 0,
    instagramPosts: 0,
    reports: 0,
    images: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Peticiones según el rol
        const promises = [];
        
        // Videos
        promises.push(axios.get(`${process.env.NEXT_PUBLIC_API_URL}/videos`, { headers }).then(res => ({ key: 'videos', value: res.data.length })));
        
        // Acciones
        promises.push(axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`, { headers }).then(res => ({ key: 'actions', value: res.data.length })));
        
        // Campañas (solo si es superadmin o campaign_admin)
        if (user.role === 'superadmin' || user.role === 'campaign_admin') {
          promises.push(axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, { headers }).then(res => ({ key: 'campaigns', value: res.data.length })));
        } else {
          promises.push(Promise.resolve({ key: 'campaigns', value: 0 }));
        }
        
        // Grupos
        promises.push(axios.get(`${process.env.NEXT_PUBLIC_API_URL}/working-groups`, { headers }).then(res => ({ key: 'groups', value: res.data.length })));
        
        // Suscriptores (solo superadmin)
        if (user.role === 'superadmin') {
          promises.push(axios.get(`${process.env.NEXT_PUBLIC_API_URL}/subscribers`, { headers }).then(res => ({ key: 'subscribers', value: res.data.length })));
        } else {
          promises.push(Promise.resolve({ key: 'subscribers', value: 0 }));
        }
        
        // Instagram posts
        promises.push(axios.get(`${process.env.NEXT_PUBLIC_API_URL}/instagram/posts`, { headers }).then(res => ({ key: 'instagramPosts', value: res.data.total || 0 })));
        
        // Reportes (solo superadmin)
        if (user.role === 'superadmin') {
          promises.push(axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`, { headers }).then(res => ({ key: 'reports', value: res.data.length })));
        } else {
          promises.push(Promise.resolve({ key: 'reports', value: 0 }));
        }
        
        // Imágenes (solo superadmin y campaign_admin pueden verlas, pero el endpoint ya filtra)
        promises.push(axios.get(`${process.env.NEXT_PUBLIC_API_URL}/images`, { headers }).then(res => ({ key: 'images', value: res.data.length })));
        
        const results = await Promise.all(promises);
        const newStats = results.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching stats', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchStats();
  }, [user]);

  if (loading) return <AdminLayout><p>Cargando estadísticas...</p></AdminLayout>;

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjetas visibles según rol */}
        {(user.role === 'superadmin' || user.role === 'campaign_admin' || user.role === 'action_admin') && (
          <StatCard title="Videos" value={stats.videos} link="/admin/videos" />
        )}
        {(user.role === 'superadmin' || user.role === 'campaign_admin' || user.role === 'action_admin') && (
          <StatCard title="Acciones" value={stats.actions} link="/admin/actions" />
        )}
        {(user.role === 'superadmin' || user.role === 'campaign_admin') && (
          <StatCard title="Campañas" value={stats.campaigns} link="/admin/campaigns" />
        )}
        {(user.role === 'superadmin' || user.role === 'campaign_admin' || user.role === 'action_admin') && (
          <StatCard title="Grupos" value={stats.groups} link="/admin/groups" />
        )}
        {user.role === 'superadmin' && (
          <>
            <StatCard title="Suscriptores" value={stats.subscribers} link="/admin/subscribers" />
            <StatCard title="Reportes" value={stats.reports} link="/admin/reports" />
          </>
        )}
        {(user.role === 'superadmin' || user.role === 'campaign_admin' || user.role === 'action_admin') && (
          <StatCard title="Publicaciones Instagram" value={stats.instagramPosts} link="/admin/instagram" />
        )}
        {(user.role === 'superadmin' || user.role === 'campaign_admin' || user.role === 'action_admin') && (
          <StatCard title="Imágenes" value={stats.images} link="/admin/images" />
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, link }) {
  return (
    <Link href={link} className="block">
      <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
        <h3 className="text-gray-500 text-sm uppercase">{title}</h3>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </Link>
  );
}

export default withAuth(AdminDashboard);