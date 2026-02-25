import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', youtubeUrl: '', thumbnail: '' });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchVideos = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/videos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(res.data);
    } catch (error) {
      toast.error('Error al cargar videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/videos/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Video actualizado');
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/videos`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Video creado');
      }
      setForm({ title: '', description: '', youtubeUrl: '', thumbnail: '' });
      setEditingId(null);
      setShowForm(false);
      fetchVideos();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleEdit = (video) => {
    setForm({
      title: video.title,
      description: video.description || '',
      youtubeUrl: video.youtubeUrl,
      thumbnail: video.thumbnail || ''
    });
    setEditingId(video.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar video?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/videos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Video eliminado');
      fetchVideos();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  return (
    <AdminLayout title="Administrar Videos">
      <ToastContainer />
      <button
        onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', description: '', youtubeUrl: '', thumbnail: '' }); }}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {showForm ? 'Cancelar' : 'Nuevo video'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Título *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">URL de YouTube *</label>
            <input
              type="url"
              name="youtubeUrl"
              value={form.youtubeUrl}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">URL de miniatura (opcional)</label>
            <input
              type="url"
              name="thumbnail"
              value={form.thumbnail}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Título</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(video => (
                <tr key={video.id} className="border-t">
                  <td className="px-6 py-4">{video.title}</td>
                  <td className="px-6 py-4">{new Date(video.publishedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button onClick={() => handleEdit(video)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => handleDelete(video.id)} className="text-red-600 hover:underline">Eliminar</button>
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

export default withAuth(AdminVideos);