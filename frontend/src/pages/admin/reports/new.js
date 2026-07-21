import api from '../../../lib/axios';
import { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

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

// Clases reutilizables con letra grande y foco sutil
const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400 transition-colors";
const selectClass = inputClass;

export default function NewReport() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    content: '',
    type: 'blog', // por defecto blog
    source: '',
    author: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🆕 Control de método de contenido
  const [contentMethod, setContentMethod] = useState('write'); // 'write' o 'pdf'

  const isBlogAdmin = user?.role === 'blog_admin';
  const hasContent = form.content.trim().length > 0;
  const hasFile = file !== null;

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFile(files[0]);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleContentChange = (value) => {
    setForm({ ...form, content: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.warning('El título es obligatorio');
      return;
    }
    if (!isBlogAdmin && form.type === 'report' && !form.source.trim()) {
      toast.warning('Los reportes requieren al menos una fuente oficial');
      return;
    }
    // Validación según método elegido
    if (contentMethod === 'write' && !hasContent) {
      toast.warning('Debes escribir contenido antes de guardar');
      return;
    }
    if (contentMethod === 'pdf' && !hasFile) {
      toast.warning('Debes adjuntar un archivo PDF');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('content', contentMethod === 'write' ? form.content : '');
      formData.append('type', isBlogAdmin ? 'blog' : form.type);
      if (form.source) formData.append('source', form.source.trim());
      if (form.author) formData.append('author', form.author.trim());
      if (contentMethod === 'pdf' && file) formData.append('file', file);

      await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Entrada creada correctamente');
      router.push('/admin/reports');
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error(error.response?.data?.message || 'No se pudo crear la entrada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Nueva Entrada">
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">
            {isBlogAdmin ? 'Nuevo Blog' : 'Nueva Entrada (Blog/Reporte)'}
          </h2>

          {/* Tipo (solo si no es blog_admin) */}
          {!isBlogAdmin && (
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">Tipo *</label>
              <select name="type" value={form.type} onChange={handleChange} className={selectClass}>
                <option value="blog">📝 Blog (interno)</option>
                <option value="report">📄 Reporte (externo)</option>
              </select>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          {/* Descripción breve */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Descripción breve (opcional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="2"
              className={inputClass}
            />
          </div>

          {/* Fuente (solo para reportes no blog_admin) */}
          {!isBlogAdmin && form.type === 'report' && (
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">Fuente(s) oficial(es) *</label>
              <input
                name="source"
                value={form.source}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="URL o nombre de la fuente"
              />
            </div>
          )}

          {/* Autor */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">Autor (opcional)</label>
            <input
              name="author"
              value={form.author}
              onChange={handleChange}
              className={inputClass}
              placeholder="Tu nombre o seudónimo"
            />
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

            {/* Área condicional */}
            {contentMethod === 'write' ? (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✍️</span>
                  <h3 className="font-medium text-gray-800">Editor de texto</h3>
                  {hasContent && <span className="text-xs text-green-600 ml-2">✓</span>}
                </div>
                <ReactQuill
                  theme="snow"
                  value={form.content}
                  onChange={handleContentChange}
                  modules={quillModules}
                  placeholder="Escribe aquí..."
                  className="bg-white"
                />
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📎</span>
                  <h3 className="font-medium text-gray-800">Archivo PDF</h3>
                  {hasFile && <span className="text-xs text-green-600 ml-2">✓</span>}
                </div>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleChange}
                  className="w-full text-base text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100"
                />
                {file && <p className="mt-2 text-base text-fuchsia-700">📄 {file.name}</p>}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors text-base font-medium"
            >
              {loading ? 'Creando...' : 'Crear Entrada'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-base font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>

        {/* Vista previa (sin cambios) */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Vista previa</h3>
            {!form.title && !hasContent && !hasFile ? (
              <p className="text-gray-400 text-base">Completa el formulario para ver la vista previa.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Título</h4>
                  <p className="text-gray-800 font-semibold">{form.title}</p>
                </div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${form.type === 'report' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {form.type === 'report' ? '📄 Reporte' : '📝 Blog'}
                  </span>
                </div>
                {form.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Descripción</h4>
                    <p className="text-gray-700 text-base">{form.description}</p>
                  </div>
                )}
                {contentMethod === 'write' && hasContent && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contenido</h4>
                    <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: form.content }} />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Archivo</h4>
                  {contentMethod === 'pdf' && file ? (
                    <p className="text-base text-fuchsia-600">📎 {file.name}</p>
                  ) : (
                    <p className="text-base text-gray-400">Sin archivo</p>
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