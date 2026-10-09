// frontend/src/pages/admin/news/new.js
import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NewsPreview from '../../../components/NewsPreview';
import { unwrapList } from '../../../utils/apiHelpers';
import { FaArrowLeft, FaYoutube, FaNewspaper, FaPenFancy, FaMagic } from 'react-icons/fa';

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const isYouTubeUrl = (url) => YOUTUBE_REGEX.test(url || '');

export default function NewNews() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [form, setForm] = useState({
    newsType: 'youtube',
    title: '',
    description: '',
    youtubeUrl: '',
    externalUrl: '',
    source: '',
    ogImage: '',
    ogDescription: '',
    publishedAtSource: '',
    scrapedAt: '',
    content: '',
    publishedAt: new Date().toISOString().slice(0, 16),
    isNews: true,
    campaignId: '',
    actionId: '',
  });
  const [scraping, setScraping] = useState(false);
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
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleTypeChange = (newType) => {
    setForm(prev => ({ ...prev, newsType: newType }));
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    if (isYouTubeUrl(url)) {
      setForm(prev => ({ ...prev, newsType: 'youtube', youtubeUrl: url, externalUrl: '' }));
    } else {
      setForm(prev => ({ ...prev, externalUrl: url, youtubeUrl: '' }));
    }
  };

  const handleScrape = async () => {
    const url = form.externalUrl.trim();
    if (!url) { toast.warning('Pega una URL primero'); return; }
    setScraping(true);
    try {
      const res = await api.post('/news/scrape', { url });
      const data = res.data || {};
      setForm(prev => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        ogImage: data.image || prev.ogImage,
        source: data.source || prev.source,
        publishedAtSource: data.publishedAt ? new Date(data.publishedAt).toISOString().slice(0, 16) : prev.publishedAtSource,
        scrapedAt: new Date().toISOString(),
        publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString().slice(0, 16) : prev.publishedAt,
      }));
      toast.success('Datos extraídos');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'No se pudieron extraer los datos');
    } finally {
      setScraping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.warning('El título es obligatorio'); return; }
    if (form.newsType === 'youtube' && !form.youtubeUrl.trim()) { toast.warning('La URL de YouTube es obligatoria'); return; }
    if (form.newsType === 'article' && !form.externalUrl.trim()) { toast.warning('La URL del artículo es obligatoria'); return; }

    setLoading(true);
    try {
      await api.post('/news', {
        newsType: form.newsType,
        title: form.title,
        description: form.description || '',
        youtubeUrl: form.newsType === 'youtube' ? form.youtubeUrl : null,
        externalUrl: form.newsType === 'article' ? form.externalUrl : null,
        source: form.source || null,
        ogImage: form.ogImage || null,
        ogDescription: form.ogDescription || null,
        publishedAtSource: form.publishedAtSource || null,
        scrapedAt: form.scrapedAt || null,
        content: form.newsType === 'internal' ? form.content : null,
        publishedAt: form.publishedAt || new Date(),
        isNews: form.isNews,
        campaignId: form.campaignId || null,
        actionId: form.actionId || null,
      });
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
  const campaignName = campaigns.find(c => String(c.id) === String(form.campaignId))?.name;
  const actionName = actions.find(a => String(a.id) === String(form.actionId))?.title;

  return (
    <AdminLayout title="Nueva Noticia">
      <ToastContainer />
      <button type="button" onClick={() => router.push('/admin/news')}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <FaArrowLeft /> Volver a Noticias
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 lg:self-start space-y-6">

          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">Tipo de noticia</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button type="button" onClick={() => handleTypeChange('youtube')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${form.newsType === 'youtube' ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                <FaYoutube className="w-5 h-5" /> YouTube
              </button>
              <button type="button" onClick={() => handleTypeChange('article')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${form.newsType === 'article' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                <FaNewspaper className="w-5 h-5" /> Artículo
              </button>
              <button type="button" onClick={() => handleTypeChange('internal')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${form.newsType === 'internal' ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                <FaPenFancy className="w-5 h-5" /> Redacción
              </button>
            </div>
          </div>

          {form.newsType === 'youtube' && (
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">URL de YouTube *</label>
              <input type="url" value={form.youtubeUrl} onChange={handleUrlChange} required
                placeholder="https://youtube.com/watch?v=..." className={inputClass} />
              <p className="text-xs text-gray-400 mt-1">La miniatura se genera automáticamente desde la URL.</p>
            </div>
          )}

          {form.newsType === 'article' && (
            <>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">URL del artículo *</label>
                <div className="flex gap-2">
                  <input type="url" value={form.externalUrl} onChange={handleUrlChange} required
                    placeholder="https://elpais.com/..." className={inputClass} />
                  <button type="button" onClick={handleScrape} disabled={scraping || !form.externalUrl}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap font-medium transition-colors">
                    <FaMagic className="w-4 h-4" />
                    {scraping ? 'Extrayendo...' : 'Extraer'}
                  </button>
                </div>
                {form.scrapedAt && (
                  <p className="text-xs text-green-700 mt-1">✅ Extraído el {new Date(form.scrapedAt).toLocaleString()}</p>
                )}
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Fuente (periódico)</label>
                <input type="text" name="source" value={form.source} onChange={handleChange}
                  placeholder="El País, Al Jazeera, BBC..." className={inputClass} />
              </div>
            </>
          )}

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} required className={inputClass} />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="4" className={inputClass} />
          </div>

          {form.newsType === 'internal' && (
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">Contenido (HTML o texto)</label>
              <textarea name="content" value={form.content} onChange={handleChange} rows="8"
                placeholder="<p>Escribe aquí el contenido...</p>" className={inputClass + ' font-mono text-sm'} />
            </div>
          )}

          {form.newsType === 'article' && (
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">Imagen destacada (URL)</label>
              <input type="url" name="ogImage" value={form.ogImage} onChange={handleChange}
                placeholder="https://..." className={inputClass} />
            </div>
          )}

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
              <select name="campaignId" value={form.campaignId} onChange={handleChange} className={inputClass}>
                <option value="">-- Sin campaña --</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">Acción</label>
              <select name="actionId" value={form.actionId} onChange={handleChange} className={inputClass}>
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

        <div className="lg:w-1/3 lg:self-start lg:sticky lg:top-4">
          <NewsPreview form={{ ...form, campaignName, actionName }} />
        </div>
      </div>
    </AdminLayout>
  );
}
