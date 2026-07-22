import api from '../../../lib/axios';
import { useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CampaignPreview from '../../../components/CampaignPreview';
import { FaEye, FaTimes, FaEdit } from 'react-icons/fa';

export default function NewBDS() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#E53E3E');
  const [publicGroups, setPublicGroups] = useState([]);
  const [privateGroups, setPrivateGroups] = useState([]);
  const [documentLink, setDocumentLink] = useState('');
  const [privateLink, setPrivateLink] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [publicDocFile, setPublicDocFile] = useState(null);   // 🆕 archivo público
  const [privateDocFile, setPrivateDocFile] = useState(null); // archivo privado
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePublicDocChange = (e) => setPublicDocFile(e.target.files[0]);
  const handlePrivateDocChange = (e) => setPrivateDocFile(e.target.files[0]);

  // Grupos públicos
  const addPublicGroup = () => setPublicGroups([...publicGroups, { platform: 'whatsapp', link: '' }]);
  const removePublicGroup = (index) => setPublicGroups(publicGroups.filter((_, i) => i !== index));
  const updatePublicGroup = (index, field, value) => {
    const updated = [...publicGroups];
    updated[index][field] = value;
    setPublicGroups(updated);
  };

  // Grupos privados
  const addPrivateGroup = () => setPrivateGroups([...privateGroups, { platform: 'whatsapp', link: '' }]);
  const removePrivateGroup = (index) => setPrivateGroups(privateGroups.filter((_, i) => i !== index));
  const updatePrivateGroup = (index, field, value) => {
    const updated = [...privateGroups];
    updated[index][field] = value;
    setPrivateGroups(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('El nombre es obligatorio');
      return;
    }
    setLoading(true);
    try {
      const allGroups = [
        ...publicGroups.map(g => ({ ...g, isPublic: true })),
        ...privateGroups.map(g => ({ ...g, isPublic: false })),
      ];

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('color', color);
      formData.append('groups', JSON.stringify(allGroups));
      formData.append('documentLink', documentLink.trim());
      formData.append('privateLink', privateLink.trim());
      if (imageFile) formData.append('image', imageFile);
      if (publicDocFile) formData.append('publicDocument', publicDocFile); // archivo público
      if (privateDocFile) formData.append('privateDocument', privateDocFile); // archivo privado

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

  const previewImage = imagePreview || null;

  return (
    <AdminLayout title="Nueva Campaña BDS">
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 space-y-6">
          {/* 🌍 ZONA PÚBLICA */}
          <div className="border-l-2 border-green-500 pl-4 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <span>🌍</span> Información pública
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color de etiqueta</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 border border-gray-300 rounded cursor-pointer" />
                  <span className="text-sm text-gray-500">{color}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de la campaña</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer" />
              </div>

              {/* 🆕 ARCHIVO DESCARGABLE PÚBLICO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento descargable (público)</label>
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={handlePublicDocChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer" />
                <p className="text-xs text-gray-400 mt-1">Este archivo estará disponible para cualquier visitante.</p>
              </div>

              {/* GRUPOS PÚBLICOS */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2"><span>💬</span> Grupos de chat públicos</h3>
                <p className="text-xs text-gray-400 mb-2">Estos grupos se mostrarán en la página pública para que los usuarios se unan.</p>
                {publicGroups.map((group, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <select value={group.platform} onChange={(e) => updatePublicGroup(idx, 'platform', e.target.value)} className="px-2 py-1 border rounded-lg focus:ring-2 focus:ring-fuchsia-500">
                      <option value="whatsapp">WhatsApp</option>
                      <option value="telegram">Telegram</option>
                      <option value="signal">Signal</option>
                    </select>
                    <input type="url" placeholder="https://..." value={group.link} onChange={(e) => updatePublicGroup(idx, 'link', e.target.value)} className="flex-1 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
                    <button type="button" onClick={() => removePublicGroup(idx)} className="text-red-600 hover:text-red-800">✕</button>
                  </div>
                ))}
                <button type="button" onClick={addPublicGroup} className="text-fuchsia-600 text-sm hover:underline flex items-center gap-1"><span>+</span> Añadir grupo público</button>
              </div>
            </div>
          </div>

          {/* 🔒 ZONA PRIVADA */}
          <div className="border-l-2 border-rose-400 pl-4 mt-8 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <span>🔒</span> Área privada de administración
            </h2>
            <div className="space-y-4">
              {/* GRUPOS PRIVADOS */}
              <div>
                <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2"><span>🔐</span> Grupos internos (privados)</h3>
                <p className="text-xs text-gray-400 mb-2">Solo visibles para administradores.</p>
                {privateGroups.map((group, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <select value={group.platform} onChange={(e) => updatePrivateGroup(idx, 'platform', e.target.value)} className="px-2 py-1 border rounded-lg focus:ring-2 focus:ring-fuchsia-500">
                      <option value="whatsapp">WhatsApp</option>
                      <option value="telegram">Telegram</option>
                      <option value="signal">Signal</option>
                    </select>
                    <input type="url" placeholder="https://..." value={group.link} onChange={(e) => updatePrivateGroup(idx, 'link', e.target.value)} className="flex-1 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
                    <button type="button" onClick={() => removePrivateGroup(idx)} className="text-red-600 hover:text-red-800">✕</button>
                  </div>
                ))}
                <button type="button" onClick={addPrivateGroup} className="text-fuchsia-600 text-sm hover:underline flex items-center gap-1"><span>+</span> Añadir grupo privado</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento externo (enlace)</label>
                <input type="url" value={documentLink} onChange={(e) => setDocumentLink(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
              </div>

              {/* Archivo privado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento (archivo) privado</label>
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={handlePrivateDocChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer" />
                <p className="text-xs text-gray-400 mt-1">Solo accesible por administradores.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enlace a zona privada (opcional)</label>
                <input type="url" value={privateLink} onChange={(e) => setPrivateLink(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
                <p className="text-xs text-gray-400 mt-1">Solo visible para administradores.</p>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-fuchsia-600 text-white px-5 py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors font-medium">
            {loading ? 'Creando...' : 'Crear Campaña BDS'}
          </button>
        </form>

        {/* Botón de vista previa */}
        <div className="lg:w-1/3 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition font-medium shadow-sm"
          >
            <FaEye className="text-fuchsia-600" /> Vista previa pública
          </button>
        </div>
      </div>

      {/* MODAL VISTA PREVIA */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-700">Vista previa pública</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600 text-xl"><FaTimes /></button>
            </div>
            <div className="p-4">
              <CampaignPreview
                name={name || 'Nombre de la campaña'}
                description={description}
                color={color}
                image={previewImage}
                groups={[...publicGroups.map(g => ({ ...g, isPublic: true }))]}
                documents={[]}
                privateLink={null}
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cerrar</button>
              {/* No hay edición porque es nuevo */}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}