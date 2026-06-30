import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/router';
import NewsCard from '../../../components/NewsCard';

export default function NewNews() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    thumbnail: '',
    isNews: false,
    campaignId: '',
    actionId: ''
  });
  const [loading, setLoading] = useState(false);

  const getYoutubeId = (url) => {
    if (!url) return null;
    const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (m && m[2].length === 11) ? m[2] : null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campRes, actRes] = await Promise.all([api.get('/campaigns'), api.get('/actions')]);
        setCampaigns(campRes.data);
        setActions(actRes.data);
      } catch (error) { toast.error('Error al cargar datos auxiliares'); }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setForm(prev => {
      const updated = { ...prev, [name]: newValue };
      if (name === 'youtubeUrl') {
        const id = getYoutubeId(value);
        updated.thumbnail = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.warning('El título es obligatorio'); return; }
    if (!form.youtubeUrl.trim()) { toast.warning('La URL de YouTube es obligatoria'); return; }
    setLoading(true);
    try {
      await api.post('/news', {
        ...form,
        campaignId: form.campaignId === '' ? null : Number(form.campaignId),
        actionId: form.actionId === '' ? null : Number(form.actionId),
      });
      toast.success('Noticia creada');
      router.push('/admin/news');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear noticia');
    } finally { setLoading(false); }
  };

  const previewNoticia = {
    title: form.title,
    description: form.description,
    youtubeUrl: form.youtubeUrl,
    thumbnail: form.thumbnail,
    isNews: form.isNews,
    publishedAt: new Date().toISOString(),
  };
  const previewCampaign = form.campaignId ? campaigns.find(c => c.id === Number(form.campaignId)) : null;
  const previewAction = form.actionId ? actions.find(a => a.id === Number(form.actionId)) : null;

  return (
    <AdminLayout title="Nueva Noticia">
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Formulario a la izquierda */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">Crear Noticia</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de YouTube *</label>
              <input
                type="url"
                name="youtubeUrl"
                value={form.youtubeUrl}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isNews"
                checked={form.isNews}
                onChange={handleChange}
                className="mr-2 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
              />
              <label className="text-sm text-gray-700">Es noticia destacada</label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaña</label>
                <select
                  name="campaignId"
                  value={form.campaignId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                >
                  <option value="">-- Ninguna --</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
                <select
                  name="actionId"
                  value={form.actionId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                >
                  <option value="">-- Ninguna --</option>
                  {actions.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fuchsia-600 text-white px-5 py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Creando...' : 'Crear Noticia'}
          </button>
        </form>

        {/* Vista previa a la derecha */}
        <div className="lg:w-1/3">
          <div className="sticky top-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Vista previa</h3>
            <NewsCard noticia={previewNoticia} campaign={previewCampaign} action={previewAction} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}