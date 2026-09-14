import api from '../../../../lib/axios';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import { toast } from 'react-toastify';
import ColorPicker from '../../../../components/ColorPicker';
import CampaignPreview from '../../../../components/CampaignPreview';
import DocumentManager from '../../../../components/DocumentManager';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';;

export default function EditCampaign() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#E53E3E',
    privateLink: '',
  });
  const [publicGroups, setPublicGroups] = useState([]);
  const [privateGroups, setPrivateGroups] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [counters, setCounters] = useState({ subscriberCount: 0, actionCount: 0, urgentActionCount: 0 });
  const [loading, setLoading] = useState(false);
  const baseUrl = '';

  useEffect(() => {
    if (!id) return;
    const fetchCampaign = async () => {
      try {
        const res = await api.get(`/campaigns/${id}`);
        const campaign = res.data;
        setForm({
          name: campaign.name,
          description: campaign.description || '',
          color: campaign.color || '#E53E3E',
          privateLink: campaign.privateLink || '',
        });
        const allGroups = campaign.groups || [];
        setPublicGroups(allGroups.filter((g) => g.isPublic));
        setPrivateGroups(allGroups.filter((g) => !g.isPublic));
        if (campaign.imageUrl) {
          setCurrentImage(campaign.imageUrl);
          setImagePreview(campaign.imageUrl);
        }
        if (campaign.documents) {
          setDocuments(campaign.documents.map((doc) => ({
            id: doc.id,
            name: doc.title,
            source: doc.source,
            file: null,
            externalUrl: doc.externalUrl || null,
            visibility: doc.visibility,
            filePath: doc.filePath || null,
            isNew: false,
          })));
        }
        setCurrentDocument(campaign.document || null);
        setCounters({
          subscriberCount: campaign.subscriberCount || 0,
          actionCount: campaign.actionCount || 0,
          urgentActionCount: campaign.urgentActionCount || 0,
        });
      } catch (error) {
        toast.error('Error al cargar campaña');
      }
    };
    fetchCampaign();
  }, [id, baseUrl]);

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
    setLoading(true);
    try {
      const allGroups = [
        ...publicGroups.map((g) => ({ ...g, isPublic: true })),
        ...privateGroups.map((g) => ({ ...g, isPublic: false })),
      ];

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('color', form.color);
      formData.append('privateLink', form.privateLink || '');
      formData.append('groups', JSON.stringify(allGroups));
      if (imageFile) formData.append('image', imageFile);
      // Solo enviamos los documentos NUEVOS (los existentes ya están en BD;
      // los eliminados se han borrado vía DELETE /api/documents/:id).
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

      await api.put(`/campaigns/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Campaña actualizada');
      router.push(`/admin/campaigns/${id}`);
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Editar Campaña">
      <button
        type="button"
        onClick={() => router.push(`/admin/campaigns/${id}`)}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <FaArrowLeft /> Volver a la campaña
      </button>
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
                <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color de etiqueta</label>
                <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
              </div>
              {/* Imagen principal (única) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de la campaña</label>
                {currentImage && !imageFile && (
                  <div className="mb-2">
                    <img src={currentImage} alt="Actual" className="max-h-40 rounded-lg shadow-sm" />
                    <p className="text-sm text-gray-400">Imagen actual. Sube una nueva para reemplazar.</p>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-fuchsia-300 rounded-lg cursor-pointer hover:border-fuchsia-500 hover:bg-fuchsia-50 transition-colors">
                    {imagePreview && imageFile ? (
                      <div className="relative w-full h-full">
                        <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-xs text-gray-500">Subir imagen</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  {currentImage && !imageFile && <span className="text-sm text-gray-500">Imagen actual</span>}
                </div>
              </div>

              {/* GRUPOS PÚBLICOS */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                  <span>💬</span> Grupos de chat públicos
                </h3>
                <p className="text-xs text-gray-400 mb-2">Estos grupos aparecerán en la web pública.</p>
                {publicGroups.map((group, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <select
                      value={group.platform}
                      onChange={(e) => updatePublicGroup(idx, 'platform', e.target.value)}
                      className="px-2 py-1 border rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="telegram">Telegram</option>
                      <option value="signal">Signal</option>
                    </select>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={group.link}
                      onChange={(e) => updatePublicGroup(idx, 'link', e.target.value)}
                      className="flex-1 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    />
                    <button type="button" onClick={() => removePublicGroup(idx)} className="text-red-600 hover:text-red-800">
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addPublicGroup} className="text-fuchsia-600 text-sm hover:underline flex items-center gap-1">
                  <span>+</span> Añadir grupo público
                </button>
              </div>
            </div>
          </div>

          {/* DOCUMENTOS */}
          <DocumentManager
            entityType="campaign"
            documents={documents}
            onChange={setDocuments}
          section="public"
            />

          {/* ZONA PRIVADA */}
          <div className="border-l-2 border-rose-400 pl-4 mt-8 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <span>🔒</span> Área privada de administración
            </h2>
            <div className="space-y-4">
              {/* GRUPOS PRIVADOS */}
              <div>
                <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                  <span>🔐</span> Grupos internos (privados)
                </h3>
                <p className="text-xs text-gray-400 mb-2">Solo visibles para administradores.</p>
                {privateGroups.map((group, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <select
                      value={group.platform}
                      onChange={(e) => updatePrivateGroup(idx, 'platform', e.target.value)}
                      className="px-2 py-1 border rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="telegram">Telegram</option>
                      <option value="signal">Signal</option>
                    </select>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={group.link}
                      onChange={(e) => updatePrivateGroup(idx, 'link', e.target.value)}
                      className="flex-1 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    />
                    <button type="button" onClick={() => removePrivateGroup(idx)} className="text-red-600 hover:text-red-800">
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addPrivateGroup} className="text-fuchsia-600 text-sm hover:underline flex items-center gap-1">
                  <span>+</span> Añadir grupo privado
                </button>
              </div>

                            <DocumentManager
                entityType="campaign"
                documents={documents}
                onChange={setDocuments}
                section="private"
              />

<div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enlace a zona privada (opcional)</label>
                <input type="url" name="privateLink" value={form.privateLink} onChange={handleChange} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
                <p className="text-xs text-gray-400 mt-1">Este enlace solo será visible para administradores.</p>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-fuchsia-600 text-white px-5 py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors font-medium">
            {loading ? 'Guardando...' : 'Actualizar Campaña'}
          </button>
        </form>

        <div className="lg:w-1/3">
          <CampaignPreview
            name={form.name}
            description={form.description}
            color={form.color}
            image={imagePreview || (currentImage ? currentImage : null)}
            groups={[...publicGroups.map((g) => ({ ...g, isPublic: true })), ...privateGroups.map((g) => ({ ...g, isPublic: false }))]}
            documents={documents}
            document={currentDocument}
            privateLink={form.privateLink}
            subscriberCount={counters.subscriberCount}
            actionCount={counters.actionCount}
            urgentActionCount={counters.urgentActionCount}
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
                  href={`/campaigns/${campaign.id}`}
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
              src={`/campaigns/${campaign.id}?embedded=1`}
              className="w-full"
              style={{ height: '80vh' }}
              title="Vista previa pública"
            />
          </div>
        </div>
      )}</AdminLayout>
  );
}