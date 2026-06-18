import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { withAuth } from '../../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';

function AdminActions() {
  const [actions, setActions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchActions = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sorted = res.data.sort((a, b) => {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        return new Date(b.datetime) - new Date(a.datetime);
      });
      setActions(sorted);
    } catch (error) {
      toast.error('Error al cargar acciones');
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(res.data);
    } catch (error) {
      toast.error('Error al cargar campañas');
    }
  };

  useEffect(() => {
    Promise.all([fetchActions(), fetchCampaigns()]).then(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar acción?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/actions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Acción eliminada');
      fetchActions();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const categoryLabels = {
    webinar: 'Webinar',
    talk: 'Charla',
    protest: 'Manifestación',
    bds: 'Acción BDS',
    strike: 'Huelga',
    march: 'Marcha',
    solidarity_action: 'Acción Solidaria',
    workshop: 'Taller'
  };

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

  return (
    <AdminLayout title="Administrar Acciones">
      <ToastContainer />
      {user && (user.role === 'superadmin' || user.role === 'campaign_admin') && (
        <div className="mb-4">
          <Link href="/admin/actions/new" className="bg-fuchsia-600 text-white px-4 py-2 rounded-lg hover:bg-fuchsia-700 transition-colors">
            Nueva Acción
          </Link>
        </div>
      )}

      {loading ? (
        <p className="text-gray-600">Cargando...</p>
      ) : actions.length === 0 ? (
        <p className="text-gray-600">No hay acciones creadas.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaña</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {actions.map(action => {
                const actionDate = new Date(action.datetime);
                const now = new Date();
                const isPast = actionDate < now;
                const campaign = campaignMap[action.campaignId];
                let imageUrl = null;
                if (action.featuredImage) {
                  imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${action.featuredImage}`;
                } else if (action.images && action.images.length > 0) {
                  imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${action.images[0].url}`;
                }
                return (
                  <tr key={action.id} className={action.urgent ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {imageUrl && <img src={imageUrl} alt="" className="h-8 w-8 object-cover rounded" />}
                        <span className="font-medium text-gray-900">{action.title}</span>
                        {action.urgent && <span className="ml-2 inline-block px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">🔥 Urgente</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{categoryLabels[action.category]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{actionDate.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {action.locationType === 'online' ? '💻 Online' : (action.placeName || '📍 Presencial')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign ? (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: campaign.color }} />
                          <span className="text-sm font-medium">{campaign.name}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${isPast ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}`}>
                        {isPast ? 'Pasado' : 'Próximo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link href={`/admin/actions/${action.id}/edit`} className="text-fuchsia-600 hover:text-fuchsia-800 mr-3">
                        Editar
                      </Link>
                      <button onClick={() => handleDelete(action.id)} className="text-red-600 hover:text-red-800">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export default withAuth(AdminActions);