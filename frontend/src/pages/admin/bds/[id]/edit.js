import api from '../../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/AdminLayout';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CampaignPreview from '../../../../components/CampaignPreview';
import DocumentManager from '../../../../components/DocumentManager';
import ColorPicker from '../../../../components/ColorPicker';
import { FaArrowLeft, FaTimes, FaLock } from 'react-icons/fa';

export default function EditBDS() {
  const router = useRouter();
  const { id } = router.query;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#E53E3E');
  const [publicGroups, setPublicGroups] = useState([]);
  const [privateGroups, setPrivateGroups] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [counters, setCounters] = useState({ subscriberCount: 0, actionCount: 0, urgentActionCount: 0 });
  const [imagePreview, setImagePreview] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [privateLink, setPrivateLink] = useState('');
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const baseUrl = '';

  useEffect(() => {
    if (!id) return;
    const fetchBDS = async () => {
      try {
        const res = await api.get(`/bds/${id}`);
        const bds = res.data;
        setName(bds.name || '');
        setPrivateLink(bds.privateLink || '');
        setDescription(bds.description || '');
        setColor(bds.color || '#E53E3E');
        const allGroups = bds.groups || [];
        setPublicGroups(allGroups.filter((g) => g.isPublic));
        setPrivateGroups(allGroups.filter((g) => !g.isPublic));
        if (bds.imageUrl) {
          setCurrentImage(bds.imageUrl);
          setImagePreview(bds.imageUrl);
        }
        setCounters({
          subscriberCount: bds.subscriberCount || 0,
          actionCount: bds.actionCount || 0,
          urgentActionCount: bds.urgentActionCount || 0,
        });
      } catch (error) {
        toast.error('Error al cargar la campaña BDS');
      } finally {
        setLoading(false);
      }
    };
    fetchBDS();
  }, [id, baseUrl]);

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

  const addPublicGroup = () => setPublicGroups([...publicGroups, { platform: 'whatsapp', link: '' }]);
  const removePublicGroup = (index) => setPublicGroups(publicGroups.filter((_, i) => i !== index));
  const updatePublicGroup = (index, field, value) => {
    const updated = [...publicGroups];
    updated[index][field] = value;
    setPublicGroups(updated);
  };

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
    setSaving(true);
    try {
      const allGroups = [
        ...publicGroups.map((g) => ({ ...g, isPublic: true })),
        ...privateGroups.map((g) => ({ ...g, isPublic: false })),
      ];

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('color', color);
      formData.append('groups', JSON.stringify(allGroups));
      formData.append('privateLink', privateLink || '');
      const newDocs = documents.filter(d => d.isNew);
      newDocs.forEach((doc, idx) => {
        formData.append(`documents[${idx}][name]`, doc.name);
        formData.append(`documents[${idx}][source]`, doc.source);
        formData.append(`documents[${idx}][visibility]`, doc.visibility);
        if (doc.source === 'upload' && doc.file) {
          formData.append(`documents[${idx}][file]`, doc.file);
        } else if (doc.source === 'link') {
          formData.append(`documents[${idx}][externalUrl]`, doc.externalUrl);
        }
      });
      if (imageFile) formData.append('image', imageFile);

      await api.put(`/bds/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Campaña BDS actualizada');
      router.push(`/admin/bds/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar campaña BDS');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout title="Editar BDS"><p className="text-center py-8">Cargando...</p></AdminLayout>;

  const previewImage = imagePreview || (currentImage ? currentImage : null);

  return (
    <AdminLayout title="Editar BDS">
      <button
        type="button"
        onClick={() => router.push(`/admin/bds/${id}`)}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <FaArrowLeft /> Volver a la campaña BDS
      </button>
      <ToastContainer />
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 space-y-6">
          {/* ZONA PÚBLICA */}
          <div className="border-l-2 border-green-500 pl-4 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <span>🌍</span> Información pública
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color de etiqueta</label>
                <ColorPicker value={color} onChange={setColor} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de la campaña</label>
                {currentImage && !imageFile && (
                  <div className="mb-2">
                    <img src={currentImage} alt="Actual" className="max-h-40 rounded-lg shadow-sm" />
                    <p className="text-sm text-gray-400">Imagen actual. Sube una nueva para reemplazar.</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer" />
              </div>

              {/* DOCUMENTOS */}
              <DocumentManager
                entityType="bds"
                documents={documents}
                onChange={setDocuments}
                section="public"
                publicHint="Estos documentos serán visibles de forma pública."
              />

              <div className="border-t pt-4 mt-4">
                <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500"></span><span>💬</span> Grupos de chat públicos</h3>
                <p className="text-xs text-gray-400 mb-2">Estos grupos aparecerán en la web pública.</p>
                {publicGroups.map((group, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <select value={group.platform} onChange={(e) => updatePublicGroup(idx, 'platform', e.target.value)} className="px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500">
                      <option value="whatsapp">WhatsApp</option>
                      <option value="telegram">Telegram</option>
                      <option value="signal">Signal</option>
                    </select>
                    <input type="url" placeholder="https://..." value={group.link} onChange={(e) => updatePublicGroup(idx, 'link', e.target.value)} className="flex-1 px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                    <button type="button" onClick={() => removePublicGroup(idx)} className="text-red-600 hover:text-red-800">✕</button>
                  </div>
                ))}
                <button type="button" onClick={addPublicGroup} className="text-fuchsia-600 text-sm hover:underline flex items-center gap-1"><span>+</span> Añadir grupo público</button>
              </div>
            </div>
          </div>

          {/* ZONA PRIVADA */}
          <div className="border-l-2 border-rose-400 pl-4 mt-8 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <span>🔒</span> Área privada de administración
            </h2>
            <div className="space-y-4">
              <DocumentManager
                entityType="bds"
                documents={documents}
                onChange={setDocuments}
                section="private"
              />

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  <FaLock className="w-3.5 h-3.5 text-rose-500" />
                  Enlace externo a documentos privados
                </label>
                <input type="url" value={privateLink} onChange={(e) => setPrivateLink(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
              </div>

              {/* GRUPOS PRIVADOS */}
              <div>
                <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  <span>☁️</span> Grupos de chat privados
                </h3>
                <p className="text-xs text-gray-400 mb-2">Estos grupos solo serán visibles para administradores.</p>
                {privateGroups.map((group, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <select value={group.platform} onChange={(e) => updatePrivateGroup(idx, 'platform', e.target.value)} className="px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500">
                      <option value="whatsapp">WhatsApp</option>
                      <option value="telegram">Telegram</option>
                      <option value="signal">Signal</option>
                    </select>
                    <input type="url" placeholder="https://..." value={group.link} onChange={(e) => updatePrivateGroup(idx, 'link', e.target.value)} className="flex-1 px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500" />
                    <button type="button" onClick={() => removePrivateGroup(idx)} className="text-red-600 hover:text-red-800">✕</button>
                  </div>
                ))}
                <button type="button" onClick={addPrivateGroup} className="text-fuchsia-600 text-sm hover:underline flex items-center gap-1"><span>+</span> Añadir grupo privado</button>
              </div>

            </div>
          </div>

          <button type="submit" disabled={saving} className="w-full bg-fuchsia-600 text-white px-5 py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors font-medium">
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>

        {/* Vista previa en tiempo real */}
        <div className="lg:w-1/3 sticky top-8">
          <CampaignPreview
            name={name || 'Nombre de la campaña'}
            description={description}
            color={color}
            image={previewImage}
            groups={[...publicGroups.map((g) => ({ ...g, isPublic: true })), ...privateGroups.map((g) => ({ ...g, isPublic: false }))]}
            documents={documents}
            privateLink={privateLink}
            subscriberCount={counters.subscriberCount}
            actionCount={counters.actionCount}
            urgentActionCount={counters.urgentActionCount}
            onExpand={() => setShowFullPreview(true)}
          />
        </div>
      </div>

      {/* MODAL: Vista previa completa */}
      {showFullPreview && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-60 p-4 overflow-y-auto"
          onClick={() => setShowFullPreview(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-5xl my-8 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800">Vista previa pública</h3>
                <span className="text-xs text-gray-400">Tal como lo verá el visitante</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/bds/${bds.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 rounded-lg border border-fuchsia-200 transition-colors"
                >
                  Abrir en nueva pestaña ↗
                </a>
                <button
                  onClick={() => setShowFullPreview(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Cerrar"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>
            <iframe
              src={`/bds/${bds.id}?embedded=1`}
              className="w-full"
              style={{ height: '80vh' }}
              title="Vista previa pública"
            />
          </div>
        </div>
      )}</AdminLayout>
  );
}