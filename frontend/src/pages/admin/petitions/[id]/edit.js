import api from '../../../../lib/axios';
import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import {
  FaSave, FaEye, FaTimes, FaEnvelope, FaImage, FaLock, FaExternalLinkAlt
} from 'react-icons/fa';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

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

const DEFAULT_TEMPLATE_ID = 121;

export default function EditPetition() {
  const router = useRouter();
  const { id } = router.query;
  const quillRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    content: '',
    type: 'internal',
    externalUrl: '',
    emailSubject: '',
    urgency: false,
    deadline: '',
    hidden: false,
  });
  const [recipientEmails, setRecipientEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customColors, setCustomColors] = useState({
    headerColor: '#b91c1c',
    titleColor: '#ffffff',
    footerColor: '#1f2937',
    footerTitleColor: '#ffffff',
  });

  const [previewUrl, setPreviewUrl] = useState('');
  const [showPublicPreview, setShowPublicPreview] = useState(false);

  const updatePreviewUrl = useCallback(() => {
    const editor = quillRef.current?.getEditor?.();
    const plainText = (editor?.getText?.()?.trim() || form.content || '').replace(/<[^>]*>/g, '').trim();
    const url = `/api/email-templates/${DEFAULT_TEMPLATE_ID}/preview?headerColor=${encodeURIComponent(customColors.headerColor)}&titleColor=${encodeURIComponent(customColors.titleColor)}&footerColor=${encodeURIComponent(customColors.footerColor)}&footerTitleColor=${encodeURIComponent(customColors.footerTitleColor)}&title=${encodeURIComponent(form.title)}&content=${encodeURIComponent(plainText)}&subject=${encodeURIComponent(form.emailSubject)}`;
    setPreviewUrl(url);
  }, [customColors, form.title, form.content, form.emailSubject]);

  useEffect(() => { updatePreviewUrl(); }, [updatePreviewUrl]);

  useEffect(() => {
    if (!id) return;
    const fetchPetition = async () => {
      try {
        const res = await api.get(`/petitions/${id}`);
        const p = res.data;
        const emailsArray = Array.isArray(p.target_emails) ? p.target_emails : [];
        setForm({
          title: p.title || '',
          description: p.description || '',
          content: p.content || '',
          type: p.type === 'official' ? 'external' : p.type,
          externalUrl: p.external_url || '',
          emailSubject: p.email_subject || '',
          urgency: p.urgency || false,
          deadline: p.deadline ? new Date(p.deadline).toISOString().split('T')[0] : '',
          hidden: p.hidden || false,
        });
        setRecipientEmails(emailsArray);
        if (p.featured_image) setCurrentImage(p.featured_image);
        setCustomColors({
          headerColor: p.header_color || '#b91c1c',
          titleColor: p.title_color || '#ffffff',
          footerColor: p.footer_color || '#1f2937',
          footerTitleColor: p.footer_title_color || '#ffffff',
        });
      } catch (error) { toast.error('Error al cargar la petición'); }
      finally { setLoading(false); }
    };
    fetchPetition();
  }, [id]);

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

  const handleContentChange = (value) => {
    setForm(prev => ({ ...prev, content: value }));
    setTimeout(() => updatePreviewUrl(), 0);
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.warning('Email inválido'); return; }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const editor = quillRef.current?.getEditor?.();
    const plainText = (editor?.getText?.()?.trim() || form.content || '').replace(/<[^>]*>/g, '').trim();

    if (!form.title.trim()) { toast.warning('El título es obligatorio'); return; }
    if (form.type === 'internal') {
      if (!plainText) { toast.warning('El contenido del email es obligatorio'); return; }
      if (!form.emailSubject.trim()) { toast.warning('El asunto del email es obligatorio'); return; }
      if (recipientEmails.length === 0) { toast.warning('Añade al menos un destinatario'); return; }
    } else {
      if (!form.externalUrl.trim()) { toast.warning('La URL externa es obligatoria'); return; }
    }

    setSaving(true);
    const editorContent = editor?.root?.innerHTML || form.content;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      urgency: form.urgency,
      hidden: form.hidden,
      deadline: form.deadline || null,
      email_subject: form.emailSubject.trim() || null,
    };
    if (form.type === 'internal') {
      payload.content = editorContent;
      payload.target_emails = recipientEmails;
      payload.headerColor = customColors.headerColor;
      payload.titleColor = customColors.titleColor;
      payload.footerColor = customColors.footerColor;
      payload.footerTitleColor = customColors.footerTitleColor;
      payload.signature_fields = [{ name: 'email', label: 'Email', type: 'email', required: true }];
    } else {
      payload.external_url = form.externalUrl.trim();
    }

    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        payload.imageBase64 = reader.result;
        try {
          await api.put(`/petitions/${id}`, payload);
          toast.success('Petición actualizada');
          router.push('/admin/petitions');
        } catch (error) { toast.error(error.response?.data?.message || 'Error al actualizar'); }
        finally { setSaving(false); }
      };
      reader.readAsDataURL(imageFile);
      return;
    }

    try {
      await api.put(`/petitions/${id}`, payload);
      toast.success('Petición actualizada');
      router.push('/admin/petitions');
    } catch (error) { toast.error(error.response?.data?.message || 'Error al actualizar'); }
    finally { setSaving(false); }
  };

  if (loading) return <AdminLayout title="Editar Petición"><p className="text-center py-8">Cargando...</p></AdminLayout>;

  const isInternal = form.type === 'internal';
  const publicPreviewImage = imagePreview || (currentImage ? `${process.env.NEXT_PUBLIC_BASE_URL || ''}${currentImage}` : null);

  return (
    <AdminLayout title="Editar Petición">
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="lg:w-2/3 space-y-6">
          {/* DATOS DE LA PETICIÓN (fondo blanco) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-700">Datos de la petición</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de petición *</label>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value="internal" checked={isInternal} onChange={handleChange} className="text-fuchsia-600 focus:ring-0" />
                  <span className="text-sm text-gray-700">Interna (contenido y email)</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value="external" checked={!isInternal} onChange={handleChange} className="text-fuchsia-600 focus:ring-0" />
                  <span className="text-sm text-gray-700">Externa (enlace externo)</span>
                </label>
              </div>
            </div>

            <div><label className="block text-sm font-medium text-gray-700 mb-1">Título *</label><input type="text" name="title" value={form.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción breve</label><textarea name="description" value={form.description} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500" /></div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen destacada</label>
              <div className="flex items-center gap-4">
                <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-fuchsia-300 rounded-lg cursor-pointer hover:border-fuchsia-500 hover:bg-fuchsia-50 transition-colors">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover rounded-lg" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"><FaTimes /></button>
                    </div>
                  ) : currentImage ? (
                    <div className="relative w-full h-full">
                      <img src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}${currentImage}`} alt="Actual" className="w-full h-full object-cover rounded-lg" />
                      <span className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">Actual</span>
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
                  <p className="text-xs text-gray-400">Dejar vacío para mantener la actual</p>
                </div>
              </div>
            </div>

            {!isInternal && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de la petición *</label>
                <input type="url" name="externalUrl" value={form.externalUrl} onChange={handleChange} required placeholder="https://www.change.org/..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500" />
              </div>
            )}
          </div>

          {/* CONFIGURACIÓN DEL EMAIL (fondo amarillo claro) */}
          {isInternal && (
            <div className="bg-yellow-50 rounded-2xl shadow-sm border border-yellow-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-700">Configuración del email</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido del email *</label>
                <ReactQuill ref={quillRef} theme="snow" value={form.content} onChange={handleContentChange} modules={quillModules} placeholder="Escribe el cuerpo del correo..." className="bg-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto del email *</label>
                <input type="text" name="emailSubject" value={form.emailSubject} onChange={handleChange} required placeholder="Asunto que verán los destinatarios" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"><FaEnvelope className="inline w-3 h-3 mr-1" />Destinatarios del email *</label>
                <div className="flex flex-wrap gap-2 items-center border border-gray-300 rounded-lg p-2 bg-white">
                  {recipientEmails.map((email, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-fuchsia-100 text-fuchsia-800 px-2 py-1 rounded-full text-sm">
                      {email}
                      <button type="button" onClick={() => removeEmail(idx)} className="text-fuchsia-600 hover:text-red-600"><FaTimes className="w-3 h-3" /></button>
                    </span>
                  ))}
                  <input type="text" placeholder="Email y Enter/espacio" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onKeyDown={handleEmailInputKeyDown} onBlur={addEmail} className="flex-1 min-w-[150px] outline-none border-none bg-transparent" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" name="urgency" checked={form.urgency} onChange={handleChange} className="rounded border-gray-300 text-fuchsia-600 focus:ring-0" />
                  <span className="text-sm text-gray-700">🔥 Urgente</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" name="hidden" checked={form.hidden} onChange={handleChange} className="rounded border-gray-300 text-fuchsia-600 focus:ring-0" />
                  <span className="text-sm text-gray-700 flex items-center gap-1"><FaLock className="w-4 h-4 text-gray-500" /> Ocultar al público</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
                  <input type="date" name="deadline" value={form.deadline} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Personalizar colores del email</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-gray-500 mb-1">Color cabecera</label><input type="color" value={customColors.headerColor} onChange={(e) => setCustomColors(prev => ({ ...prev, headerColor: e.target.value }))} className="w-full h-10 border rounded-lg" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Color texto título</label><input type="color" value={customColors.titleColor} onChange={(e) => setCustomColors(prev => ({ ...prev, titleColor: e.target.value }))} className="w-full h-10 border rounded-lg" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Color footer</label><input type="color" value={customColors.footerColor} onChange={(e) => setCustomColors(prev => ({ ...prev, footerColor: e.target.value }))} className="w-full h-10 border rounded-lg" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Color texto footer</label><input type="color" value={customColors.footerTitleColor} onChange={(e) => setCustomColors(prev => ({ ...prev, footerTitleColor: e.target.value }))} className="w-full h-10 border rounded-lg" /></div>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition font-medium">
            <FaSave className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Actualizar Petición'}
          </button>
        </form>

        {/* Vista previa (solo interna) – sin recuadro, sin fondo */}
        {isInternal && (
          <div className="lg:w-1/3 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <FaEye className="text-fuchsia-600" /> Vista previa del email
              </h3>
              <button type="button" onClick={() => setShowPublicPreview(true)} className="inline-flex items-center gap-1 text-xs bg-white border border-gray-300 rounded-lg px-2 py-1 hover:bg-gray-50 transition shadow-sm">
                <FaExternalLinkAlt className="w-3 h-3" /> Abrir
              </button>
            </div>
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-[700px] border-0"
                title="Vista previa de la plantilla"
                style={{ backgroundColor: 'transparent' }}
              />
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
