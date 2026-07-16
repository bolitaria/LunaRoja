import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import api from '../../../lib/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function NewLink() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    url: '',
    description: '',
    category: 'local',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6 mt-4">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Nuevo enlace de interés</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
            <input type="url" name="url" value={form.url} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="input-field" rows="3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select name="category" value={form.category} onChange={handleChange} className="input-field">
              <option value="local">Local</option>
              <option value="nacional">Nacional</option>
              <option value="europeo">Europeo</option>
              <option value="internacional">Internacional</option>
              <option value="literatura">Literatura</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Creando...' : 'Crear enlace'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}