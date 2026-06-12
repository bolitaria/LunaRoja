import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import { withAuth } from '../../../lib/auth';
import { toast } from 'react-toastify';
import ActionPreview from '../../../components/ActionPreview';

function NewAction() {
  const router = useRouter();
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
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCampaigns(res.data);
      } catch (error) {
        toast.error('Error al cargar campañas');
      }
    };
    fetchCampaigns();
  }, []);

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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const total = imageFiles.length + files.length;
    if (total > 20) {
      toast.warning(`Máximo 20 imágenes en total. Ya tienes ${imageFiles.length} seleccionadas.`);
      return;
    }
    setImageFiles(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const openGoogleMaps = () => {
    if (form.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.address)}`, '_blank');
    } else {
      window.open('https://www.google.com/maps', '_blank');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que si es online, el enlace de registro sea obligatorio
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
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/actions`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Acción creada');
      router.push('/admin/actions');
    } catch (error) {
      toast.error('Error al crear acción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Nueva Acción">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md lg:w-2/3">
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
                <label className="block text-gray-700 mb-2">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    className="flex-1 px-3 py-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={openGoogleMaps}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Ver en mapa
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Puedes buscar la ubicación en Google Maps y copiar la dirección aquí.
                </p>
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Enlace de registro (opcional, ya cubierto)</label>
            <input
              type="url"
              name="registrationLink"
              value={form.registrationLink}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">URL de grabación</label>
            <input
              type="url"
              name="recordingUrl"
              value={form.recordingUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
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
            <label className="block text-gray-700 mb-2">Imagen destacada (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFeaturedImageChange}
              className="w-full px-3 py-2 border rounded"
            />
            {featuredImagePreview && (
              <img src={featuredImagePreview} alt="Preview destacada" className="mt-2 max-h-40 rounded" />
            )}
          </div>

          {/* Galería de imágenes */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Galería (máx. 20, opcional)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full px-3 py-2 border rounded"
            />
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img src={src} alt={`Preview ${idx}`} className="h-20 w-20 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
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
            {loading ? 'Guardando...' : 'Crear Acción'}
          </button>
        </form>

        {/* Vista previa */}
        <div className="lg:w-1/3">
          <ActionPreview
            form={form}
            featuredImage={featuredImagePreview}
            images={imagePreviews}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(NewAction);