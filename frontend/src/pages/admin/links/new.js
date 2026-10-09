import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import api from '../../../lib/axios';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft } from 'react-icons/fa';
import { LINK_REGIONS } from '../../../utils/linkRegions';

export default function NewLink() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    url: '',
    description: '',
    category: 'local',
    region: '',
    active: true,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Si cambia de categoría, resetear region salvo que sea internacional
      ...(name === 'category' && value !== 'internacional' && { region: '' }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.url) {
      toast.warning('Título y URL son obligatorios');
      return;
    }
    setLoading(true);
    try {
      await api.post('/links', form);
      toast.success('Enlace creado');
      router.push('/admin/links');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear enlace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Nuevo Enlace">
      <ToastContainer />
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/links" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <FaArrowLeft /> Volver a Enlaces
        </Link>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-xl font-semibold text-gray-800">Nuevo enlace de interés</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Ej. BDS Movement"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
            <input
              type="url"
              name="url"
              value={form.url}
              onChange={handleChange}
              required
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              placeholder="Breve descripción del enlace..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500"
              >
                <option value="local">Local</option>
                <option value="nacional">Nacional</option>
                <option value="europeo">Europeo</option>
                <option value="internacional">Internacional</option>
                <option value="literatura">Literatura</option>
                <option value="bibliografia">Bibliografía</option>
              </select>
            </div>

            {form.category === 'internacional' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
                <select
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-0 focus:border-fuchsia-500"
                >
                  <option value="">Sin especificar</option>
                  {LINK_REGIONS.map(r => (
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
              className="rounded border-gray-300 text-fuchsia-600 focus:ring-0"
            />
            <span className="text-sm text-gray-700">Activo</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition font-medium"
          >
            {loading ? 'Creando...' : 'Crear enlace'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
