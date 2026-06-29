import api from '../../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/router';
import NewsCard from '../../../../components/NewsCard';

export default function EditNews() {
  const router = useRouter();
  const { id } = router.query;
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
  const [saving, setSaving] = useState(false);

  const getYoutubeId = (url) => {
    if (!url) return null;
    const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (m && m[2].length === 11) ? m[2] : null;
  };

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [newsRes, campRes, actRes] = await Promise.all([
          api.get(`/news/${id}`),
          api.get('/campaigns'),
          api.get('/actions')
        ]);
        const item = newsRes.data;
        setForm({
          title: item.title,
          description: item.description || '',
          youtubeUrl: item.youtubeUrl,
          thumbnail: item.thumbnail || '',
          isNews: item.isNews || false,
          campaignId: item.campaignId || '',
          actionId: item.actionId || ''
        });
        setCampaigns(campRes.data);
        setActions(actRes.data);
      } catch (error) { toast.error('Error al cargar la noticia'); }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setForm(prev => {
      const updated = { ...prev, [name]: newValue };
      if (name === 'youtubeUrl') {
        const videoId = getYoutubeId(value);
        updated.thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.warning('El título es obligatorio'); return; }
    if (!form.youtubeUrl.trim()) { toast.warning('La URL de YouTube es obligatoria'); return; }
    setSaving(true);
    try {
      await api.put(`/news/${id}`, {
        ...form,
        campaignId: form.campaignId === '' ? null : Number(form.campaignId),
        actionId: form.actionId === '' ? null : Number(form.actionId),
      });
      toast.success('Noticia actualizada');
      router.push('/admin/news');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar noticia');
    } finally { setSaving(false); }
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
    <AdminLayout title="Editar Noticia">
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Formulario a la izquierda */}
        <form onSubmit={handleSubmit} className="card lg:w-2/3 space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">Editar Noticia</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de YouTube *</label>
              <input type="url" name="youtubeUrl" value={form.youtubeUrl} onChange={handleChange} required className="input-field" />
            </div>
            <div className="flex items-center">
              <input type="checkbox" name="isNews" checked={form.isNews} onChange={handleChange} className="mr-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <label className="text-sm text-gray-700">Es noticia destacada</label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaña</label>
                <select name="campaignId" value={form.campaignId} onChange={handleChange} className="input-field">
                  <option value="">-- Ninguna --</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
                <select name="actionId" value={form.actionId} onChange={handleChange} className="input-field">
                  <option value="">-- Ninguna --</option>
                  {actions.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Guardando...' : 'Actualizar Noticia'}
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