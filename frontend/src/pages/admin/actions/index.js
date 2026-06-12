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
      console.log('Token usado para acciones:', token);
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Acciones recibidas:', res.data);
      setActions(res.data);
    } catch (error) {
      console.error('Error al cargar acciones:', error);
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
    webinar: 'Webinar', talk: 'Charla', protest: 'Manifestación',
    bds: 'Acción BDS', strike: 'Huelga', march: 'Marcha',
    solidarity_action: 'Acción Solidaria', workshop: 'Taller'
  };

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

  return (
    <AdminLayout title="Administrar Acciones">
      <ToastContainer />
      {user && (user.role === 'superadmin' || user.role === 'campaign_admin') && (
        <div className="mb-4">
          <Link href="/admin/actions/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Nueva Acción
          </Link>
        </div>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : actions.length === 0 ? (
        <p>No hay acciones creadas.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Título</th>
                <th className="px-6 py-3 text-left">Categoría</th>
                <th className="px-6 py-3 text-left">Fecha/Hora</th>
                <th className="px-6 py-3 text-left">Ubicación</th>
                <th className="px-6 py-3 text-left">Campaña</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {actions.map(action => {
                const actionDate = new Date(action.datetime);
                const now = new Date();
                const isPast = actionDate < now;
                const campaign = campaignMap[action.campaignId];
                // Construir URL de la imagen
                let imageUrl = null;
                if (action.featuredImage) {
                  imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${action.featuredImage}`;
                } else if (action.images && action.images.length > 0) {
                  imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${action.images[0].url}`;
                }
                if (imageUrl) console.log('URL imagen:', imageUrl);
                return (
                  <tr key={action.id} className="border-t">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{action.title}</span>
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={action.title}
                            className="h-8 w-8 object-cover rounded"
                            onError={(e) => { 
                              console.log('Error al cargar imagen:', imageUrl);
                              e.target.style.display = 'none'; 
                            }}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{categoryLabels[action.category]}</td>
                    <td className="px-6 py-4">{actionDate.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {action.locationType === 'online' ? 'Online' : action.placeName || 'Presencial'}
                    </td>
                    <td className="px-6 py-4">
                      {campaign ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: campaign.color }}
                          />
                          <span className="font-semibold text-black">{campaign.name}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        isPast ? 'bg-gray-200' : 'bg-green-200 text-green-800'
                      }`}>
                        {isPast ? 'Pasado' : 'Próximo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <Link href={`/admin/actions/${action.id}/edit`} className="text-blue-600 hover:underline">Editar</Link>
                      <button onClick={() => handleDelete(action.id)} className="text-red-600 hover:underline">Eliminar</button>
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