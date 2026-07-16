import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../lib/axios';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import {
  FaCalendarAlt, FaBullhorn, FaUsers, FaEnvelope, FaNewspaper,
  FaPlus, FaList, FaArrowRight
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
  const [stats, setStats] = useState({
    totalActions: 0,
    totalCampaigns: 0,
    totalBDS: 0,
    totalUsers: 0,
    totalSubscribers: 0,
    totalNews: 0,
  });
  const [recentActions, setRecentActions] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [actionsRes, campaignsRes, bdsRes, usersRes, subscribersRes, newsRes] =
          await Promise.all([
            api.get('/actions'),
            api.get('/campaigns'),
            api.get('/bds'),
            api.get('/users'),
            api.get('/subscribers'),
            api.get('/news'),
          ]);

        setStats({
          totalActions: actionsRes.data.length,
          totalCampaigns: campaignsRes.data.length,
          totalBDS: bdsRes.data.length,
          totalUsers: usersRes.data.length,
          totalSubscribers: subscribersRes.data.length,
          totalNews: newsRes.data.length,
        });

        setRecentActions(actionsRes.data.slice(0, 5));
        setRecentCampaigns(campaignsRes.data.slice(0, 5));
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

  return (
    <AdminLayout title="Dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Panel de Administración</h1>
        <p className="text-gray-500">
          Bienvenido al centro de control de <strong>Voces Palestinas por la Justicia</strong>.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
        <StatCard title="Acciones" value={stats.totalActions} icon={<FaCalendarAlt className="w-6 h-6 text-purple-600" />} color="bg-purple-100" link="/admin/actions" />
        <StatCard title="Campañas" value={stats.totalCampaigns} icon={<FaBullhorn className="w-6 h-6 text-emerald-600" />} color="bg-emerald-100" link="/admin/campaigns" />
        <StatCard title="Campañas BDS" value={stats.totalBDS} icon={<FaBullhorn className="w-6 h-6 text-rose-600" />} color="bg-rose-100" link="/admin/bds" />
        <StatCard title="Usuarios" value={stats.totalUsers} icon={<FaUsers className="w-6 h-6 text-sky-600" />} color="bg-sky-100" link="/admin/users" />
        <StatCard title="Suscriptores" value={stats.totalSubscribers} icon={<FaEnvelope className="w-6 h-6 text-amber-600" />} color="bg-amber-100" link="/admin/subscribers" />
        <StatCard title="Noticias" value={stats.totalNews} icon={<FaNewspaper className="w-6 h-6 text-violet-600" />} color="bg-violet-100" link="/admin/news" />
      </div>

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
        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">📅 Últimas acciones</h3>
            <Link href="/admin/actions" className="text-sm text-purple-600 hover:underline inline-flex items-center gap-1">
              Ver todas <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentActions.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay acciones recientes.</p>
          ) : (
            <ul className="divide-y divide-purple-100">
              {recentActions.map(action => (
                <li key={action.id} className="py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <Link href={`/admin/actions/${action.id}/edit`} className="text-sm font-medium text-gray-800 hover:text-purple-700 transition-colors line-clamp-1">
                      {action.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(action.datetime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${new Date(action.datetime) < new Date() ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                    {new Date(action.datetime) < new Date() ? 'Pasada' : 'Próxima'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">📢 Últimas campañas</h3>
            <Link href="/admin/campaigns" className="text-sm text-purple-600 hover:underline inline-flex items-center gap-1">
              Ver todas <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentCampaigns.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay campañas recientes.</p>
          ) : (
            <ul className="divide-y divide-purple-100">
              {recentCampaigns.map(campaign => (
                <li key={campaign.id} className="py-3 flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: campaign.color }} />
                  <div className="flex-1">
                    <Link href={`/admin/campaigns/${campaign.id}/edit`} className="text-sm font-medium text-gray-800 hover:text-purple-700 transition-colors line-clamp-1">
                      {campaign.name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-1">{campaign.description?.substring(0, 60) || 'Sin descripción'}</p>
                  </div>
                  <Link href={`/admin/campaigns/${campaign.id}/edit`} className="text-xs text-gray-400 hover:text-purple-600 transition-colors">
                    Editar
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}