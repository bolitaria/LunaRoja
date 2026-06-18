import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { FaUsers, FaCalendarAlt, FaNewspaper, FaComments, FaChartLine, FaBell, FaEnvelope, FaFileAlt } from 'react-icons/fa';

function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (user && user.role === 'superadmin') {
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <AdminLayout title="Dashboard"><p className="text-center py-8">Cargando datos...</p></AdminLayout>;
  if (error) return <AdminLayout title="Dashboard"><p className="text-center py-8 text-red-600">{error}</p></AdminLayout>;
  if (!user || user.role !== 'superadmin') return <AdminLayout title="Dashboard"><p className="text-center py-8">No tienes permisos para ver este panel.</p></AdminLayout>;

  const { totals, upcomingActions, recentSubscribers, actionsByMonth, subscribersByMonth, actionsByCategory, topCampaigns, latestNews, upcomingWeekActions } = data;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  const metricCards = [
    { title: 'Campañas', value: totals.campaigns, icon: FaChartLine, color: 'bg-blue-500', link: '/admin/campaigns' },
    { title: 'Acciones', value: totals.actions, icon: FaCalendarAlt, color: 'bg-green-500', link: '/admin/actions' },
    { title: 'Noticias', value: totals.noticias, icon: FaNewspaper, color: 'bg-red-500', link: '/admin/news' },
    { title: 'Reportes', value: totals.reports, icon: FaFileAlt, color: 'bg-yellow-500', link: '/admin/reports' },
    { title: 'Suscriptores', value: totals.subscribers, icon: FaEnvelope, color: 'bg-purple-500', link: '/admin/subscribers' },
    { title: 'Grupos Chat', value: totals.chatGroups, icon: FaComments, color: 'bg-indigo-500', link: '/admin/chatGroups' },
    { title: 'Usuarios', value: totals.users, icon: FaUsers, color: 'bg-gray-600', link: '/admin/users' },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card) => (
            <Link key={card.title} href={card.link} className="block">
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 flex items-center justify-between border-l-4 border-l-red-500">
                <div>
                  <p className="text-gray-500 text-sm uppercase tracking-wide">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.color} bg-opacity-10`}>
                  <card.icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {upcomingWeekActions.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow">
            <div className="flex items-center">
              <FaBell className="text-yellow-500 mr-2" />
              <h3 className="font-semibold text-yellow-800">Próximas acciones esta semana</h3>
            </div>
            <ul className="mt-2 space-y-1">
              {upcomingWeekActions.map(action => (
                <li key={action.id} className="text-sm text-yellow-700">
                  <strong>{action.title}</strong> - {new Date(action.datetime).toLocaleDateString()} (Campaña: {action.campaign?.name})
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4">Evolución de acciones</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={actionsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="Acciones" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4">Crecimiento de suscriptores</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subscribersByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="Nuevos suscriptores" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4">Acciones por categoría</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={actionsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="category"
                  label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                >
                  {actionsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4">Campañas con más acciones</h2>
            <ul className="space-y-3">
              {topCampaigns.map(campaign => (
                <li key={campaign.id} className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">{campaign.name}</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-sm">{campaign.actionCount} acciones</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4">Próximas acciones</h2>
            <ul className="space-y-3">
              {upcomingActions.map(action => (
                <li key={action.id} className="border-b pb-2">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(action.datetime).toLocaleDateString()} - {action.campaign?.name}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4">Últimos suscriptores</h2>
            <ul className="space-y-3">
              {recentSubscribers.map(sub => (
                <li key={sub.id} className="flex justify-between items-center border-b pb-2">
                  <span className="truncate max-w-[150px]">{sub.email}</span>
                  <span className="text-xs text-gray-400">{new Date(sub.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-4">Últimas noticias</h2>
            <ul className="space-y-3">
              {latestNews.map(news => (
                <li key={news.id} className="border-b pb-2">
                  <p className="font-medium line-clamp-1">{news.title}</p>
                  <p className="text-xs text-gray-400">{new Date(news.publishedAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(AdminDashboard);