import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../../../components/AdminLayout';
import { withAuth } from '../../../../lib/auth';
import { toast } from 'react-toastify';

const PRESET_COLORS = [
  '#E53E3E', '#DD6B20', '#D69E2E', '#38A169', '#319795', '#3182CE', '#805AD5', '#D53F8C',
  '#718096', '#2D3748', '#F56565', '#ED8936', '#F6E05E', '#48BB78', '#4FD1C5', '#63B3ED',
];

function EditCampaign() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#E53E3E',
    documentLink: '',
  });
  const [groups, setGroups] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCustomColor, setShowCustomColor] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchCampaign = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const campaign = res.data;
        setForm({
          name: campaign.name,
          description: campaign.description || '',
          color: campaign.color || '#E53E3E',
          documentLink: campaign.documentLink || '',
        });
        if (campaign.groups) {
          const parsed = Array.isArray(campaign.groups) ? campaign.groups : JSON.parse(campaign.groups || '[]');
          setGroups(parsed);
        }
        if (campaign.imageUrl) {
          setCurrentImage(campaign.imageUrl);
          setImagePreview(`${process.env.NEXT_PUBLIC_BASE_URL}${campaign.imageUrl}`);
        }
      } catch (error) {
        toast.error('Error al cargar campaña');
      }
    };
    fetchCampaign();
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Grupos
  const addGroup = () => setGroups([...groups, { platform: 'whatsapp', link: '' }]);
  const removeGroup = (index) => setGroups(groups.filter((_, i) => i !== index));
  const updateGroup = (index, field, value) => {
    const updated = [...groups];
    updated[index][field] = value;
    setGroups(updated);
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
      formData.append('documentLink', form.documentLink);
      formData.append('groups', JSON.stringify(groups));
      if (imageFile) formData.append('image', imageFile);
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Campaña actualizada');
      router.push('/admin/campaigns');
    } catch (error) {
      toast.error('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Editar Campaña">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm max-w-2xl space-y-5">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
        </div>
        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color de etiqueta</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, color })}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  form.color === color ? 'border-gray-800 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <button
              type="button"
              onClick={() => setShowCustomColor(!showCustomColor)}
              className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 hover:bg-gray-100"
              title="Color personalizado"
            >
              +
            </button>
          </div>
          {showCustomColor && (
            <input
              type="color"
              name="color"
              value={form.color}
              onChange={handleChange}
              className="mt-2 w-12 h-10 p-1 border rounded"
            />
          )}
        </div>

        {/* Imagen actual + nueva */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de la campaña</label>
          {currentImage && !imageFile && (
            <div className="mb-2">
              <img src={`${process.env.NEXT_PUBLIC_BASE_URL}${currentImage}`} alt="Actual" className="max-h-40 rounded-lg" />
              <p className="text-sm text-gray-500">Imagen actual. Sube una nueva para reemplazar.</p>
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          {imagePreview && imageFile && <img src={imagePreview} alt="Preview" className="mt-2 max-h-40 rounded-lg" />}
        </div>

        {/* Grupos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grupos de mensajería</label>
          {groups.map((group, idx) => (
            <div key={idx} className="flex gap-2 mb-2 items-center">
              <select value={group.platform} onChange={(e) => updateGroup(idx, 'platform', e.target.value)} className="px-2 py-1 border rounded">
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="signal">Signal</option>
              </select>
              <input type="url" placeholder="https://..." value={group.link} onChange={(e) => updateGroup(idx, 'link', e.target.value)} className="flex-1 px-3 py-1 border rounded" />
              <button type="button" onClick={() => removeGroup(idx)} className="text-red-600 hover:text-red-800">✕</button>
            </div>
          ))}
          <button type="button" onClick={addGroup} className="text-blue-600 text-sm hover:underline">+ Añadir grupo</button>
        </div>

        {/* Documentación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">📁 Enlace a documentación</label>
          <input type="url" name="documentLink" value={form.documentLink} onChange={handleChange} placeholder="https://drive.google.com/..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
        </div>

        <button type="submit" disabled={loading} className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
          {loading ? 'Guardando...' : 'Actualizar Campaña'}
        </button>
      </form>
    </AdminLayout>
  );
}

export default withAuth(EditCampaign);