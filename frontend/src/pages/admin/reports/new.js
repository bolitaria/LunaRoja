// frontend/src/pages/admin/reports/new.js
import api from '../../../lib/axios';
import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReportPreview from '../../../components/ReportPreview';
import DocumentManager from '../../../components/DocumentManager';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';

const MAX_BIBLIOGRAPHY = 5;

export default function NewReport() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    description: '',
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

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      formData.append('description', form.description || '');
      formData.append('type', form.type);
      formData.append('source', form.source || '');
      formData.append('author', form.type === 'blog' ? form.author : '');
      formData.append('publishedAt', form.publishedAt || new Date().toISOString());

      if (contentMode === 'text') {
        formData.append('content', form.content);
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
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 lg:self-start space-y-6">

          {/* ZONA PÚBLICA */}
          <div className="border-l-2 border-green-500 pl-4 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <span>🌍</span> Información pública
            </h2>
            <div className="space-y-4">
              {/* TÍTULO */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Título *</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} required className={inputClass} />
              </div>

              {/* TIPO */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Tipo *</label>
                <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                  <option value="blog">Blog (con firma del autor)</option>
                  <option value="report">Reporte (con bibliografía)</option>
                </select>
              </div>

              {/* DESCRIPCIÓN */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Descripción</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows="3" className={inputClass} />
              </div>

              {/* FUENTE */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Fuente original (opcional)</label>
                <input
                  type="text"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  placeholder="Ej: Amnistía Internacional, El País..."
                  className={inputClass}
                />
              </div>

              {/* FECHA */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Fecha de publicación</label>
                <input type="datetime-local" name="publishedAt" value={form.publishedAt} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* AUTOR — solo si type='blog' */}
          {form.type === 'blog' && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span>✍️</span> Firma del autor
              </h3>
              <input
                type="text"
                name="author"
                value={form.author}
                onChange={handleChange}
                placeholder="Nombre de quien escribe"
                className={inputClass}
              />
              <p className="text-sm text-gray-400 mt-1">Obligatorio. Aparecerá como firma del artículo.</p>
            </div>
          )}

          {/* BIBLIOGRAFÍA — solo si type='report' */}
          {form.type === 'report' && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <span>📚</span> Bibliografía
                </h3>
                <button
                  type="button"
                  onClick={addBibliographyEntry}
                  disabled={bibliography.length >= MAX_BIBLIOGRAPHY}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    bibliography.length >= MAX_BIBLIOGRAPHY
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-50'
                  }`}
                >
                  <FaPlus className="w-3 h-3" /> Añadir
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-2">Fuentes de donde se ha sacado la información (mín. 1, máx. {MAX_BIBLIOGRAPHY}).</p>
              <div className="space-y-2">
                {bibliography.map((entry, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="url"
                        placeholder="https://... (URL)"
                        value={entry.url}
                        onChange={(e) => updateBibliographyEntry(idx, 'url', e.target.value)}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        placeholder="Nombre de la fuente (opcional)"
                        value={entry.source}
                        onChange={(e) => updateBibliographyEntry(idx, 'source', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBibliographyEntry(idx)}
                      className="mt-2 text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONTENIDO: texto XOR PDF */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span>📝</span> Contenido
            </h3>
            <p className="text-sm text-gray-400 mb-2">Elige entre escribir texto o subir un PDF. Solo uno de los dos.</p>
            <div className="flex gap-6 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="contentMode"
                  value="text"
                  checked={contentMode === 'text'}
                  onChange={() => { setContentMode('text'); setDocuments([]); }}
                  className="text-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
                />
                <span className="text-base">Escribir texto aquí</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="contentMode"
                  value="file"
                  checked={contentMode === 'file'}
                  onChange={() => { setContentMode('file'); }}
                  className="text-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
                />
                <span className="text-base">Subir PDF</span>
              </label>
            </div>

            {contentMode === 'text' && (
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                rows="8"
                placeholder="Escribe aquí el contenido del artículo..."
                className={inputClass}
              />
            )}

            {contentMode === 'file' && (
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

          <button type="submit" disabled={loading}
            className="w-full bg-fuchsia-600 text-white px-5 py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 font-medium text-lg">
            {loading ? 'Guardando...' : 'Crear Reporte'}
          </button>
        </form>

        <div className="lg:w-1/3 lg:self-start">
          <ReportPreview form={form} />
        </div>
      </div>
    </AdminLayout>
  );
}
