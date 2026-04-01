import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [actionsByCategory, setActionsByCategory] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!user) return;

        if (user.role === 'superadmin') {
          const [
            campaignsRes,
            actionsRes,
            newsRes,
            reportsRes,
            subscribersRes,
            groupsRes,
            imagesRes
          ] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/news`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/subscribers`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/chat-groups`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/images`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          setStats({
            Campañas: campaignsRes.data.length,
            Acciones: actionsRes.data.length,
            Noticias: newsRes.data.length,
            Reportes: reportsRes.data.length,
            Suscriptores: subscribersRes.data.length,
            GruposChat: groupsRes.data.length,
            Imágenes: imagesRes.data.length,
          });

          // Datos para gráfico de acciones por categoría
          const categoryCount = actionsRes.data.reduce((acc, action) => {
            acc[action.category] = (acc[action.category] || 0) + 1;
            return acc;
          }, {});
          const categoryData = Object.entries(categoryCount).map(([cat, count]) => ({
            name: cat,
            value: count
          }));
          setActionsByCategory(categoryData);

          // Acciones recientes
          const recent = actionsRes.data.slice(0, 5);
          setRecentActions(recent);
        } else if (user.role === 'campaign_admin') {
          const [campaignsRes, actionsRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`, { headers: { Authorization: `Bearer ${token}` } })
          ]);
          setStats({
            'Mis campañas': campaignsRes.data.length,
            'Acciones de mis campañas': actionsRes.data.length,
          });
        } else if (user.role === 'action_admin') {
          const actionsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`, { headers: { Authorization: `Bearer ${token}` } });
          setStats({
            'Mis acciones': actionsRes.data.length,
          });
        }
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <p className="text-center py-8">Cargando...</p>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm uppercase mb-2">{key}</h3>
                <p className="text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          {user?.role === 'superadmin' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Acciones por categoría</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={actionsByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {actionsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Acciones recientes</h2>
                <ul className="space-y-2">
                  {recentActions.map(action => (
                    <li key={action.id} className="border-b pb-2">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm text-gray-500">{new Date(action.datetime).toLocaleDateString()}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

export default withAuth(AdminDashboard);