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
      } catch (error) {
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
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('content', form.content);
      formData.append('type', form.type);
      formData.append('source', form.source.trim());
      formData.append('author', form.author.trim());
      if (form.file) formData.append('file', form.file);

      await api.put(`/reports/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Entrada actualizada');
      router.push('/admin/reports');
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error(error.response?.data?.message || 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminLayout title="Editar Entrada"><p className="text-center py-8">Cargando...</p></AdminLayout>;
  }

  // Sanitizar para vista previa
  const sanitizedContent = DOMPurify.sanitize(form.content);

  return (
    <AdminLayout title="Editar Entrada Blog/Reporte">
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">Editar Entrada</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select name="type" value={form.type} onChange={handleChange} className="w-full border p-2 rounded">
              <option value="blog">📝 Blog (interno)</option>
              <option value="report">📄 Reporte (externo)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} required className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido (editor enriquecido)</label>
            <ReactQuill
              theme="snow"
              value={form.content}
              onChange={handleContentChange}
              modules={quillModules}
              placeholder="Escribe el contenido..."
              className="bg-white"
            />
          </div>
          {form.type === 'report' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuente(s) oficial(es) *</label>
              <input name="source" value={form.source} onChange={handleChange} required className="w-full border p-2 rounded" placeholder="URL o nombre de la fuente" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
            <input name="author" value={form.author} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Archivo actual</label>
            {form.currentFileUrl ? (
              <p className="text-sm text-blue-600">
                <a href={form.currentFileUrl} target="_blank" rel="noopener noreferrer" className="underline">Ver archivo actual</a>
              </p>
            ) : (
              <p className="text-sm text-gray-500">No hay archivo adjunto</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo archivo (opcional)</label>
            <input type="file" name="file" onChange={handleChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors text-sm font-medium">
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={() => router.back()} className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              Cancelar
            </button>
          </div>
        </form>

        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <span>📄</span> Vista previa
            </h3>
            {!form.title ? (
              <p className="text-gray-400 text-sm">Completa el formulario para ver la vista previa.</p>
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
                  {form.source && <span className="text-xs text-gray-500">Fuente: {form.source}</span>}
                  {form.author && <span className="text-xs text-gray-500">✍️ {form.author}</span>}
                </div>
                {form.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Descripción</h4>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{form.description}</p>
                  </div>
                )}
                {form.content && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contenido</h4>
                    <div className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Archivo</h4>
                  {form.file ? (
                    <p className="text-sm text-fuchsia-600">📎 {form.file.name} (nuevo)</p>
                  ) : form.currentFileUrl ? (
                    <p className="text-sm text-blue-600 underline">
                      <a href={form.currentFileUrl} target="_blank" rel="noopener noreferrer">Ver archivo actual</a>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">Sin archivo adjunto</p>
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