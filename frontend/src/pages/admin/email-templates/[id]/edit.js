import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../../../lib/axios';
import Handlebars from 'handlebars';

const sampleData = {
  username: 'NombreUsuario',
  campaign: { name: 'Campaña de ejemplo', description: 'Descripción de prueba' },
  action: { title: 'Acción de prueba', datetime: new Date().toISOString(), description: 'Detalles de la acción' },
  unsubscribeLink: '#',
  preferencesLink: '#',
  currentYear: new Date().getFullYear(),
  frontendUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
};

export default function EditEmailTemplate() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({ name: '', subject: '', body: '', associatedEvent: 'custom' });
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/email-templates/${id}`)
        .then(res => {
          const t = res.data;
          setForm({ name: t.name, subject: t.subject, body: t.body, associatedEvent: t.associatedEvent });
          compilePreview(t.body);
        })
        .catch(err => {
          toast.error('Error al cargar plantilla');
          router.push('/admin/email-templates');
        })
        .finally(() => setFetching(false));
    }
  }, [id]);

  const compilePreview = (body) => {
    try {
      const template = Handlebars.compile(body);
      setPreviewHtml(template(sampleData));
    } catch (error) {
      setPreviewHtml(`<div style="color:red">Error al compilar: ${error.message}</div>`);
    }
  };

  const handleBodyChange = (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, body: value }));
    compilePreview(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.body) {
      toast.error('Nombre, asunto y cuerpo son obligatorios');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/email-templates/${id}`, form);
      toast.success('Plantilla actualizada');
      router.push('/admin/email-templates');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <AdminLayout title="Editar Plantilla"><div className="text-center py-8">Cargando...</div></AdminLayout>;

  return (
    <AdminLayout title="Editar Plantilla">
      <ToastContainer />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Editar plantilla</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-fuchsia-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Asunto *</label>
            <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-fuchsia-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Evento asociado</label>
            <select value={form.associatedEvent} onChange={(e) => setForm({ ...form, associatedEvent: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-fuchsia-500">
              <option value="custom">Personalizado</option>
              <option value="campaign_created">Al crear campaña</option>
              <option value="action_created">Al crear acción</option>
              <option value="subscriber_welcome">Bienvenida al suscriptor</option>
              <option value="reminder">Recordatorio (día antes)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cuerpo HTML *</label>
            <textarea value={form.body} onChange={handleBodyChange} rows={16}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2 font-mono text-sm focus:ring-2 focus:ring-fuchsia-500" />
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-fuchsia-600 text-white py-2 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50">
            {loading ? 'Guardando...' : 'Actualizar plantilla'}
          </button>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Vista previa</h2>
          <div className="border border-gray-300 rounded-xl overflow-hidden bg-white h-full max-h-[700px] overflow-y-auto p-2">
            <iframe srcDoc={previewHtml} title="Preview" className="w-full h-full min-h-[600px] border-0" sandbox="allow-same-origin" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}