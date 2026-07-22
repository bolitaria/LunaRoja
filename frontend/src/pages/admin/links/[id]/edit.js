import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import api from '../../../../lib/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEye, FaTimes } from 'react-icons/fa';

export default function EditLink() {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState({
    title: '',
    url: '',
    description: '',
    category: 'local',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/links/${id}`)
      .then(res => {
        const link = res.data;
        setForm({
          title: link.title || '',
          url: link.url || '',
          description: link.description || '',
          category: link.category || 'local',
          active: link.active,
        });
      })
      .catch(() => toast.error('Error al cargar el enlace'))
      .finally(() => setFetching(false));
  }, [id]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.url) {
      toast.warning('Título y URL son obligatorios');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/links/${id}`, form);
      toast.success('Enlace actualizado');
      router.push('/admin/links');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <AdminLayout title="Editar Enlace"><p className="text-center py-10">Cargando...</p></AdminLayout>;
  }

  const preview = {
    title: form.title || 'Título de ejemplo',
    url: form.url || '#',
    description: form.description || 'Descripción breve del enlace.',
    category: form.category,
  };

  return (
    <AdminLayout title="Editar Enlace">
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 lg:w-2/3 space-y-6 p-6">
          <h2 className="text-xl font-semibold text-gray-700">Editar enlace</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
            <input type="url" name="url" value={form.url} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select name="category" value={form.category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500">
              <option value="local">Local</option>
              <option value="nacional">Nacional</option>
              <option value="europeo">Europeo</option>
              <option value="internacional">Internacional</option>
              <option value="literatura">Literatura</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} className="rounded border-gray-300 text-fuchsia-600 focus:ring-0" />
            <span className="text-sm text-gray-700">Activo</span>
          </div>

          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition font-medium">
            {loading ? 'Guardando...' : 'Actualizar Enlace'}
          </button>
        </form>

        {/* Botón de vista previa */}
        <div className="lg:w-1/3 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition font-medium shadow-sm"
          >
            <FaEye className="text-fuchsia-600" /> Vista previa pública
          </button>
        </div>
      </div>

      {/* Modal vista previa */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end p-2">
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-xl"><FaTimes /></button>
            </div>
            <div className="px-4 pb-6">
              <div className="block p-4 bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition">
                <h3 className="font-semibold text-gray-800">{preview.title}</h3>
                {preview.description && <p className="text-sm text-gray-600 mt-1">{preview.description}</p>}
                <div className="mt-2 text-xs text-gray-500">
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{preview.category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}