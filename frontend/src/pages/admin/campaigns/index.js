import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { withAuth } from '../../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import Link from 'next/link';

function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(res.data);
    } catch (error) {
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

  return (
    <AdminLayout title="Administrar Campañas">
      <ToastContainer />
      <div className="mb-4">
        <Link href="/admin/campaigns/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Nueva Campaña
        </Link>
      </div>
      {loading ? (
        <p>Cargando...</p>
      ) : campaigns.length === 0 ? (
        <p>No hay campañas creadas.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Acciones</th>
                <th className="px-6 py-3 text-left">Imagen</th>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">Color</th>
                <th className="px-6 py-3 text-left">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="px-6 py-4 space-x-2">
                    <Link href={`/admin/campaigns/${c.id}/edit`} className="text-blue-600 hover:underline">Editar</Link>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Eliminar</button>
                  </td>
                  <td className="px-6 py-4">
                    {c.imageUrl ? (
                      <img src={`${process.env.NEXT_PUBLIC_BASE_URL}${c.imageUrl}`} alt={c.name} className="h-10 w-10 object-cover rounded" />
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">{c.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block w-6 h-6 rounded-full" style={{ backgroundColor: c.color }}></span>
                  </td>
<td className="px-6 py-4">{c.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export default withAuth(AdminCampaigns);