import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';

function AdminActions() {
  const [actions, setActions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchActions = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActions(res.data);
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

  // Mapa de campañas por id
  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

  return (
    <AdminLayout title="Administrar Acciones">
      <ToastContainer />
      <div className="mb-4">
        <Link href="/admin/actions/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Nueva Acción
        </Link>
      </div>

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
                return (
                  <tr key={action.id} className="border-t">
                    <td className="px-6 py-4">{action.title}</td>
                    <td className="px-6 py-4">{categoryLabels[action.category]}</td>
                    <td className="px-6 py-4">{actionDate.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {action.locationType === 'online' ? 'Online' : action.placeName || 'Presencial'}
                    </td>
                    <td className="px-6 py-4">
                      {campaign ? (
                        <span style={{ color: campaign.color }} className="font-semibold">
                          {campaign.name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        !action.isLive ? 'bg-gray-200' :
                        isPast ? 'bg-gray-200' : 'bg-green-200 text-green-800'
                      }`}>
                        {!action.isLive ? 'Grabación' : isPast ? 'Pasado' : 'Próximo'}
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