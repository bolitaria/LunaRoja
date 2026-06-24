import api from '../../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ReportPreview({ title, description, file, currentFileUrl }) {
  const existingFile = currentFileUrl && !file;
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span>📄</span> Vista previa
      </h3>
      {!title ? (
        <p className="text-gray-400 text-sm">Completa el formulario para ver la vista previa.</p>
      ) : (
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Título</h4>
            <p className="text-gray-800 font-semibold">{title}</p>
          </div>
          {description && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Descripción</h4>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{description}</p>
            </div>
          )}
          <div>
            <h4 className="text-sm font-medium text-gray-500">Archivo</h4>
            {file ? (
              <p className="text-sm text-fuchsia-600">📎 {file.name} (nuevo)</p>
            ) : existingFile ? (
              <p className="text-sm text-blue-600 underline">
                <a href={currentFileUrl} target="_blank" rel="noopener noreferrer">
                  Ver archivo actual
                </a>
              </p>
            ) : (
              <p className="text-sm text-gray-400">Sin archivo adjunto</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditReport() {
  const router = useRouter();
  const { id } = router.query;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currentFileUrl, setCurrentFileUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      try {
        const res = await api.get(`/reports/${id}`);
        const report = res.data;
        setTitle(report.title || '');
        setDescription(report.description || '');
        setCurrentFileUrl(report.fileUrl || null);
      } catch (error) {
        toast.error('No se pudo cargar el reporte');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning('El título es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      if (file) formData.append('file', file);

      await api.put(`/reports/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Reporte actualizado');
      router.push('/admin/reports');
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error(error.response?.data?.message || 'No se pudo actualizar el reporte');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AdminLayout title="Editar Reporte"><p className="text-center py-8">Cargando reporte...</p></AdminLayout>;
  }

  return (
    <AdminLayout title="Editar Reporte">
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Formulario (izquierda) */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">Editar Reporte</h2>

          <div className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Archivo actual</label>
              {currentFileUrl ? (
                <p className="text-sm text-blue-600">
                  <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    Ver archivo actual
                  </a>
                </p>
              ) : (
                <p className="text-sm text-gray-500">No hay archivo adjunto</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo archivo (opcional)</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100"
              />
              <p className="text-xs text-gray-400 mt-1">Deja vacío para conservar el archivo actual</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
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

        {/* Vista previa (derecha) */}
        <div className="lg:w-1/3">
          <ReportPreview
            title={title}
            description={description}
            file={file}
            currentFileUrl={currentFileUrl}
          />
        </div>
      </div>
    </AdminLayout>
  );
}