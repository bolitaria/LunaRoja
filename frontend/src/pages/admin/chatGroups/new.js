import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaSave } from 'react-icons/fa';

export default function NewChatGroup() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    platform: 'whatsapp',
    link: '',
    region: '',
    isPublic: true,        // true = público, false = privado
    isActive: true,
    associationType: '',   // '' = general, 'campaign', 'bds', 'action'
    campaignId: '',
    bdsId: '',
    actionId: '',
  });
  const [campaigns, setCampaigns] = useState([]);
  const [bds, setBds] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campRes, bdsRes, actRes] = await Promise.all([
          api.get('/campaigns'),
          api.get('/bds'),
          api.get('/actions'),
        ]);
        setCampaigns(campRes.data);
        setBds(bdsRes.data);
        setActions(actRes.data);
      } catch (error) {
        toast.error('Error al cargar datos auxiliares');
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Limpiar los IDs de asociación cuando se cambia el tipo
      ...(name === 'associationType' && { campaignId: '', bdsId: '', actionId: '' }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.link) {
      toast.warning('Nombre y enlace son obligatorios');
      return;
    }
    setLoading(true);
    try {
      await api.post('/chat-groups', {
        name: form.name,
        description: form.description,
        platform: form.platform,
        link: form.link,
        region: form.region || null,
        isPublic: form.isPublic,
        isActive: form.isActive,
        // Solo enviamos el ID de la asociación elegida
        campaignId: form.associationType === 'campaign' ? form.campaignId : null,
        bdsId: form.associationType === 'bds' ? form.bdsId : null,
        actionId: form.associationType === 'action' ? form.actionId : null,
      });
      toast.success('Grupo creado correctamente');
      router.push('/admin/chatGroups');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Nuevo Grupo de Chat">
      <ToastContainer />
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FaPlus className="text-fuchsia-600" />
          Crear grupo de chat
        </h2>

        {/* Fila 1: Nombre y Plataforma */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Nombre del grupo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma *</label>
            <select
              name="platform"
              value={form.platform}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="signal">Signal</option>
            </select>
          </div>
        </div>

        {/* Fila 2: Enlace y Región */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enlace *</label>
            <input
              type="url"
              name="link"
              value={form.link}
              onChange={handleChange}
              required
              placeholder="https://chat.whatsapp.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Región (opcional)</label>
            <input
              type="text"
              name="region"
              value={form.region}
              onChange={handleChange}
              placeholder="Ej. Barcelona, Global..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
        </div>

        {/* Descripción (ancho completo) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="3"
            placeholder="Describe brevemente el propósito del grupo..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
          />
        </div>

        {/* Fila 3: Visibilidad y Asociación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibilidad</label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isPublic"
                  value={true}
                  checked={form.isPublic === true}
                  onChange={() => setForm({ ...form, isPublic: true })}
                  className="text-fuchsia-600 focus:ring-fuchsia-500"
                />
                <span className="text-sm text-gray-700">Público</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isPublic"
                  value={false}
                  checked={form.isPublic === false}
                  onChange={() => setForm({ ...form, isPublic: false })}
                  className="text-fuchsia-600 focus:ring-fuchsia-500"
                />
                <span className="text-sm text-gray-700">Privado</span>
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {form.isPublic ? 'Visible en la web pública para todos.' : 'Solo visible para administradores.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asociar a</label>
            <select
              name="associationType"
              value={form.associationType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            >
              <option value="">General (sin asociar)</option>
              <option value="campaign">Campaña</option>
              <option value="bds">Campaña BDS</option>
              <option value="action">Acción</option>
            </select>
          </div>
        </div>

        {/* Selector dinámico según asociación */}
        {form.associationType === 'campaign' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecciona Campaña</label>
            <select
              name="campaignId"
              value={form.campaignId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            >
              <option value="">Elige una campaña</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        {form.associationType === 'bds' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecciona Campaña BDS</label>
            <select
              name="bdsId"
              value={form.bdsId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            >
              <option value="">Elige una campaña BDS</option>
              {bds.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
        {form.associationType === 'action' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecciona Acción</label>
            <select
              name="actionId"
              value={form.actionId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            >
              <option value="">Elige una acción</option>
              {actions.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Estado activo */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            className="rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
          />
          <label className="text-sm text-gray-700">Grupo activo (aparecerá en listados)</label>
        </div>

        {/* Botón crear mejorado */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-fuchsia-700 hover:to-purple-700 disabled:opacity-50 transition-all text-lg font-medium shadow-md hover:shadow-lg"
        >
          <FaSave className="w-5 h-5" />
          {loading ? 'Creando grupo...' : 'Crear grupo de chat'}
        </button>
      </form>
    </AdminLayout>
  );
}