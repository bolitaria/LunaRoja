import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { withAuth } from '../../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';

function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  console.log('Token en campañas:', token);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Campañas recibidas:', res.data);
      setCampaigns(res.data);
    } catch (error) {
      console.error('Error al cargar campañas:', error.response?.data || error.message);
      toast.error('Error al cargar campañas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar campaña?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Campaña eliminada');
      fetchCampaigns();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  // Para depuración, mostrar los datos en texto si no hay tabla
  if (!loading && campaigns.length === 0) {
    return (
      <AdminLayout title="Administrar Campañas">
        <p>No hay campañas creadas. (debug: campaigns array vacío)</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Administrar Campañas">
      <ToastContainer />
      {user && user.role === 'superadmin' && (
        <div className="mb-4">
          <Link href="/admin/campaigns/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Nueva Campaña
          </Link>
        </div>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : campaigns.length === 0 ? (
        <p>No hay campañas creadas.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">Color</th>
                <th className="px-6 py-3 text-left">Descripción</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => {
                const imageUrl = c.imageUrl ? `${process.env.NEXT_PUBLIC_BASE_URL}${c.imageUrl}` : null;
                console.log('Renderizando campaña:', c.id, c.name);
                return (
                  <tr key={c.id} className="border-t">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{c.name}</span>
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={c.name}
                            className="h-8 w-8 object-cover rounded"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block w-6 h-6 rounded-full" style={{ backgroundColor: c.color }}></span>
                    </td>
                    <td className="px-6 py-4">{c.description}</td>
                    <td className="px-6 py-4 space-x-2">
                      <Link href={`/admin/campaigns/${c.id}/edit`} className="text-blue-600 hover:underline">Editar</Link>
                      <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Eliminar</button>
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

export default withAuth(AdminCampaigns);