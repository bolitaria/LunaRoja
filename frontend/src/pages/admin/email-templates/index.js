import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFlask, FaSearch, FaEye, FaTimes } from 'react-icons/fa';

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null); // { id, name }
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/email-templates');
      setTemplates(res.data);
    } catch (error) {
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleSendTest = async (id) => {
    try {
      await api.post(`/email-templates/${id}/test`);
      toast.success('Prueba enviada a administradores');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar prueba');
    }
  };

  const openPreview = (template) => {
    const url = `/api/email-templates/${template.id}/preview?title=${encodeURIComponent(template.subject || '')}&content=${encodeURIComponent('Contenido de ejemplo')}`;
    setPreviewTemplate(template);
    setPreviewUrl(url);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
    setPreviewUrl('');
  };

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Etiquetas legibles de eventos
  const eventLabels = {
    subscriber_welcome: 'Bienvenida',
    subscriber_goodbye: 'Despedida',
    campaign_created: 'Campaña',
    action_created: 'Acción',
    reminder: 'Recordatorio',
    password_reset: 'Restablecer contraseña',
    donation_available: 'Donaciones',
    petition: 'Petición',
    report_created: 'Reporte',
  };

  return (
    <AdminLayout title="Plantillas Email">
      <ToastContainer />

      {/* Barra de búsqueda */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar plantilla…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500 text-sm w-64"
          />
        </div>
        <div className="text-sm text-gray-500">
          Total: <span className="font-bold text-gray-800">{templates.length}</span>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron plantillas</p>
          <p className="text-sm">Ajusta la búsqueda o reinicia el backend para sincronizar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(tpl => (
            <div key={tpl.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{tpl.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${tpl.type === 'system' ? 'bg-fuchsia-100 text-fuchsia-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {tpl.type === 'system' ? 'Sistema' : 'Peticiones Internas'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Asunto:</span> {tpl.subject}
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Evento: {eventLabels[tpl.associatedEvent] || tpl.associatedEvent || 'Personalizado'}
              </p>
              <div className="mt-auto flex items-center gap-2">
                <button
                  onClick={() => openPreview(tpl)}
                  className="inline-flex items-center gap-1 text-sm text-fuchsia-700 border border-fuchsia-300 rounded-lg px-3 py-1.5 hover:bg-fuchsia-50 transition-colors"
                  title="Vista previa"
                >
                  <FaEye className="w-4 h-4" /> Ver
                </button>
                <button
                  onClick={() => handleSendTest(tpl.id)}
                  className="inline-flex items-center gap-1 text-sm text-emerald-700 border border-emerald-300 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors"
                  title="Enviar prueba"
                >
                  <FaFlask className="w-4 h-4" /> Prueba
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de vista previa */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4" onClick={closePreview}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">{previewTemplate.name}</h3>
              <button onClick={closePreview} className="text-gray-400 hover:text-gray-600 text-xl">
                <FaTimes />
              </button>
            </div>
            <div className="p-4 h-[600px] overflow-y-auto">
              <iframe src={previewUrl} className="w-full h-full border-0" title="Vista previa" sandbox="allow-same-origin" />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}