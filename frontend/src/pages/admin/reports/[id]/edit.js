import api from '../../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';

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

const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400 transition-colors";
const selectClass = inputClass;

export default function EditReport() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({
    title: '',
    description: '',
    content: '',
    type: 'blog',
    source: '',
    author: '',
    currentFileUrl: null,
    file: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // 🆕 Método de contenido original (para cargar estado inicial)
  const [contentMethod, setContentMethod] = useState('write'); // 'write' o 'pdf'

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      try {
        const res = await api.get(`/reports/${id}`);
        const report = res.data;
        setForm({
          title: report.title || '',
          description: report.description || '',
          content: report.content || '',
          type: report.type || 'blog',
          source: report.source || '',
          author: report.author || '',
          currentFileUrl: report.fileUrl || null,
          file: null,
        });

        // Inferir método original: si hay contenido y no fileUrl, asumimos "write"
        if (report.content && !report.fileUrl) {
          setContentMethod('write');
        } else if (report.fileUrl) {
          setContentMethod('pdf');
        } else {
          setContentMethod('write'); // por defecto
        }
      } catch (err) {
        console.error('Error al cargar el reporte:', err);
        setError('No se pudo cargar la entrada. Verifica que el ID sea válido.');
        toast.error('No se pudo cargar la entrada');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setForm(prev => ({ ...prev, file: files[0] }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleContentChange = (value) => {
    setForm(prev => ({ ...prev, content: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.warning('El título es obligatorio');
      return;
    }
    if (contentMethod === 'write' && !form.content.trim()) {
      toast.warning('Debes escribir contenido antes de guardar');
      return;
    }
    if (contentMethod === 'pdf' && !form.file && !form.currentFileUrl) {
      toast.warning('Debes adjuntar un archivo PDF');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('content', contentMethod === 'write' ? form.content : '');
      formData.append('type', form.type);
      formData.append('source', form.source.trim());
      formData.append('author', form.author.trim());
      if (contentMethod === 'pdf' && form.file) formData.append('file', form.file);

      await api.put(`/reports/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Entrada actualizada');
      router.push('/admin/reports');
    } catch (err) {
      console.error('Error updating report:', err);
      toast.error(err.response?.data?.message || 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Editar Entrada">
        <p className="text-center py-8 text-lg text-gray-500">Cargando...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Editar Entrada">
        <div className="text-center py-8">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={() => router.push('/admin/reports')}
            className="mt-4 px-5 py-2.5 bg-fuchsia-600 text-white rounded-lg text-base"
          >
            Volver al listado
          </button>
        </div>
      </AdminLayout>
    );
  }

  const sanitizedContent = typeof window !== 'undefined' ? DOMPurify.sanitize(form.content) : '';

  return (
    <AdminLayout title="Editar Entrada Blog/Reporte">
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">Editar Entrada</h2>

          {/* Tipo */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Tipo *</label>
            <select name="type" value={form.type} onChange={handleChange} className={selectClass}>
              <option value="blog">📝 Blog (interno)</option>
              <option value="report">📄 Reporte (externo)</option>
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} required className={inputClass} />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={inputClass} />
          </div>

          {/* Fuente (solo reportes) */}
          {form.type === 'report' && (
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">Fuente(s) oficial(es) *</label>
              <input name="source" value={form.source} onChange={handleChange} required className={inputClass} placeholder="URL o nombre de la fuente" />
            </div>
          )}

          {/* Autor */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Autor</label>
            <input name="author" value={form.author} onChange={handleChange} className={inputClass} />
          </div>

          {/* 🆕 Selector de método de contenido */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Contenido</label>
            <div className="flex gap-6 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="contentMethod"
                  value="write"
                  checked={contentMethod === 'write'}
                  onChange={() => setContentMethod('write')}
                  className="text-fuchsia-600 focus:ring-fuchsia-500"
                />
                <span className="text-base">Escribir manualmente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="contentMethod"
                  value="pdf"
                  checked={contentMethod === 'pdf'}
                  onChange={() => setContentMethod('pdf')}
                  className="text-fuchsia-600 focus:ring-fuchsia-500"
                />
                <span className="text-base">Subir PDF</span>
              </label>
            </div>

            {contentMethod === 'write' ? (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✍️</span>
                  <h3 className="font-medium text-gray-800">Editor de texto</h3>
                </div>
                <ReactQuill
                  theme="snow"
                  value={form.content}
                  onChange={handleContentChange}
                  modules={quillModules}
                  placeholder="Escribe el contenido..."
                  className="bg-white"
                />
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📎</span>
                  <h3 className="font-medium text-gray-800">Archivo PDF</h3>
                </div>
                {form.currentFileUrl && !form.file && (
                  <p className="text-base text-blue-600 mb-2">
                    <a href={form.currentFileUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      Ver archivo actual
                    </a>
                  </p>
                )}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleChange}
                  className="w-full text-base text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100"
                />
                {form.file && <p className="mt-2 text-base text-fuchsia-700">📄 Nuevo: {form.file.name}</p>}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center px-5 py-2.5 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors text-base font-medium">
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={() => router.back()} className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-base font-medium">
              Cancelar
            </button>
          </div>
        </form>

        {/* Vista previa */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span>📄</span> Vista previa
            </h3>
            {!form.title ? (
              <p className="text-gray-400 text-base">Completa el formulario para ver la vista previa.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Título</h4>
                  <p className="text-gray-800 font-semibold">{form.title}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${form.type === 'report' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {form.type === 'report' ? '📄 Reporte' : '📝 Blog'}
                  </span>
                  {form.source && <span className="text-base text-gray-500">Fuente: {form.source}</span>}
                  {form.author && <span className="text-base text-gray-500">✍️ {form.author}</span>}
                </div>
                {form.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Descripción</h4>
                    <p className="text-gray-700 text-base whitespace-pre-wrap">{form.description}</p>
                  </div>
                )}
                {contentMethod === 'write' && form.content && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contenido</h4>
                    <div className="text-gray-700 text-base" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Archivo</h4>
                  {contentMethod === 'pdf' && form.file ? (
                    <p className="text-base text-fuchsia-600">📎 {form.file.name} (nuevo)</p>
                  ) : contentMethod === 'pdf' && form.currentFileUrl ? (
                    <p className="text-base text-blue-600 underline">
                      <a href={form.currentFileUrl} target="_blank" rel="noopener noreferrer">Ver archivo actual</a>
                    </p>
                  ) : (
                    <p className="text-base text-gray-400">Sin archivo adjunto</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}