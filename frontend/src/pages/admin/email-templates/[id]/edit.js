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
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    associatedEvent: 'custom',
    headerColor: '#b91c1c',
    buttonColor: '#16a34a',
    footerColor: '#1f2937',
    backgroundColor: '#f3f4f6',
  });
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const compilePreview = (body, colors) => {
    try {
      const template = Handlebars.compile(body);
      let html = template(sampleData);
      html = html
        .replace(/--header-color/g, colors.headerColor)
        .replace(/--button-color/g, colors.buttonColor)
        .replace(/--footer-color/g, colors.footerColor)
        .replace(/--bg-color/g, colors.backgroundColor);
      setPreviewHtml(html);
    } catch (error) {
      setPreviewHtml(`<div style="color:red">Error: ${error.message}</div>`);
    }
  };

  useEffect(() => {
    if (id) {
      api.get(`/email-templates/${id}`)
        .then(res => {
          const t = res.data;
          const updated = {
            name: t.name,
            subject: t.subject,
            body: t.body,
            associatedEvent: t.associatedEvent || 'custom',
            headerColor: t.headerColor || '#b91c1c',
            buttonColor: t.buttonColor || '#16a34a',
            footerColor: t.footerColor || '#1f2937',
            backgroundColor: t.backgroundColor || '#f3f4f6',
          };
          setForm(updated);
          compilePreview(t.body, {
            headerColor: updated.headerColor,
            buttonColor: updated.buttonColor,
            footerColor: updated.footerColor,
            backgroundColor: updated.backgroundColor,
          });
        })
        .catch(err => {
          toast.error('Error al cargar plantilla');
          router.push('/admin/email-templates');
        })
        .finally(() => setFetching(false));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    compilePreview(updated.body, {
      headerColor: updated.headerColor,
      buttonColor: updated.buttonColor,
      footerColor: updated.footerColor,
      backgroundColor: updated.backgroundColor,
    });
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Editar plantilla</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-0 focus:border-fuchsia-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Asunto *</label>
            <input type="text" name="subject" value={form.subject} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-0 focus:border-fuchsia-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Evento asociado</label>
            <select name="associatedEvent" value={form.associatedEvent} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-0 focus:border-fuchsia-500">
              <option value="custom">Personalizado</option>
              <option value="campaign_created">Al crear campaña</option>
              <option value="action_created">Al crear acción</option>
              <option value="subscriber_welcome">Bienvenida al suscriptor</option>
              <option value="reminder">Recordatorio (día antes)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Color cabecera</label>
              <input type="color" name="headerColor" value={form.headerColor} onChange={handleChange}
                className="w-full h-10 border border-gray-300 rounded-lg p-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Color botón</label>
              <input type="color" name="buttonColor" value={form.buttonColor} onChange={handleChange}
                className="w-full h-10 border border-gray-300 rounded-lg p-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Color footer</label>
              <input type="color" name="footerColor" value={form.footerColor} onChange={handleChange}
                className="w-full h-10 border border-gray-300 rounded-lg p-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fondo general</label>
              <input type="color" name="backgroundColor" value={form.backgroundColor} onChange={handleChange}
                className="w-full h-10 border border-gray-300 rounded-lg p-1" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cuerpo HTML *</label>
            <textarea value={form.body} onChange={handleChange} rows={16}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2 font-mono text-sm focus:ring-0 focus:border-fuchsia-500" />
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