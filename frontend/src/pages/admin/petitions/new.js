import api from '../../../lib/axios';
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import {
  FaPlus, FaSave, FaEye, FaTimes, FaEnvelope, FaPencilAlt, FaImage, FaLock,
  FaPalette, FaExternalLinkAlt
} from 'react-icons/fa';
import Handlebars from 'handlebars';
import Link from 'next/link';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: '1' }, { header: '2' }, { font: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['bold', 'italic', 'underline'],
    [{ align: [] }],
    ['link'],
    ['clean'],
  ],
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewPetition() {
  const router = useRouter();
  const quillRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'internal',
    externalUrl: '',
    content: '',
    urgency: false,
    hidden: false,
    emailTemplateId: '',
  });
  const [recipientEmails, setRecipientEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [templates, setTemplates] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal de vista previa de la petición
  const [showPreview, setShowPreview] = useState(false);

  // ---------- Creador de plantilla ----------
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    body: '',
    associatedEvent: 'custom',
    headerColor: '#b91c1c',
    buttonColor: '#16a34a',
    footerColor: '#1f2937',
    backgroundColor: '#f3f4f6',
  });
  const [templatePreview, setTemplatePreview] = useState('');
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  useEffect(() => {
    api.get('/email-templates')
      .then(res => setTemplates(res.data))
      .catch(() => toast.error('Error al cargar plantillas'));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      if (name === 'image') {
        setImageFile(files[0]);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        if (files[0]) reader.readAsDataURL(files[0]);
        else setImagePreview(null);
      }
    } else {
      setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleContentChange = (value) => setForm(prev => ({ ...prev, content: value }));

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) { toast.warning('Email inválido'); return; }
    if (recipientEmails.includes(email)) { toast.warning('Email ya añadido'); return; }
    setRecipientEmails(prev => [...prev, email]);
    setEmailInput('');
  };
  const removeEmail = (index) => setRecipientEmails(prev => prev.filter((_, i) => i !== index));
  const handleEmailInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addEmail();
    }
  };

  const addPublicGroup = () => setPublicGroups([...publicGroups, { platform: 'whatsapp', link: '' }]);
  const removePublicGroup = (index) => setPublicGroups(publicGroups.filter((_, i) => i !== index));
  const updatePublicGroup = (index, field, value) => {
    const updated = [...publicGroups];
    updated[index][field] = value;
    setPublicGroups(updated);
  };

  // ---------- Lógica del creador de plantillas ----------
  const compileTemplatePreview = (body, colors) => {
    try {
      const template = Handlebars.compile(body);
      let html = template({
        username: 'NombreUsuario',
        email: 'usuario@example.com',
        campaign: { name: 'Campaña de ejemplo' },
        action: { title: 'Acción de prueba' },
        unsubscribeLink: '#',
        currentYear: new Date().getFullYear(),
      });
      html = html
        .replace(/--header-color/g, colors.headerColor)
        .replace(/--button-color/g, colors.buttonColor)
        .replace(/--footer-color/g, colors.footerColor)
        .replace(/--bg-color/g, colors.backgroundColor);
      setTemplatePreview(html);
    } catch (error) {
      setTemplatePreview(`<div style="color:red">Error: ${error.message}</div>`);
    }
  };

  const handleTemplateChange = (e) => {
    const { name, value } = e.target;
    setNewTemplate(prev => {
      const updated = { ...prev, [name]: value };
      compileTemplatePreview(updated.body, updated);
      return updated;
    });
  };

  const saveAndSelectTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast.warning('Nombre, asunto y cuerpo son obligatorios');
      return;
    }
    setCreatingTemplate(true);
    try {
      const res = await api.post('/email-templates', newTemplate);
      toast.success('Plantilla creada y seleccionada');
      const templatesRes = await api.get('/email-templates');
      setTemplates(templatesRes.data);
      setForm(prev => ({ ...prev, emailTemplateId: res.data.id }));
      setShowTemplateCreator(false);
      setNewTemplate({
        name: '', subject: '', body: '', associatedEvent: 'custom',
        headerColor: '#b91c1c', buttonColor: '#16a34a', footerColor: '#1f2937', backgroundColor: '#f3f4f6',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear plantilla');
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const editor = quillRef.current?.getEditor();
    const plainText = editor?.getText().trim() || '';

    if (!form.title.trim()) { toast.warning('El título es obligatorio'); return; }

    if (form.type === 'internal') {
      if (!plainText) {
        toast.warning('El contenido es obligatorio');
        return;
      }
      if (!form.emailTemplateId) { toast.warning('Selecciona una plantilla de email'); return; }
      if (recipientEmails.length === 0) { toast.warning('Añade al menos un destinatario'); return; }
    } else {
      if (!form.externalUrl.trim()) { toast.warning('La URL externa es obligatoria'); return; }
    }

    setLoading(true);

    const editorContent = editor?.root?.innerHTML || form.content;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      urgency: form.urgency,
      hidden: form.hidden,
      groups: publicGroups.map(g => ({ ...g, is_public: true })),
    };

    if (form.type === 'internal') {
      payload.content = editorContent;
      payload.email_template_id = form.emailTemplateId;
      payload.target_emails = recipientEmails;
    } else {
      payload.external_url = form.externalUrl.trim();
    }

    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        payload.imageBase64 = reader.result;
        try {
          await api.post('/petitions', payload);
          toast.success('Petición creada');
          router.push('/admin/petitions');
        } catch (error) {
          toast.error(error.response?.data?.message || 'Error al crear petición');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(imageFile);
      return;
    }

    try {
      await api.post('/petitions', payload);
      toast.success('Petición creada');
      router.push('/admin/petitions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear petición');
    } finally {
      setLoading(false);
    }
  };

  const isOfficial = form.type === 'external';
  const previewTitle = form.title || 'Título de ejemplo';
  const previewContent = form.content || 'Contenido de ejemplo...';
  const previewImage = imagePreview || null;

  return (
    <AdminLayout title="Nueva Petición">
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 lg:w-2/3 space-y-6 p-6">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
            <FaPencilAlt className="text-fuchsia-600" /> Crear petición
          </h2>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de petición *</label>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value="internal" checked={form.type === 'internal'} onChange={handleChange} className="text-fuchsia-600 focus:ring-0" />
                <span className="text-sm text-gray-700">Interna (contenido y email)</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" value="external" checked={form.type === 'external'} onChange={handleChange} className="text-fuchsia-600 focus:ring-0" />
                <span className="text-sm text-gray-700">Externa (enlace externo)</span>
              </label>
            </div>
          </div>

          {/* Campos comunes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción breve</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500" />
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen destacada (opcional)</label>
            <div className="flex items-center gap-4">
              <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-fuchsia-300 rounded-lg cursor-pointer hover:border-fuchsia-500 hover:bg-fuchsia-50 transition-colors">
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover rounded-lg" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"><FaTimes /></button>
                  </div>
                ) : (
                  <>
                    <FaImage className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">Subir imagen</span>
                  </>
                )}
                <input type="file" name="image" accept="image/*, .webp" onChange={handleChange} className="hidden" />
              </label>
              <div className="text-sm text-gray-600">
                <p>JPG, PNG, WebP</p>
                <p className="text-xs text-gray-400">Tamaño recomendado: 800x600px</p>
              </div>
            </div>
          </div>

          {/* --- INTERNA --- */}
          {form.type === 'internal' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={form.content}
                  onChange={handleContentChange}
                  modules={quillModules}
                  placeholder="Escribe el contenido de la petición..."
                  className="bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plantilla de email *</label>
                <div className="flex items-center gap-2">
                  <select name="emailTemplateId" value={form.emailTemplateId} onChange={handleChange} required className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500">
                    <option value="">Selecciona una plantilla</option>
                    {templates.map(tpl => (<option key={tpl.id} value={tpl.id}>{tpl.name}</option>))}
                  </select>
                  <button type="button" onClick={() => setShowTemplateCreator(true)} className="inline-flex items-center gap-1.5 text-sm font-medium border-2 border-fuchsia-300 text-fuchsia-700 bg-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors shadow-sm">
                    <FaPlus className="w-3.5 h-3.5" /> Nueva plantilla
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"><FaEnvelope className="inline w-3 h-3 mr-1" />Destinatarios del email *</label>
                <div className="flex flex-wrap gap-2 items-center border border-gray-300 rounded-lg p-2">
                  {recipientEmails.map((email, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-fuchsia-100 text-fuchsia-800 px-2 py-1 rounded-full text-sm">
                      {email}
                      <button type="button" onClick={() => removeEmail(idx)} className="text-fuchsia-600 hover:text-red-600"><FaTimes className="w-3 h-3" /></button>
                    </span>
                  ))}
                  <input type="text" placeholder="Escribe un email y pulsa espacio o Enter para añadir" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onKeyDown={handleEmailInputKeyDown} onBlur={addEmail} className="flex-1 min-w-[150px] outline-none border-none" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Introduce los emails separados por espacios o Enter. Se añadirán como etiquetas.</p>
              </div>
            </>
          )}

          {/* --- EXTERNA --- */}
          {form.type === 'external' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de la petición *</label>
              <input type="url" name="externalUrl" value={form.externalUrl} onChange={handleChange} required placeholder="https://www.change.org/..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500" />
            </div>
          )}

          {/* Grupos públicos (comunes) */}
          <div className="border-t pt-4">
            <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2"><span>💬</span> Grupos de chat públicos</h3>
            <p className="text-xs text-gray-400 mb-2">Estos grupos aparecerán en la página pública.</p>
            {publicGroups.map((group, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <select value={group.platform} onChange={(e) => updatePublicGroup(idx, 'platform', e.target.value)} className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="signal">Signal</option>
                </select>
                <input type="url" placeholder="https://..." value={group.link} onChange={(e) => updatePublicGroup(idx, 'link', e.target.value)} className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500" />
                <button type="button" onClick={() => removePublicGroup(idx)} className="text-red-600 hover:text-red-800">✕</button>
              </div>
            ))}
            <button type="button" onClick={addPublicGroup} className="text-fuchsia-600 text-sm hover:underline flex items-center gap-1"><span>+</span> Añadir grupo público</button>
          </div>

          {/* Opciones */}
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" name="urgency" checked={form.urgency} onChange={handleChange} className="rounded border-gray-300 text-fuchsia-600 focus:ring-0" />
              <span className="text-sm text-gray-700">🔥 Urgente</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" name="hidden" checked={form.hidden} onChange={handleChange} className="rounded border-gray-300 text-fuchsia-600 focus:ring-0" />
              <span className="text-sm text-gray-700 flex items-center gap-1"><FaLock className="w-4 h-4 text-gray-500" /> Ocultar al público</span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition font-medium">
            <FaSave className="w-4 h-4" />
            {loading ? 'Creando...' : 'Crear Petición'}
          </button>
        </form>

        {/* Botón para abrir vista previa */}
        <div className="lg:w-1/3 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition font-medium shadow-sm"
          >
            <FaEye className="text-fuchsia-600" /> Vista previa pública
          </button>
        </div>
      </div>

      {/* MODAL de vista previa de la petición */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end p-2">
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-xl"><FaTimes /></button>
            </div>
            <div className="px-4 pb-6">
              {previewImage && (
                <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden mb-4">
                  <img src={previewImage} alt="Vista previa" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 flex-1">{previewTitle}</h3>
                {form.urgency && <span className="flex-shrink-0 inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">🔥 Urgente</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${isOfficial ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                  {isOfficial ? 'Externa' : 'Interna'}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {isOfficial ? 'Redirige a un sitio externo para firmar.' : previewContent.replace(/<[^>]*>/g, '').substring(0, 120) + '…'}
              </p>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">0 firmas</span>
                <span className="text-[#008000] text-sm font-semibold">{isOfficial ? 'Ir a firmar →' : 'Firmar →'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL CREACIÓN DE PLANTILLA ---------- */}
      {showTemplateCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowTemplateCreator(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2"><FaPalette className="text-fuchsia-600" /> Nueva plantilla</h3>
              <button onClick={() => setShowTemplateCreator(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                  <input type="text" name="name" value={newTemplate.name} onChange={handleTemplateChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-0 focus:border-fuchsia-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Asunto *</label>
                  <input type="text" name="subject" value={newTemplate.subject} onChange={handleTemplateChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-0 focus:border-fuchsia-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Evento asociado</label>
                  <select name="associatedEvent" value={newTemplate.associatedEvent} onChange={handleTemplateChange} className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-0 focus:border-fuchsia-500">
                    <option value="custom">Personalizado</option>
                    <option value="campaign_created">Al crear campaña</option>
                    <option value="action_created">Al crear acción</option>
                    <option value="subscriber_welcome">Bienvenida al suscriptor</option>
                    <option value="reminder">Recordatorio (día antes)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-gray-500 mb-1">Color cabecera</label><input type="color" name="headerColor" value={newTemplate.headerColor} onChange={handleTemplateChange} className="w-full h-10 border rounded-lg" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Color botón</label><input type="color" name="buttonColor" value={newTemplate.buttonColor} onChange={handleTemplateChange} className="w-full h-10 border rounded-lg" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Color footer</label><input type="color" name="footerColor" value={newTemplate.footerColor} onChange={handleTemplateChange} className="w-full h-10 border rounded-lg" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Fondo general</label><input type="color" name="backgroundColor" value={newTemplate.backgroundColor} onChange={handleTemplateChange} className="w-full h-10 border rounded-lg" /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cuerpo HTML *</label>
                  <textarea name="body" value={newTemplate.body} onChange={handleTemplateChange} rows={12} className="mt-1 block w-full border border-gray-300 rounded-lg p-2 font-mono text-sm focus:ring-0 focus:border-fuchsia-500" placeholder="HTML con variables Handlebars..." />
                </div>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={saveAndSelectTemplate} disabled={creatingTemplate} className="bg-fuchsia-600 text-white px-6 py-2 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition">
                    {creatingTemplate ? 'Guardando...' : 'Guardar y usar'}
                  </button>
                  <Link href="/admin/email-templates" className="text-sm text-fuchsia-600 hover:underline flex items-center gap-1"><FaExternalLinkAlt className="w-3 h-3" /> Ir a plantillas</Link>
                </div>
              </div>
              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-2">Vista previa</h4>
                <div className="border border-gray-300 rounded-xl overflow-hidden bg-white h-full max-h-[500px] overflow-y-auto p-2">
                  <iframe srcDoc={templatePreview} title="Preview" className="w-full h-full min-h-[400px] border-0" sandbox="allow-same-origin" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}