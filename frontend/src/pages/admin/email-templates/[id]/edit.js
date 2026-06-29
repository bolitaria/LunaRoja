import api from '../../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EditEmailTemplate() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    variables: '',
    associatedEvent: 'custom',
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchTemplate = async () => {
      try {
        const res = await api.get(`/email-templates/${id}`);
        const tpl = res.data;
        setForm({
          name: tpl.name,
          subject: tpl.subject,
          body: tpl.body,
          variables: Array.isArray(tpl.variables) ? tpl.variables.join(', ') : '',
          associatedEvent: tpl.associatedEvent || 'custom',
          isActive: tpl.isActive,
        });
      } catch (error) {
        toast.error('Error al cargar la plantilla');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.body) {
      toast.warning('Completa los campos requeridos');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/email-templates/${id}`, {
        ...form,
        variables: form.variables.split(',').map(v => v.trim()).filter(Boolean),
      });
      toast.success('Plantilla actualizada');
      router.push('/admin/email-templates');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout title="Editar Plantilla"><p className="text-center py-8">Cargando...</p></AdminLayout>;

  return (
    <AdminLayout title="Editar Plantilla">
      <ToastContainer />
      <form onSubmit={handleSubmit} className="card max-w-3xl mx-auto space-y-4">
        <h2 className="text-xl font-semibold">Editar Plantilla de Email</h2>
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
          <textarea name="body" value={form.body} onChange={handleChange} rows="12" required className="input-field font-mono text-sm" />
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
        <div className="flex items-center gap-2">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="rounded" />
          <label className="text-sm text-gray-700">Plantilla activa</label>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </AdminLayout>
  );
}