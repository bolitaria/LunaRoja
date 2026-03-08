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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchCampaign = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const { name, description, color, imageUrl } = res.data;
          setForm({ name, description, color: color || '#ff0000' });
          setCurrentImageUrl(imageUrl);
          if (imageUrl) {
            setImagePreview(`${process.env.NEXT_PUBLIC_BASE_URL}${imageUrl}`);
          }
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('color', form.color);
      if (imageFile) {
        formData.append('image', imageFile);
      }
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${id}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
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
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Imagen de la campaña</label>
          {currentImageUrl && !imageFile && (
            <div className="mb-2">
              <img src={`${process.env.NEXT_PUBLIC_BASE_URL}${currentImageUrl}`} alt="Actual" className="max-h-40 rounded" />
              <p className="text-sm text-gray-500">Imagen actual. Si subes una nueva, se reemplazará.</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 border rounded"
          />
          {imagePreview && imageFile && (
            <img src={imagePreview} alt="Preview" className="mt-2 max-h-40 rounded" />
          )}
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