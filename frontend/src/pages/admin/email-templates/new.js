import api from '../../../lib/axios';
import { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function NewEmailTemplate() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    variables: '',
    associatedEvent: 'custom',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.body) {
      toast.warning('Completa los campos requeridos');
      return;
    }
    setLoading(true);
    try {
      await api.post('/email-templates', {
        ...form,
        variables: form.variables.split(',').map(v => v.trim()).filter(Boolean),
      });
      toast.success('Plantilla creada');
      router.push('/admin/email-templates');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Nueva Plantilla">
      <ToastContainer />
      <form onSubmit={handleSubmit} className="card max-w-3xl mx-auto space-y-4">
        <h2 className="text-xl font-semibold">Crear Plantilla de Email</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input name="name" value={form.name} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asunto *</label>
          <input name="subject" value={form.subject} onChange={handleChange} required className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo HTML *</label>
          <textarea name="body" value={form.body} onChange={handleChange} rows="10" required className="input-field font-mono text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variables (separadas por coma)</label>
          <input name="variables" value={form.variables} onChange={handleChange} className="input-field" placeholder="username, campaign.name, unsubscribeLink" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asociado a evento</label>
          <select name="associatedEvent" value={form.associatedEvent} onChange={handleChange} className="input-field">
            <option value="custom">Personalizado</option>
            <option value="campaign_created">Creación de campaña</option>
            <option value="action_created">Creación de acción</option>
            <option value="bds_campaign_created">Creación de campaña BDS</option>
            <option value="subscriber_welcome">Bienvenida al suscriptor</option>
            <option value="reminder">Recordatorio</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creando...' : 'Crear Plantilla'}
        </button>
      </form>
    </AdminLayout>
  );
}