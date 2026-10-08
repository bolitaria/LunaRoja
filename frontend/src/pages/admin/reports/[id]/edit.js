// frontend/src/pages/admin/reports/[id]/edit.js
import api from '../../../../lib/axios';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReportPreview from '../../../../components/ReportPreview';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['blockquote', 'link'],
    ['clean'],
  ],
};


const MAX_BIBLIOGRAPHY = 5;

export default function EditReport() {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState({
    title: '', content: '',
    type: 'blog', source: '', author: '', publishedAt: '',
  });
  const [contentMode, setContentMode] = useState('text');
  const [documents, setDocuments] = useState([]);
  const [bibliography, setBibliography] = useState([{ url: '', source: '' }]);

  const quillRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await api.get(`/reports/${id}`);
        const r = res.data;
        setForm({
          title: r.title || '',
          content: r.content || '',
          type: r.type || 'blog',
          source: r.source || '',
          author: r.author || '',
          publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString().slice(0, 16) : '',
        });

        // Modo de contenido por defecto según tipo
        if (r.type === 'report') {
          setContentMode('file');
        } else {
          setContentMode('text');
        }

        // Detectar modo de contenido: si hay documentos → file, si no → text
        const docs = (r.documents || []).map((doc) => ({
          id: doc.id,
          name: doc.title,
          source: doc.source,
          file: null,
          externalUrl: doc.externalUrl || null,
          visibility: doc.visibility,
          filePath: doc.filePath || null,
          isNew: false,
        }));
        setDocuments(docs);
        setContentMode(docs.length > 0 ? 'file' : 'text');

        // Cargar bibliografía
        if (Array.isArray(r.bibliography) && r.bibliography.length > 0) {
          setBibliography(r.bibliography);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al cargar el reporte');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (html) => {
    setForm((prev) => ({ ...prev, content: html }));
  };

  // ─── Subida de PDF (reportes) ───
  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      toast.warning('Solo se permiten archivos PDF');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.warning('El PDF no puede superar los 20 MB');
      return;
    }
    setDocuments([{
      id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      source: 'upload',
      file,
      visibility: 'public',
      filePath: null,
      isNew: true,
    }]);
    e.target.value = '';
  };

  const handleRemovePdf = async () => {
    const doc = documents[0];
    if (doc && !doc.isNew && doc.id) {
      try {
        await api.delete(`/documents/${doc.id}`);
        toast.success('PDF eliminado');
      } catch (err) {
        toast.error('Error al eliminar el PDF');
        return;
      }
    }
    setDocuments([]);
  };

  const handleTypeChange = (newType) => {
    setForm((prev) => ({ ...prev, type: newType }));
    if (newType === 'blog') {
      setContentMode('text');
      setDocuments([]);
    } else if (newType === 'report') {
      setContentMode('file');
    }
  };

  // ─── Bibliografía ──────────────────────────────────────────
  const addBibliographyEntry = () => {
    if (bibliography.length >= MAX_BIBLIOGRAPHY) {
      toast.warning(`Máximo ${MAX_BIBLIOGRAPHY} fuentes bibliográficas`);
      return;
    }
    setBibliography((prev) => [...prev, { url: '', source: '' }]);
  };
  const removeBibliographyEntry = (idx) => {
    setBibliography((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateBibliographyEntry = (idx, field, value) => {
    setBibliography((prev) =>
      prev.map((entry, i) => (i === idx ? { ...entry, [field]: value } : entry))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.warning('El título es obligatorio'); return; }

    if (form.type === 'blog' && !form.author.trim()) {
      toast.warning('Los blogs deben tener firma del autor');
      return;
    }
    if (form.type === 'report') {
      const validBib = bibliography.filter((b) => b.url.trim() !== '');
      if (validBib.length === 0) {
        toast.warning('Los reportes deben tener al menos una fuente bibliográfica');
        return;
      }
    }

    const newDocs = documents.filter((d) => d.isNew);
    const existingDocs = documents.filter((d) => !d.isNew);
    const totalDocs = newDocs.length + existingDocs.length;

    if (contentMode === 'text' && !form.content.trim()) {
      toast.warning('Escribe el contenido o cambia a subir un PDF');
      return;
    }
    if (contentMode === 'file' && totalDocs === 0) {
      toast.warning('Sube un PDF o cambia a escribir contenido');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('type', form.type);
      formData.append('source', form.source || '');
      formData.append('author', form.type === 'blog' ? form.author : '');
      formData.append('publishedAt', form.publishedAt || new Date().toISOString());

      // Si estamos en modo texto → mandamos content. Si modo file → content vacío
      formData.append('content', contentMode === 'text' ? form.content : '');

      if (form.type === 'report') {
        const validBib = bibliography.filter((b) => b.url.trim() !== '');
        formData.append('bibliography', JSON.stringify(validBib));
      }

      // Solo enviamos documentos NUEVOS (los existentes ya están en BD)
      newDocs.forEach((doc, idx) => {
        formData.append(`documents[${idx}][name]`, doc.name);
        formData.append(`documents[${idx}][source]`, doc.source);
        formData.append(`documents[${idx}][visibility]`, doc.visibility);
        if (doc.source === 'upload' && doc.file) {
          formData.append(`documents[${idx}][file]`, doc.file);
        } else if (doc.source === 'link') {
          formData.append(`documents[${idx}][externalUrl]`, doc.externalUrl);
        }
      });

      await api.put(`/reports/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Reporte actualizado');
      router.push(`/admin/reports/${id}`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error al actualizar reporte');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400";

  if (loadingData) {
    return <AdminLayout title="Editar Reporte"><p className="text-center py-8">Cargando...</p></AdminLayout>;
  }

  return (
    <AdminLayout title="Editar Reporte">
      <ToastContainer />
      <button type="button" onClick={() => router.push(`/admin/reports/${id}`)}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <FaArrowLeft /> Volver a Reportes
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
                <form onSubmit={handleSubmit} className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 lg:w-2/3 lg:self-start">

          {/* TABS DE TIPO */}
          <div className="flex items-center gap-1 border-b border-gray-100 mb-8">
            <button
              type="button"
              onClick={() => handleTypeChange('blog')}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                form.type === 'blog'
                  ? 'text-fuchsia-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              📝 Blog
              {form.type === 'blog' && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-fuchsia-600 rounded-full"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('report')}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                form.type === 'report'
                  ? 'text-fuchsia-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              📄 Reporte
              {form.type === 'report' && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-fuchsia-600 rounded-full"></span>
              )}
            </button>
          </div>

          {/* TÍTULO */}
          <div className="mb-8">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Título <span className="text-fuchsia-600">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Escribe un título…"
              className="w-full px-0 py-3 border-0 border-b-2 border-gray-200 text-2xl lg:text-3xl font-semibold text-gray-800 placeholder-gray-300 focus:outline-none focus:border-fuchsia-400 bg-transparent transition-colors"
            />
          </div>

          {/* AUTOR / FUENTE / FECHA en línea */}
          <div className={`grid grid-cols-1 ${form.type === 'blog' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-x-8 gap-y-6 mb-8`}>
            {form.type === 'blog' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Autor <span className="text-fuchsia-600">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  placeholder="Nombre…"
                  className="w-full px-0 py-2 border-0 border-b border-gray-300 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-fuchsia-400 bg-transparent transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Fuente original
              </label>
              <input
                type="text"
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="Opcional"
                className="w-full px-0 py-2 border-0 border-b border-gray-300 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-fuchsia-400 bg-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Publicación
              </label>
              <input
                type="datetime-local"
                name="publishedAt"
                value={form.publishedAt}
                onChange={handleChange}
                className="w-full px-0 py-2 border-0 border-b border-gray-300 text-sm text-gray-800 focus:outline-none focus:border-fuchsia-400 bg-transparent transition-colors"
              />
            </div>
          </div>

          {/* CONTENIDO */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Contenido <span className="text-fuchsia-600">*</span>
              </label>
              <div className="inline-flex p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setContentMode('text'); setDocuments([]); }}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    contentMode === 'text'
                      ? 'bg-white text-fuchsia-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  ✏️ Escribir texto
                </button>
                <button
                  type="button"
                  onClick={() => setContentMode('file')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    contentMode === 'file'
                      ? 'bg-white text-fuchsia-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  📎 Subir PDF
                </button>
              </div>
            </div>

            {contentMode === 'text' ? (
              <>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={form.content}
                    onChange={handleContentChange}
                    modules={quillModules}
                    placeholder="Escribe el contenido del artículo…"
                  />
                </div>
                {form.content && (
                  <p className="text-xs text-gray-400 mt-2 text-right tabular-nums">
                    {form.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length} palabras
                  </p>
                )}
              </>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 transition-colors hover:border-fuchsia-300 hover:bg-fuchsia-50/30">
                {documents.length === 0 ? (
                  <label className="cursor-pointer block text-center">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={handlePdfChange}
                    />
                    <div className="text-4xl mb-3">📄</div>
                    <p className="text-sm font-semibold text-gray-700">Sube tu PDF</p>
                    <p className="text-xs text-gray-500 mt-1">Pulsa aquí para seleccionar el archivo</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Máximo 20 MB · Solo PDF</p>
                  </label>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-fuchsia-100 flex items-center justify-center text-2xl flex-shrink-0">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{documents[0].name}</p>
                      <p className="text-xs text-gray-500">
                        {documents[0].isNew && documents[0].file
                          ? `${(documents[0].file.size / 1024 / 1024).toFixed(2)} MB · PDF`
                          : 'PDF subido'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePdf}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Quitar PDF"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BIBLIOGRAFÍA (solo report) */}
          {form.type === 'report' && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Bibliografía <span className="text-fuchsia-600">*</span>
                </label>
                <span className="text-xs text-gray-400">{bibliography.length}/{MAX_BIBLIOGRAPHY}</span>
              </div>
              <div className="space-y-3">
                {bibliography.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-300 tabular-nums w-4 text-right">{idx + 1}</span>
                    <input
                      type="url"
                      placeholder="https://…"
                      value={entry.url}
                      onChange={(e) => updateBibliographyEntry(idx, 'url', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-300 focus:border-fuchsia-400"
                    />
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={entry.source}
                      onChange={(e) => updateBibliographyEntry(idx, 'source', e.target.value)}
                      className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-300 focus:border-fuchsia-400"
                    />
                    {bibliography.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBibliographyEntry(idx)}
                        className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                        title="Eliminar"
                      >
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {bibliography.length < MAX_BIBLIOGRAPHY && (
                <button
                  type="button"
                  onClick={addBibliographyEntry}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-fuchsia-600 hover:text-fuchsia-800 transition-colors"
                >
                  <FaPlus className="w-3 h-3" /> Añadir fuente
                </button>
              )}
            </div>
          )}

          {/* SUBMIT */}
          <div className="pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-fuchsia-600 text-white font-bold py-3 rounded-xl hover:bg-fuchsia-700 disabled:opacity-50 shadow-sm transition-colors text-base"
            >
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>

        <div className="lg:w-1/3 lg:self-start">
          <ReportPreview form={form} documents={documents} />
        </div>
      </div>
    </AdminLayout>
  );
}
