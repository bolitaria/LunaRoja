import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/axios';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import {
  FaCalendarAlt, FaBullhorn, FaUsers, FaEnvelope, FaNewspaper,
  FaPlus, FaList, FaArrowRight, FaExternalLinkAlt, FaHandHoldingHeart, FaUserFriends
} from 'react-icons/fa';

function StatCard({ title, value, icon, color, link }) {
  return (
    <Link href={link} className="block group">
      <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-5 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center justify-between mb-3">
          <span className={`p-3 rounded-lg ${color}`}>
            {icon}
          </span>
          <span className="text-3xl font-bold text-gray-800">{value}</span>
        </div>
        <h3 className="text-sm font-medium text-gray-600 group-hover:text-purple-700 transition-colors">{title}</h3>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const quickLinks = [];
  if (user?.role === 'superadmin' || user?.role === 'campaign_admin') {
    quickLinks.push(
      { name: 'Nueva Acción', href: '/admin/actions/new', icon: <FaPlus />, color: 'bg-purple-100 text-purple-700' },
      { name: 'Nueva Campaña', href: '/admin/campaigns/new', icon: <FaPlus />, color: 'bg-emerald-100 text-emerald-700' },
      { name: 'Nueva Campaña BDS', href: '/admin/bds/new', icon: <FaPlus />, color: 'bg-rose-100 text-rose-700' }
    );
  }
  quickLinks.push(
    { name: 'Ver Acciones', href: '/admin/actions', icon: <FaList />, color: 'bg-sky-100 text-sky-700' },
    { name: 'Ver Campañas', href: '/admin/campaigns', icon: <FaList />, color: 'bg-amber-100 text-amber-700' },
    { name: 'Ver Noticias', href: '/admin/news', icon: <FaNewspaper />, color: 'bg-violet-100 text-violet-700' }
  );

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </AdminLayout>
    );
  }

  // Si no hay stats, mostrar mensaje
  if (!stats || !stats.totals) {
    return (
      <AdminLayout title="Dashboard">
        <p className="text-center py-8 text-red-600">No se pudieron cargar las estadísticas.</p>
      </AdminLayout>
    );
  }

  const metabaseUrl = process.env.NEXT_PUBLIC_METABASE_URL || 'http://localhost:3001';

  return (
    <AdminLayout title="Dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel de Administración</h1>
        <p className="text-gray-500">
          Bienvenido al centro de control de <strong>Voces Palestinas por la Justicia</strong>.
        </p>
      </div>

      {/* Botón a Metabase */}
      <div className="flex justify-end mb-6">
        <a
          href={metabaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors shadow-sm"
        >
          <FaExternalLinkAlt className="w-4 h-4" />
          Análisis avanzado (Metabase)
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
        <StatCard title="Acciones" value={stats.totals.actions} icon={<FaCalendarAlt className="w-6 h-6 text-purple-600" />} color="bg-purple-100" link="/admin/actions" />
        <StatCard title="Campañas" value={stats.totals.campaigns} icon={<FaBullhorn className="w-6 h-6 text-emerald-600" />} color="bg-emerald-100" link="/admin/campaigns" />
        <StatCard title="BDS" value={stats.totals.bds || 0} icon={<FaBullhorn className="w-6 h-6 text-rose-600" />} color="bg-rose-100" link="/admin/bds" />
        <StatCard title="Usuarios" value={stats.totals.users} icon={<FaUsers className="w-6 h-6 text-sky-600" />} color="bg-sky-100" link="/admin/users" />
        <StatCard title="Suscriptores" value={stats.totals.subscribers} icon={<FaEnvelope className="w-6 h-6 text-amber-600" />} color="bg-amber-100" link="/admin/subscribers" />
        <StatCard title="Noticias" value={stats.totals.noticias || stats.totals.news || 0} icon={<FaNewspaper className="w-6 h-6 text-violet-600" />} color="bg-violet-100" link="/admin/news" />
      </div>

      {/* Tarjetas adicionales si existen */}
      {stats.totals.donations !== undefined && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <StatCard title="Donaciones" value={stats.totals.donations} icon={<FaHandHoldingHeart className="w-6 h-6 text-red-600" />} color="bg-red-100" link="/admin/donations" />
          <StatCard title="Siguen acciones" value={stats.totals.followersActions} icon={<FaUserFriends className="w-6 h-6 text-indigo-600" />} color="bg-indigo-100" link="/admin/actions" />
          <StatCard title="Siguen campañas" value={stats.totals.followersCampaigns} icon={<FaUserFriends className="w-6 h-6 text-cyan-600" />} color="bg-cyan-100" link="/admin/campaigns" />
        </div>
      )}

      {quickLinks.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FaArrowRight className="text-purple-500" /> Accesos rápidos
          </h2>
          <div className="flex flex-wrap gap-3">
            {quickLinks.map((link, idx) => (
              <Link key={idx} href={link.href} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow-md ${link.color}`}>
                {link.icon}
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Actividad reciente */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Actividad reciente</h3>
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {stats.recentActivity.map((item, idx) => (
                <li key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{item.type}</span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('es-ES')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No hay actividad reciente.</p>
          )}
        </div>

        {/* Próximas acciones */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Próximas acciones</h3>
          {stats.upcomingActions && stats.upcomingActions.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {stats.upcomingActions.map(action => (
                <li key={action.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{action.title}</p>
                    <p className="text-xs text-gray-400">{new Date(action.datetime).toLocaleDateString('es-ES')}</p>
                  </div>
                  <Link href={`/admin/actions/${action.id}/edit`} className="text-xs text-purple-600 hover:underline">Editar</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No hay acciones próximas.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}