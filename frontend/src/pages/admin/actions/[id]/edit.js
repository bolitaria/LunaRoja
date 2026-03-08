import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../../../components/AdminLayout';
import { withAuth } from '../../../../lib/auth';
import { toast } from 'react-toastify';

function EditAction() {
  const router = useRouter();
  const { id } = router.query;
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'protest',
    datetime: '',
    locationType: 'online',
    onlineLink: '',
    placeName: '',
    address: '',
    registrationLink: '',
    recordingUrl: '',
    isLive: true,
    campaignId: ''
  });
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState(null);
  const [currentFeaturedImage, setCurrentFeaturedImage] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          const token = localStorage.getItem('token');
          const [actionRes, campaignsRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);
          const action = actionRes.data;
          setForm({
            title: action.title,
            description: action.description || '',
            category: action.category,
            datetime: action.datetime.slice(0, 16),
            locationType: action.locationType || 'online',
            onlineLink: action.onlineLink || '',
            placeName: action.placeName || '',
            address: action.address || '',
            registrationLink: action.registrationLink || '',
            recordingUrl: action.recordingUrl || '',
            isLive: action.isLive,
            campaignId: action.campaignId || ''
          });
          setCurrentFeaturedImage(action.featuredImage);
          if (action.featuredImage) {
            setFeaturedImagePreview(`${process.env.NEXT_PUBLIC_BASE_URL}${action.featuredImage}`);
          }
          setExistingImages(action.images || []);
          setCampaigns(campaignsRes.data);
        } catch (error) {
          toast.error('Error al cargar datos');
        }
      };
      fetchData();
    }
  }, [id]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleFeaturedImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFeaturedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeaturedImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    const total = newImageFiles.length + files.length;
    if (total > 20) {
      toast.warning(`Máximo 20 imágenes en total. Ya tienes ${newImageFiles.length} nuevas seleccionadas.`);
      return;
    }
    setNewImageFiles(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setNewImagePreviews(prev => [...prev, ...previews]);
  };

  const removeNewImage = (index) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/actions/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Imagen eliminada');
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      toast.error('Error al eliminar imagen');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que si es online, registrationLink sea obligatorio
    if (form.locationType === 'online' && !form.registrationLink.trim()) {
      toast.error('El enlace de registro es obligatorio para eventos online');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== undefined && form[key] !== '') {
          formData.append(key, form[key]);
        }
      });
      if (featuredImageFile) {
        formData.append('featuredImage', featuredImageFile);
      }
      newImageFiles.forEach(file => {
        formData.append('images', file);
      });
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/actions/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Acción actualizada');
      router.push('/admin/actions');
    } catch (error) {
      toast.error('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Editar Acción">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
        {/* Título */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Título *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* Descripción */}
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

        {/* Categoría */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Categoría *</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="webinar">Webinar</option>
            <option value="talk">Charla</option>
            <option value="protest">Manifestación</option>
            <option value="bds">Acción BDS</option>
            <option value="strike">Huelga</option>
            <option value="march">Marcha</option>
            <option value="solidarity_action">Acción Solidaria</option>
            <option value="workshop">Taller</option>
          </select>
        </div>

        {/* Campaña relacionada */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Campaña relacionada</label>
          <select
            name="campaignId"
            value={form.campaignId}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">-- Ninguna --</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Fecha y hora */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Fecha y hora *</label>
          <input
            type="datetime-local"
            name="datetime"
            value={form.datetime}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* Tipo de ubicación */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Tipo de ubicación</label>
          <select
            name="locationType"
            value={form.locationType}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="online">Online</option>
            <option value="presencial">Presencial</option>
          </select>
        </div>

        {/* Campos según ubicación */}
        {form.locationType === 'online' && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Enlace de registro <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                name="registrationLink"
                value={form.registrationLink}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Obligatorio para eventos online</p>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Enlace online (para acceder)</label>
              <input
                type="url"
                name="onlineLink"
                value={form.onlineLink}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Puedes añadirlo más tarde</p>
            </div>
          </>
        )}

        {form.locationType === 'presencial' && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Nombre del lugar</label>
              <input
                type="text"
                name="placeName"
                value={form.placeName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Dirección</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                required={form.locationType === 'presencial'}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Enlace de registro (opcional)</label>
              <input
                type="url"
                name="registrationLink"
                value={form.registrationLink}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </>
        )}

        {/* URL de grabación */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">URL de grabación (opcional)</label>
          <input
            type="url"
            name="recordingUrl"
            value={form.recordingUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* Checkbox en vivo */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isLive"
              checked={form.isLive}
              onChange={handleChange}
              className="mr-2"
            />
            <span>En vivo (mostrar como próximo)</span>
          </label>
        </div>

        {/* Imagen destacada */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Imagen destacada</label>
          {currentFeaturedImage && !featuredImageFile && (
            <div className="mb-2">
              <img
                src={`${process.env.NEXT_PUBLIC_BASE_URL}${currentFeaturedImage}`}
                alt="Actual"
                className="max-h-40 max-w-full rounded"
              />
              <p className="text-sm text-gray-500">Imagen actual. Si subes una nueva, se reemplazará.</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFeaturedImageChange}
            className="w-full px-3 py-2 border rounded"
          />
          {featuredImagePreview && featuredImageFile && (
            <img src={featuredImagePreview} alt="Preview destacada" className="mt-2 max-h-40 max-w-full rounded" />
          )}
        </div>

        {/* Imágenes existentes */}
        {existingImages.length > 0 && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Imágenes de galería actuales</label>
            <div className="grid grid-cols-4 gap-4">
              {existingImages.map(img => (
                <div key={img.id} className="relative">
                  <img
                    src={`${process.env.NEXT_PUBLIC_BASE_URL}${img.url}`}
                    alt="Existente"
                    className="h-20 w-20 object-cover rounded"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nuevas imágenes */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Añadir más imágenes a la galería (máx. 20 en total)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleNewImages}
            className="w-full px-3 py-2 border rounded"
          />
          {newImagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {newImagePreviews.map((src, idx) => (
                <div key={idx} className="relative">
                  <img src={src} alt={`Preview ${idx}`} className="h-20 w-20 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Actualizar Acción'}
        </button>
      </form>
    </AdminLayout>
  );
}

export default withAuth(EditAction);