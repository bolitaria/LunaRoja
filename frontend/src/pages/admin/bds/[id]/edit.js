import api from '../../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EditBDS() {
  const router = useRouter();
  const { id } = router.query;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/bds/${id}`).then(res => {
      setName(res.data.name || '');
      setDescription(res.data.description || '');
    }).catch(() => toast.error('Error al cargar BDS')).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.warning('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      await api.put(`/bds/${id}`, { name: name.trim(), description: description.trim() });
      toast.success('BDS actualizada');
      router.push('/admin/bds');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar BDS');
    } finally { setSaving(false); }
  };

  if (loading) return <AdminLayout title="Editar BDS"><p className="text-center py-8">Cargando...</p></AdminLayout>;

  return (
    <AdminLayout title="Editar BDS">
      <ToastContainer />
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Editar BDS</h2>
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
        <button type="submit" disabled={saving} className="mt-6 w-full bg-fuchsia-600 text-white py-2 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors">
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </AdminLayout>
  );
}