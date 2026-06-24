import api from '../../../lib/axios';
import { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function NewBDS() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.warning('El nombre es obligatorio'); return; }
    setLoading(true);
    try {
      await api.post('/bds', { name: name.trim(), description: description.trim() });
      toast.success('BDS creada');
      router.push('/admin/bds');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear BDS');
    } finally { setLoading(false); }
  };

  return (
    <AdminLayout title="Nueva BDS">
      <ToastContainer />
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Crear BDS</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="mt-6 w-full bg-fuchsia-600 text-white py-2 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors">
          {loading ? 'Creando...' : 'Crear BDS'}
        </button>
      </form>
    </AdminLayout>
  );
}