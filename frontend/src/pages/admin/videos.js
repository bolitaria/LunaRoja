import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [filteredActions, setFilteredActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    thumbnail: '',
    isNews: false,
    campaignId: '',
    actionId: ''
  });
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

  useEffect(() => {
    Promise.all([fetchVideos(), fetchCampaigns(), fetchActions()]).then(() => setLoading(false));
  }, []);

  // Filtrar acciones según la campaña seleccionada
  useEffect(() => {
    if (form.campaignId) {
      const filtered = actions.filter(a => a.campaignId === parseInt(form.campaignId));
      setFilteredActions(filtered);
      // Si la acción seleccionada no pertenece a la campaña, resetearla
      if (form.actionId && !filtered.some(a => a.id === parseInt(form.actionId))) {
        setForm(prev => ({ ...prev, actionId: '' }));
      }
    } else {
      setFilteredActions([]);
      setForm(prev => ({ ...prev, actionId: '' }));
    }
  }, [form.campaignId, actions]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
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
      setForm({ title: '', description: '', youtubeUrl: '', thumbnail: '', isNews: false, campaignId: '', actionId: '' });
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
      thumbnail: video.thumbnail || '',
      isNews: video.isNews || false,
      campaignId: video.campaignId || '',
      actionId: video.actionId || ''
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

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
  const actionMap = actions.reduce((acc, a) => ({ ...acc, [a.id]: a }), {});

  return (
    <AdminLayout title="Administrar Videos">
      <ToastContainer />
      <button
        onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', description: '', youtubeUrl: '', thumbnail: '', isNews: false, campaignId: '', actionId: '' }); }}
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
            <div className="flex gap-2">
              <input
                type="url"
                name="thumbnail"
                value={form.thumbnail}
                onChange={handleChange}
                placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
                className="w-full px-3 py-2 border rounded"
              />
              <button
                type="button"
                onClick={() => {
                  const url = form.youtubeUrl;
                  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([^&?]+)/);
                  if (match && match[1]) {
                    setForm({ ...form, thumbnail: `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` });
                  } else {
                    toast.warning('No se pudo extraer el ID del video.');
                  }
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                Generar
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isNews"
                checked={form.isNews}
                onChange={handleChange}
                className="mr-2"
              />
              <span>Es noticia (aparecerá en sección de novedades)</span>
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Campaña relacionada (opcional)</label>
            <select
              name="campaignId"
              value={form.campaignId}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">-- Ninguna --</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {form.campaignId && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Acción relacionada (opcional)</label>
              <select
                name="actionId"
                value={form.actionId}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">-- Ninguna --</option>
                {filteredActions.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
          )}
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
                <th className="px-6 py-3 text-left">Noticia</th>
                <th className="px-6 py-3 text-left">Campaña</th>
                <th className="px-6 py-3 text-left">Acción</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(video => (
                <tr key={video.id} className="border-t">
                  <td className="px-6 py-4">{video.title}</td>
                  <td className="px-6 py-4">{video.isNews ? 'Sí' : 'No'}</td>
                  <td className="px-6 py-4">
                    {video.campaignId ? campaignMap[video.campaignId]?.name || '-' : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {video.actionId ? actionMap[video.actionId]?.title || '-' : '-'}
                  </td>
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