// frontend/src/pages/admin/news/new.js
import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import NewsPreview from '../../../components/NewsPreview';
import { unwrapList } from '../../../utils/apiHelpers';
import { FaArrowLeft, FaYoutube } from 'react-icons/fa';

export default function NewNews() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    thumbnail: '',
    publishedAt: new Date().toISOString().slice(0, 16),
    isNews: true,
    campaignId: '',
    actionId: '',
  });
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campRes, actRes] = await Promise.all([
          api.get('/campaigns', { params: { limit: 1000 } }),
          api.get('/actions', { params: { limit: 1000 } }),
        ]);
        setCampaigns(unwrapList(campRes.data));
        setActions(unwrapList(actRes.data));
      } catch (e) {
        console.warn('No se pudieron cargar campañas/acciones', e);
        setCampaigns([]);
        setActions([]);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleThumbnailChange = (e) => {
    const url = e.target.value;
    setForm(prev => ({ ...prev, thumbnail: url }));
    setThumbnailPreview(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.warning('El título es obligatorio'); return; }
    if (!form.youtubeUrl.trim()) { toast.warning('La URL de YouTube es obligatoria'); return; }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || '',
        youtubeUrl: form.youtubeUrl,
        thumbnail: form.thumbnail || null,
        publishedAt: form.publishedAt || new Date(),
        isNews: form.isNews,
        campaignId: form.campaignId || null,
        actionId: form.actionId || null,
      };
      await api.post('/news', payload);
      toast.success('Noticia creada');
      router.push('/admin/news');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error al crear noticia');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400 transition-colors";
  const selectClass = inputClass;

  const campaignName = campaigns.find(c => String(c.id) === String(form.campaignId))?.name;
  const actionName = actions.find(a => String(a.id) === String(form.actionId))?.title;

  return (
    <AdminLayout title="Nueva Noticia">
      <ToastContainer />
      <button
        type="button"
        onClick={() => router.push('/admin/news')}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <FaArrowLeft /> Volver a Noticias
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 lg:self-start space-y-6">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} required className={inputClass} />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="4" className={inputClass} />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">
              URL de YouTube * <FaYoutube className="inline text-red-500 ml-1" />
            </label>
            <input type="url" name="youtubeUrl" value={form.youtubeUrl} onChange={handleChange} required
              placeholder="https://youtube.com/watch?v=..." className={inputClass} />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">URL de miniatura</label>
            <input type="url" name="thumbnail" value={form.thumbnail} onChange={handleThumbnailChange}
              placeholder="https://... o /uploads/..." className={inputClass} />
            <p className="text-sm text-gray-400 mt-1">Pega la URL de una imagen o déjalo vacío.</p>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Fecha de publicación</label>
            <input type="datetime-local" name="publishedAt" value={form.publishedAt} onChange={handleChange} className={inputClass} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isNews" name="isNews" checked={form.isNews} onChange={handleChange}
              className="h-5 w-5 text-fuchsia-600 focus:ring-fuchsia-500" />
            <label htmlFor="isNews" className="text-base text-gray-700">Marcar como noticia (si no, es un artículo)</label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">Campaña</label>
              <select name="campaignId" value={form.campaignId} onChange={handleChange} className={selectClass}>
                <option value="">-- Sin campaña --</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">Acción</label>
              <select name="actionId" value={form.actionId} onChange={handleChange} className={selectClass}>
                <option value="">-- Sin acción --</option>
                {actions.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-fuchsia-600 text-white px-5 py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors font-medium text-lg">
            {loading ? 'Guardando...' : 'Crear Noticia'}
          </button>
        </form>

        <div className="lg:w-1/3 lg:self-start">
          <NewsPreview
            form={{ ...form, campaignName, actionName }}
            featuredImage={thumbnailPreview}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
