// frontend/src/pages/admin/reports/new.js
import api from '../../../lib/axios';
import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReportPreview from '../../../components/ReportPreview';
import DocumentManager from '../../../components/DocumentManager';
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

export default function NewReport() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'blog',
    source: '',
    author: '',
    publishedAt: new Date().toISOString().slice(0, 16),
  });
  // 'text' → escribe contenido | 'file' → sube PDF (mutuamente excluyentes)
  const [contentMode, setContentMode] = useState('text');
  const [documents, setDocuments] = useState([]);
  // Bibliografía solo para type='report'
  const [bibliography, setBibliography] = useState([{ url: '', source: '' }]);

  const quillRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (html) => {
    setForm((prev) => ({ ...prev, content: html }));
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

    // Validaciones por tipo
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

    // Validación de modo de contenido
    if (contentMode === 'text' && !form.content.trim()) {
      toast.warning('Escribe el contenido o cambia a subir un PDF');
      return;
    }
    if (contentMode === 'file' && documents.length === 0) {
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

      if (contentMode === 'text') {
        formData.append('content', form.content || '');
      }
      // Si contentMode === 'file', el contenido viene del Document (PDF subido)

      if (form.type === 'report') {
        const validBib = bibliography.filter((b) => b.url.trim() !== '');
        formData.append('bibliography', JSON.stringify(validBib));
      }

      // Documentos (solo en modo 'file' - 1 PDF público)
      documents.forEach((doc, idx) => {
        formData.append(`documents[${idx}][name]`, doc.name);
        formData.append(`documents[${idx}][source]`, doc.source);
        formData.append(`documents[${idx}][visibility]`, doc.visibility);
        if (doc.source === 'upload' && doc.file) {
          formData.append(`documents[${idx}][file]`, doc.file);
        } else if (doc.source === 'link') {
          formData.append(`documents[${idx}][externalUrl]`, doc.externalUrl);
        }
      });

      await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Reporte creado');
      router.push('/admin/reports');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error al crear reporte');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400";

  return (
    <AdminLayout title="Nuevo Reporte">
      <ToastContainer />
      <button type="button" onClick={() => router.push('/admin/reports')}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <FaArrowLeft /> Volver a Reportes
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
                <form onSubmit={handleSubmit} className="lg:w-2/3 lg:self-start">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ═══════ COLUMNA IZQUIERDA: título + contenido ═══════ */}
            <div className="lg:col-span-2 space-y-5">

              {/* TIPO */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tipo *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, type: 'blog' }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      form.type === 'blog'
                        ? 'bg-fuchsia-600 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    📝 Blog
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, type: 'report' }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      form.type === 'report'
                        ? 'bg-fuchsia-600 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    📄 Reporte
                  </button>
                </div>
              </div>

              {/* TÍTULO */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="Escribe un título…"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xl font-semibold text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400 transition"
                />
              </div>

              {/* CONTENIDO */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    Contenido <span className="text-fuchsia-600">*</span>
                  </div>
                  <div className="inline-flex p-0.5 bg-gray-200/60 rounded-lg">
                    <button
                      type="button"
                      onClick={() => { setContentMode('text'); setDocuments([]); }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                        contentMode === 'text' ? 'bg-white text-fuchsia-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      ✏️ Escribir
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentMode('file')}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                        contentMode === 'file' ? 'bg-white text-fuchsia-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      📎 PDF
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {contentMode === 'text' ? (
                    <>
                      <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={form.content}
                        onChange={handleContentChange}
                        modules={quillModules}
                        placeholder="Escribe el contenido del artículo…"
                        className="bg-white"
                      />
                      {form.content && (
                        <p className="text-xs text-gray-400 mt-2 text-right tabular-nums">
                          {form.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length} palabras
                        </p>
                      )}
                    </>
                  ) : (
                    <DocumentManager
                      entityType="report"
                      documents={documents}
                      onChange={setDocuments}
                      maxPublic={1}
                      maxAdmin={0}
                      maxLinks={0}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ═══════ COLUMNA DERECHA: metadata ═══════ */}
            <div className="lg:col-span-1 space-y-5">

              {/* AUTOR (solo blog) */}
              {form.type === 'blog' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">✍️ Autor <span className="text-fuchsia-600">*</span></label>
                  <input
                    type="text"
                    name="author"
                    value={form.author}
                    onChange={handleChange}
                    placeholder="Nombre de quien escribe"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400"
                  />
                </div>
              )}

              {/* FUENTE */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">🔗 Fuente original</label>
                <input
                  type="text"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400"
                />
              </div>

              {/* FECHA */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">📅 Publicación</label>
                <input
                  type="datetime-local"
                  name="publishedAt"
                  value={form.publishedAt}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400"
                />
                <p className="text-[11px] text-gray-400 mt-1.5">Por defecto: fecha y hora actual.</p>
              </div>

              {/* BIBLIOGRAFÍA (solo report) */}
              {form.type === 'report' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      📚 Bibliografía <span className="text-fuchsia-600">*</span>
                    </label>
                    <span className="text-[11px] text-gray-400">{bibliography.length}/{MAX_BIBLIOGRAPHY}</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {bibliography.map((entry, idx) => (
                      <div key={idx} className="space-y-1.5 p-2 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Fuente {idx + 1}</span>
                          {bibliography.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBibliographyEntry(idx)}
                              className="text-gray-400 hover:text-red-600 text-xs"
                              title="Eliminar"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <input
                          type="url"
                          placeholder="https://... (URL)"
                          value={entry.url}
                          onChange={(e) => updateBibliographyEntry(idx, 'url', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-fuchsia-300 focus:border-fuchsia-400"
                        />
                        <input
                          type="text"
                          placeholder="Nombre (opcional)"
                          value={entry.source}
                          onChange={(e) => updateBibliographyEntry(idx, 'source', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-fuchsia-300 focus:border-fuchsia-400"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addBibliographyEntry}
                    disabled={bibliography.length >= MAX_BIBLIOGRAPHY}
                    className={`w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      bibliography.length >= MAX_BIBLIOGRAPHY
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                    }`}
                  >
                    <FaPlus className="w-2.5 h-2.5" /> Añadir fuente
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SUBMIT */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-fuchsia-600 text-white px-5 py-3.5 rounded-2xl hover:bg-fuchsia-700 disabled:opacity-50 font-semibold text-base shadow-sm transition-colors"
            >
              {loading ? 'Guardando...' : 'Crear Reporte'}
            </button>
          </div>
        </form>

        <div className="lg:w-1/3 lg:self-start">
          <ReportPreview form={form} />
        </div>
      </div>
    </AdminLayout>
  );
}
