import api from '../../../lib/axios';
import { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

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

export default function NewReport() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.warning('El título es obligatorio');
      return;
    }
    if (!file && !content.trim()) {
      toast.warning('Debes escribir contenido o adjuntar un archivo');
      return;
    }

    setLoading(true);
    try {
      if (file) {
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('content', content);
        formData.append('file', file);

        await api.post('/reports', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/reports', {
          title: title.trim(),
          description: description.trim(),
          content,
        });
      }
      toast.success('Reporte creado correctamente');
      router.push('/admin/reports');
    } catch (error) {
      console.error('Error creating report:', error);
      toast.error(error.response?.data?.message || 'No se pudo crear el reporte');
    } finally {
      setLoading(false);
    }
  };

  const hasContent = content.trim().length > 0;
  const hasFile = file !== null;

  return (
    <AdminLayout title="Nuevo Reporte">
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">Crear Reporte</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción breve (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>

          {/* Sección de contenido escrito */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">✍️</span>
              <h3 className="font-medium text-gray-800">Escribir contenido del reporte</h3>
              {hasContent && <span className="text-xs text-green-600 ml-2">✓</span>}
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Puedes redactar el informe aquí con formato (negritas, listas, secciones).
            </p>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              placeholder="Escribe el contenido del reporte..."
              className="bg-white"
            />
          </div>

          {/* Sección de archivo */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📎</span>
              <h3 className="font-medium text-gray-800">Adjuntar archivo</h3>
              {hasFile && <span className="text-xs text-green-600 ml-2">✓</span>}
            </div>
            <p className="text-xs text-gray-500 mb-2">
              También puedes subir un documento PDF, Word o imagen. Se puede combinar con el texto de arriba.
            </p>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100"
            />
            {file && (
              <p className="mt-1 text-sm text-fuchsia-700">📄 {file.name}</p>
            )}
          </div>

          {/* Aviso de requisito */}
          {!hasContent && !hasFile && (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              ⚠️ Debes completar al menos uno de los campos: el contenido escrito o un archivo adjunto.
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {loading ? 'Creando...' : 'Crear Reporte'}
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
            {!title && !content && !file ? (
              <p className="text-gray-400 text-sm">Completa el formulario para ver la vista previa.</p>
            ) : (
              <div className="space-y-3">
                {title && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Título</h4>
                    <p className="text-gray-800 font-semibold">{title}</p>
                  </div>
                )}
                {hasContent && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contenido</h4>
                    <div
                      className="prose prose-sm max-w-none text-gray-700 ql-editor"
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Archivo</h4>
                  {file ? (
                    <p className="text-sm text-fuchsia-600">📎 {file.name}</p>
                  ) : (
                    <p className="text-sm text-gray-400">Sin archivo (se enviará solo el texto)</p>
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