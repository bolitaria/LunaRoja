// frontend/src/pages/admin/chatGroups/new.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import { withAuth } from '../../../lib/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function NewChatGroup() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    platform: 'whatsapp',
    link: '',
    region: '',
    campaignId: '',
    actionId: '',
  });
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [campRes, actRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setCampaigns(campRes.data);
        setActions(actRes.data);
      } catch (error) {
        toast.error('Error al cargar datos');
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.link) {
      toast.warning('Nombre y enlace son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        campaignId: form.campaignId || null,
        actionId: form.actionId || null,
      };
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/chats-groups`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Grupo creado');
      router.push('/admin/chatGroups');
    } catch (error) {
      toast.error('Error al crear grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Nuevo Grupo de Chat">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows="2" className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma *</label>
          <select name="platform" value={form.platform} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
            <option value="signal">Signal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Enlace *</label>
          <input type="url" name="link" value={form.link} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Región (opcional)</label>
          <input type="text" name="region" value={form.region} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaña (opcional)</label>
          <select name="campaignId" value={form.campaignId} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
            <option value="">Ninguna</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Acción (opcional)</label>
          <select name="actionId" value={form.actionId} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg">
            <option value="">Ninguna</option>
            {actions.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50">
          {loading ? 'Guardando...' : 'Crear Grupo'}
        </button>
      </form>
    </AdminLayout>
  );
}

export default withAuth(NewChatGroup);