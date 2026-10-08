import { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/router';
import api from '../../../lib/axios';
import Handlebars from 'handlebars';

const sampleData = {
  username: 'NombreUsuario',
  campaign: { name: 'Campaña de ejemplo', description: 'Descripción de prueba' },
  action: { title: 'Acción de prueba', datetime: new Date().toISOString(), description: 'Detalles de la acción' },
  unsubscribeLink: '#',
  preferencesLink: '#',
  currentYear: new Date().getFullYear(),
  frontendUrl: '',
};

export default function NewEmailTemplate() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    associatedEvent: 'petition',
    headerColor: '#b91c1c',
    buttonColor: '#16a34a',
    footerColor: '#1f2937',
    backgroundColor: '#f3f4f6',
    titleColor: '#ffffff',
    footerTitleColor: '#ffffff',
  });
  const [previewHtml, setPreviewHtml] = useState('');
  const [loading, setLoading] = useState(false);

  const compilePreview = (body, colors) => {
    try {
      const template = Handlebars.compile(body);
      let html = template(sampleData);
      html = html
        .replace(/--header-color/g, colors.headerColor)
        .replace(/--button-color/g, colors.buttonColor)
        .replace(/--footer-color/g, colors.footerColor)
        .replace(/--bg-color/g, colors.backgroundColor)
        .replace(/--title-color/g, colors.titleColor)
        .replace(/--footer-title-color/g, colors.footerTitleColor);
      setPreviewHtml(html);
    } catch (error) {
      setPreviewHtml(`<div style="color:red">Error: ${error.message}</div>`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    compilePreview(updated.body, {
      headerColor: updated.headerColor,
      buttonColor: updated.buttonColor,
      footerColor: updated.footerColor,
      backgroundColor: updated.backgroundColor,
      titleColor: updated.titleColor,
      footerTitleColor: updated.footerTitleColor,
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
      await api.post('/email-templates', form);
      toast.success('Plantilla creada');
      router.push('/admin/email-templates');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear plantilla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Nueva Plantilla de Petición">
      <ToastContainer />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Información de la plantilla</h2>
          <p className="text-sm text-gray-500">
            Solo se pueden crear plantillas para peticiones. El evento asociado es &quot;petition&quot;.
          </p>
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
            <input type="text" value="Petición (petition)" disabled
              className="mt-1 block w-full border border-gray-200 bg-gray-50 rounded-lg p-2 text-gray-500 cursor-not-allowed" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Color cabecera</label>
              <input type="color" name="headerColor" value={form.headerColor} onChange={handleChange}
                className="w-full h-10 border border-gray-300 rounded-lg p-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Color texto título</label>
              <input type="color" name="titleColor" value={form.titleColor} onChange={handleChange}
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
              <label className="block text-sm font-medium text-gray-700">Color texto footer</label>
              <input type="color" name="footerTitleColor" value={form.footerTitleColor} onChange={handleChange}
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
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2 font-mono text-sm focus:ring-0 focus:border-fuchsia-500"
              placeholder="Escribe el HTML con variables Handlebars..." />
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-fuchsia-600 text-white py-2 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50">
            {loading ? 'Creando...' : 'Crear plantilla'}
          </button>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Vista previa</h2>
          <div className="border border-gray-300 rounded-xl overflow-hidden bg-white h-full max-h-[700px] overflow-y-auto p-2">
            <iframe
              srcDoc={previewHtml}
              title="Preview"
              className="w-full h-full min-h-[600px] border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}