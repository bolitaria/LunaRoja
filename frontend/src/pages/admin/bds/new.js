import api from '../../../lib/axios';
import { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CampaignPreview from '../../../components/CampaignPreview';

export default function NewBDS() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#E53E3E');
  const [groups, setGroups] = useState([]);
  const [documentLink, setDocumentLink] = useState('');
  const [privateLink, setPrivateLink] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const addGroup = () => setGroups([...groups, { platform: 'whatsapp', link: '' }]);
  const removeGroup = (index) => setGroups(groups.filter((_, i) => i !== index));
  const updateGroup = (index, field, value) => {
    const updated = [...groups];
    updated[index][field] = value;
    setGroups(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('El nombre es obligatorio');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('color', color);
      formData.append('groups', JSON.stringify(groups));
      formData.append('documentLink', documentLink.trim());
      formData.append('privateLink', privateLink.trim());
      if (imageFile) formData.append('image', imageFile);
      if (documentFile) formData.append('document', documentFile);

      await api.post('/bds', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Campaña BDS creada');
      router.push('/admin/bds');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear campaña BDS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Nueva Campaña BDS">
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 space-y-6">
          <h2 className="text-xl font-semibold mb-4">Crear Campaña BDS</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 border border-gray-300 rounded cursor-pointer" />
              <span className="text-sm text-gray-500">{color}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de la campaña</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grupos internos</label>
            {groups.map((group, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <select value={group.platform} onChange={(e) => updateGroup(idx, 'platform', e.target.value)} className="px-2 py-1 border rounded-lg focus:ring-2 focus:ring-fuchsia-500">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="signal">Signal</option>
                </select>
                <input type="url" placeholder="https://..." value={group.link} onChange={(e) => updateGroup(idx, 'link', e.target.value)} className="flex-1 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
                <button type="button" onClick={() => removeGroup(idx)} className="text-red-600 hover:text-red-800">✕</button>
              </div>
            ))}
            <button type="button" onClick={addGroup} className="text-fuchsia-600 text-sm hover:underline flex items-center gap-1">
              <span>+</span> Añadir grupo
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento externo (enlace)</label>
            <input type="url" value={documentLink} onChange={(e) => setDocumentLink(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento (archivo)</label>
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={(e) => setDocumentFile(e.target.files[0])} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enlace a zona privada (opcional)</label>
            <input type="url" value={privateLink} onChange={(e) => setPrivateLink(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
            <p className="text-xs text-gray-400 mt-1">Solo visible para administradores.</p>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-fuchsia-600 text-white py-2 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors">
            {loading ? 'Creando...' : 'Crear Campaña BDS'}
          </button>
        </form>

        <div className="lg:w-1/3">
          <CampaignPreview
            name={name}
            description={description}
            color={color}
            image={imagePreview}
            groups={groups}
            documents={documentLink ? [{ name: 'Documento', url: documentLink }] : []}
            privateLink={privateLink}
          />
        </div>
      </div>
    </AdminLayout>
  );
}