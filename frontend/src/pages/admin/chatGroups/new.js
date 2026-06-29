import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function NewChatGroup() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', description: '', platform: 'whatsapp', link: '',
    region: '', campaignId: '', actionId: '', isActive: true,
  });
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);

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
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.link) { toast.warning('Nombre y enlace son obligatorios'); return; }
    setLoading(true);
    try {
      await api.post('/chat-groups', {
        ...form,
        campaignId: form.campaignId || null,
        actionId: form.actionId || null,
      });
      toast.success('Grupo creado');
      router.push('/admin/chatGroups');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear grupo');
    } finally { setLoading(false); }
  };

  return (
    <AdminLayout title="Nuevo Grupo de Chat">
      <ToastContainer />
      <form onSubmit={handleSubmit} className="card max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Crear grupo de chat</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input name="name" value={form.name} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="input-field" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma *</label>
            <select name="platform" value={form.platform} onChange={handleChange} className="input-field">
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="signal">Signal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enlace *</label>
            <input name="link" value={form.link} onChange={handleChange} required placeholder="https://..." className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Región (opcional)</label>
          <input name="region" value={form.region} onChange={handleChange} className="input-field" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaña (opcional)</label>
            <select name="campaignId" value={form.campaignId} onChange={handleChange} className="input-field">
              <option value="">Ninguna</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acción (opcional)</label>
            <select name="actionId" value={form.actionId} onChange={handleChange} className="input-field">
              <option value="">Ninguna</option>
              {actions.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="rounded" />
          <label className="text-sm text-gray-700">Grupo activo (visible en página pública)</label>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Guardando...' : 'Crear Grupo'}
        </button>
      </form>
    </AdminLayout>
  );
}