import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../../components/AdminLayout';
import { withAuth } from '../../../lib/auth';
import { toast } from 'react-toastify';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validar que si es presencial, la dirección sea obligatoria
    if (form.locationType === 'presencial' && !form.address.trim()) {
      toast.error('La dirección es obligatoria para acciones presenciales');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/actions`, form, {
        headers: { Authorization: `Bearer ${token}` }
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
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-2xl">
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
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Enlace online</label>
            <input
              type="url"
              name="onlineLink"
              value={form.onlineLink}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        )}
        {form.locationType === 'presencial' && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Nombre del lugar (opcional)</label>
              <input
                type="text"
                name="placeName"
                value={form.placeName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Dirección *</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                required={form.locationType === 'presencial'}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </>
        )}
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
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Crear Acción'}
        </button>
      </form>
    </AdminLayout>
  );
}

export default withAuth(NewAction);