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
    if (!hasContent && !hasFile) {
      toast.warning('Debes escribir contenido o adjuntar un archivo');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('content', form.content);
      formData.append('type', isBlogAdmin ? 'blog' : form.type); // blog_admin siempre tipo blog
      if (form.source) formData.append('source', form.source.trim());
      if (form.author) formData.append('author', form.author.trim());
      if (file) formData.append('file', file);

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

          {/* Tipo: solo visible si NO es blog_admin */}
          {!isBlogAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="blog">📝 Blog (interno)</option>
                <option value="report">📄 Reporte (externo)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción breve (opcional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>

          {/* Fuente solo para reportes (no blog_admin) */}
          {!isBlogAdmin && form.type === 'report' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuente(s) oficial(es) *</label>
              <input
                name="source"
                value={form.source}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                placeholder="URL o nombre de la fuente"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Autor (opcional)</label>
            <input
              name="author"
              value={form.author}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
              placeholder="Tu nombre o seudónimo"
            />
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">✍️</span>
              <h3 className="font-medium text-gray-800">Contenido enriquecido</h3>
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

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📎</span>
              <h3 className="font-medium text-gray-800">Adjuntar archivo</h3>
              {hasFile && <span className="text-xs text-green-600 ml-2">✓</span>}
            </div>
            <input
              type="file"
              onChange={handleChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100"
            />
            {file && <p className="mt-1 text-sm text-fuchsia-700">📄 {file.name}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {loading ? 'Creando...' : 'Crear Entrada'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>

        {/* Vista previa */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Vista previa</h3>
            {!form.title && !hasContent && !hasFile ? (
              <p className="text-gray-400 text-sm">Completa el formulario para ver la vista previa.</p>
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
                    <p className="text-gray-700 text-sm">{form.description}</p>
                  </div>
                )}
                {hasContent && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contenido</h4>
                    <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: form.content }} />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Archivo</h4>
                  {file ? <p className="text-sm text-fuchsia-600">📎 {file.name}</p> : <p className="text-sm text-gray-400">Sin archivo</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}