import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import api from '../../../lib/axios';
import Link from 'next/link';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminLinksIndex() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = async () => {
    try {
      const res = await api.get('/links');
      setLinks(res.data);
    } catch (err) {
      toast.error('Error al cargar enlaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLinks(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este enlace?')) return;
    try {
      await api.delete(`/links/${id}`);
      toast.success('Enlace eliminado');
      fetchLinks();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const categoryLabels = {
    local: 'Local',
    nacional: 'Nacional',
    europeo: 'Europeo',
    internacional: 'Internacional',
    literatura: 'Literatura',
  };

  return (
    <AdminLayout title="Links de interés">
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Enlaces de interés</h2>
        <Link href="/admin/links/new" className="btn-new flex items-center gap-2">
          <FaPlus /> Nuevo enlace
        </Link>
      </div>

      {loading ? (
        <p className="text-center py-10">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">URL</th>
                <th className="px-4 py-3 text-center">Activo</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {links.map(link => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{link.title}</td>
                  <td className="px-4 py-3">{categoryLabels[link.category]}</td>
                  <td className="px-4 py-3 text-blue-600 truncate max-w-xs">{link.url}</td>
                  <td className="px-4 py-3 text-center">{link.active ? '✅' : '❌'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link href={`/admin/links/${link.id}/edit`} className="text-blue-600 hover:underline">
                      <FaEdit className="inline" />
                    </Link>
                    <button onClick={() => handleDelete(link.id)} className="text-red-600 hover:underline">
                      <FaTrash className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}