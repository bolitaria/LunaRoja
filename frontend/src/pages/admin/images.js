import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchImages = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/images`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImages(res.data);
    } catch (error) {
      toast.error('Error al cargar imágenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/images/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Imagen eliminada');
      fetchImages();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <AdminLayout title="Administrar Imágenes">
      <ToastContainer />
      {loading ? (
        <p>Cargando...</p>
      ) : images.length === 0 ? (
        <p>No hay imágenes subidas.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Vista previa</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-left">Relacionado</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {images.map(img => (
                <tr key={img.id} className="border-t">
                  <td className="px-6 py-4">
                    <img
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}${img.url}`}
                      alt=""
                      className="h-16 w-16 object-cover rounded"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    {img.relatedType === 'action' ? 'Acción' : 'Reporte'}
                  </td>
                  <td className="px-6 py-4">
                    {img.relatedTitle || `ID: ${img.relatedId}`}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(img.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="text-red-600 hover:underline"
                    >
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

export default withAuth(AdminImages);