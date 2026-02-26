import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../../../components/AdminLayout';
import { withAuth } from '../../../../lib/auth';
import { toast } from 'react-toastify';

function EditCampaign() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#ff0000'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchCampaign = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const { name, description, color } = res.data;
          setForm({ name, description, color: color || '#ff0000' });
        } catch (error) {
          toast.error('Error al cargar campaña');
        }
      };
      fetchCampaign();
    }
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Campaña actualizada');
      router.push('/admin/campaigns');
    } catch (error) {
      toast.error('Error al actualizar campaña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Editar Campaña">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Nombre *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Descripción</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Color de etiqueta</label>
          <input
            type="color"
            name="color"
            value={form.color}
            onChange={handleChange}
            className="w-full h-10 p-1 border rounded"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Actualizar Campaña'}
        </button>
      </form>
    </AdminLayout>
  );
}

export default withAuth(EditCampaign);