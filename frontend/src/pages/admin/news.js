import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { withAuth } from '../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminNews() {
  const [news, setNews] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
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

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const fetchNews = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/news`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNews(res.data);
    } catch (error) {
      toast.error('Error al cargar noticias');
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
    Promise.all([fetchNews(), fetchCampaigns(), fetchActions()]).then(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setForm(prev => {
      const updated = { ...prev, [name]: newValue };
      if (name === 'youtubeUrl') {
        const videoId = getYoutubeId(value);
        if (videoId) {
          updated.thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        } else if (!value) {
          updated.thumbnail = '';
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const campaignValue = form.campaignId === '' ? null : Number(form.campaignId);
      const actionValue = form.actionId === '' ? null : Number(form.actionId);

      const dataToSend = {
        title: form.title,
        description: form.description,
        youtubeUrl: form.youtubeUrl,
        thumbnail: form.thumbnail,
        isNews: form.isNews,
        campaignId: campaignValue,
        actionId: actionValue,
      };

      if (editingId) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/news/${editingId}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Noticia actualizada');
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/news`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Noticia creada');
      }

      setForm({ title: '', description: '', youtubeUrl: '', thumbnail: '', isNews: false, campaignId: '', actionId: '' });
      setEditingId(null);
      setShowForm(false);
      fetchNews();
    } catch (error) {
      console.error('Error al guardar:', error.response?.data || error.message);
      toast.error('Error al guardar');
    }
  };

  const handleEdit = (item) => {
    setForm({
      title: item.title,
      description: item.description || '',
      youtubeUrl: item.youtubeUrl,
      thumbnail: item.thumbnail || '',
      isNews: item.isNews || false,
      campaignId: item.campaignId || '',
      actionId: item.actionId || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar noticia?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Noticia eliminada');
      fetchNews();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
  const actionMap = actions.reduce((acc, a) => ({ ...acc, [a.id]: a }), {});

  return (
    <AdminLayout title="Administrar Noticias">
      <ToastContainer />
      <button
        onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', description: '', youtubeUrl: '', thumbnail: '', isNews: false, campaignId: '', actionId: '' }); }}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {showForm ? 'Cancelar' : 'Nueva noticia'}
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
            {form.thumbnail && (
              <div className="mt-2">
                <img src={form.thumbnail} alt="Vista previa" className="h-20 rounded shadow" />
              </div>
            )}
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
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Acción relacionada (opcional)</label>
            <select
              name="actionId"
              value={form.actionId}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">-- Ninguna --</option>
              {actions.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : news.length === 0 ? (
        <p>No hay noticias creadas.</p>
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
              {news.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="px-6 py-4">{item.title}</td>
                  <td className="px-6 py-4">{item.isNews ? 'Sí' : 'No'}</td>
                  <td className="px-6 py-4">
                    {item.campaign ? (
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.campaign.color }} />
                        <span className="font-medium text-black">{item.campaign.name}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">{item.action ? item.action.title : '-'}</td>
                  <td className="px-6 py-4">{new Date(item.publishedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Eliminar</button>
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

export default withAuth(AdminNews);