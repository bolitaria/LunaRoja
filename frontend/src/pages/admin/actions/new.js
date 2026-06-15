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
    campaignId: '',
    documentLink: '',
  });
  const [groups, setGroups] = useState([]); // { platform: 'whatsapp', link: '' }
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
          headers: { Authorization: `Bearer ${token}` },
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
      reader.onloadend = () => setFeaturedImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const total = imageFiles.length + files.length;
    if (total > 20) {
      toast.warning(`Máximo 20 imágenes. Ya tienes ${imageFiles.length}.`);
      return;
    }
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Grupos dinámicos
  const addGroup = () => setGroups([...groups, { platform: 'whatsapp', link: '' }]);
  const removeGroup = (index) => setGroups(groups.filter((_, i) => i !== index));
  const updateGroup = (index, field, value) => {
    const updated = [...groups];
    updated[index][field] = value;
    setGroups(updated);
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
      // Añadir grupos como JSON string
      formData.append('groups', JSON.stringify(groups));
      if (featuredImageFile) formData.append('featuredImage', featuredImageFile);
      imageFiles.forEach(file => formData.append('images', file));
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/actions`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
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
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 space-y-5">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
          </div>
          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
          </div>
          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <select name="category" value={form.category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaña relacionada</label>
            <select name="campaignId" value={form.campaignId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
              <option value="">-- Ninguna --</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {/* Fecha y hora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora *</label>
            <input type="datetime-local" name="datetime" value={form.datetime} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
          </div>
          {/* Tipo de ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de ubicación</label>
            <select name="locationType" value={form.locationType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>

          {form.locationType === 'online' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enlace de registro *</label>
                <input type="url" name="registrationLink" value={form.registrationLink} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enlace online (para acceder)</label>
                <input type="url" name="onlineLink" value={form.onlineLink} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>
            </>
          )}

          {form.locationType === 'presencial' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del lugar</label>
                <input type="text" name="placeName" value={form.placeName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                <div className="flex gap-2">
                  <input type="text" name="address" value={form.address} onChange={handleChange} required className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
                  <button type="button" onClick={openGoogleMaps} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Ver en mapa</button>
                </div>
              </div>
            </>
          )}

          {/* URL de grabación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de grabación</label>
            <input type="url" name="recordingUrl" value={form.recordingUrl} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
          </div>

          {/* En vivo */}
          <div className="flex items-center">
            <input type="checkbox" name="isLive" checked={form.isLive} onChange={handleChange} className="mr-2" />
            <span className="text-sm text-gray-700">En vivo (mostrar como próximo)</span>
          </div>

          {/* Grupos de mensajería */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grupos de mensajería (WhatsApp, Telegram, Signal)</label>
            {groups.map((group, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <select
                  value={group.platform}
                  onChange={(e) => updateGroup(idx, 'platform', e.target.value)}
                  className="px-2 py-1 border rounded"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="signal">Signal</option>
                </select>
                <input
                  type="url"
                  placeholder="https://..."
                  value={group.link}
                  onChange={(e) => updateGroup(idx, 'link', e.target.value)}
                  className="flex-1 px-3 py-1 border rounded"
                />
                <button type="button" onClick={() => removeGroup(idx)} className="text-red-600 hover:text-red-800">✕</button>
              </div>
            ))}
            <button type="button" onClick={addGroup} className="text-blue-600 text-sm hover:underline">+ Añadir grupo</button>
          </div>

          {/* Documentación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📁 Enlace a documentación (Dropbox, Drive…)</label>
            <input type="url" name="documentLink" value={form.documentLink} onChange={handleChange} placeholder="https://drive.google.com/..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" />
          </div>

          {/* Imagen destacada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen destacada (opcional)</label>
            <input type="file" accept="image/*" onChange={handleFeaturedImageChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            {featuredImagePreview && <img src={featuredImagePreview} alt="Preview" className="mt-2 max-h-40 rounded-lg" />}
          </div>

          {/* Galería */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Galería (máx. 20, opcional)</label>
            <input type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img src={src} alt={`Preview ${idx}`} className="h-20 w-20 object-cover rounded" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
            {loading ? 'Guardando...' : 'Crear Acción'}
          </button>
        </form>

        <div className="lg:w-1/3">
          <ActionPreview form={form} featuredImage={featuredImagePreview} images={imagePreviews} />
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(NewAction);