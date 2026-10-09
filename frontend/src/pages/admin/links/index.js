import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import api from '../../../lib/axios';
import Link from 'next/link';
import { FaPlus } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ViewToggle from '../../../components/ViewToggle';
import LinkCard from '../../../components/LinkCard';

export default function AdminLinksIndex() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vista mosaico/lista (persistida)
  const [viewMode, setViewModeRaw] = useState(() => {
    if (typeof window === 'undefined') return 'table';
    return localStorage.getItem('admin.links.viewMode') || 'table';
  });
  const setViewMode = (mode) => {
    setViewModeRaw(mode);
    if (typeof window !== 'undefined') localStorage.setItem('admin.links.viewMode', mode);
  };

  const fetchLinks = async () => {
    try {
      const res = await api.get('/links');
      const data = res.data?.data ?? res.data;
      setLinks(Array.isArray(data) ? data : []);
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
        <div className="flex items-center gap-3">
          <ViewToggle viewMode={viewMode} onChange={setViewMode} accentColor="fuchsia" />
          <Link href="/admin/links/new" className="btn-new flex items-center gap-2">
            <FaPlus /> Nuevo enlace
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-10">Cargando...</p>
      ) : links.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No hay enlaces</p>
          <p className="text-sm">Crea uno nuevo para empezar.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {links.map(link => (
            <LinkCard key={link.id} link={link} onDelete={handleDelete} />
          ))}
        </div>
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
                      Editar
                    </Link>
                    <button onClick={() => handleDelete(link.id)} className="text-red-600 hover:underline">
                      Eliminar
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
