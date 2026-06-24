import api from '../../../../lib/axios';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../../../components/AdminLayout';
import { toast } from 'react-toastify';
import ColorPicker from '../../../../components/ColorPicker';
import CampaignPreview from '../../../../components/CampaignPreview';

function EditCampaign() {
  const router = useRouter();
  const { id } = router.query;
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#E53E3E',
    privateLink: '',
  });
  const [groups, setGroups] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!id) return;
    const fetchCampaign = async () => {
      try {
        const res = await axios.get(`${apiUrl}/campaigns/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const campaign = res.data;
        setForm({
          name: campaign.name,
          description: campaign.description || '',
          color: campaign.color || '#E53E3E',
          privateLink: campaign.privateLink || '',
        });
        if (campaign.groups) {
          const parsed = Array.isArray(campaign.groups) ? campaign.groups : JSON.parse(campaign.groups || '[]');
          setGroups(parsed);
        }
        if (campaign.imageUrl) {
          setCurrentImage(campaign.imageUrl);
          setImagePreview(`${baseUrl}${campaign.imageUrl}`);
        }
        if (campaign.images && Array.isArray(campaign.images)) {
          setImages(campaign.images.map(img => ({ ...img, file: null, preview: img.url })));
        }
        if (campaign.documents) {
          setDocuments(campaign.documents.map(doc => ({ ...doc, file: null })));
        }
      } catch (error) {
        toast.error('Error al cargar campaña');
      }
    };
    fetchCampaign();
  }, [id, apiUrl, baseUrl]);

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

  const addImage = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImages([...images, { id: Date.now(), file, preview: reader.result, url: null }]);
    };
    reader.readAsDataURL(file);
  };
  const removeImage = (id) => setImages(images.filter(img => img.id !== id));

  const addPublicDocument = (name, file) => {
    setDocuments([...documents, { id: Date.now(), name, file, isPublic: true }]);
  };
  const addPrivateDocument = (name, file) => {
    setDocuments([...documents, { id: Date.now(), name, file, isPublic: false }]);
  };
  const removeDocument = (id) => setDocuments(documents.filter(doc => doc.id !== id));
  const handleDeleteDocument = async (docId) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await api.delete('/campaigns/documents/${docId}');
      toast.success('Documento eliminado');
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    } catch (error) {
      toast.error('Error al eliminar documento');
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
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('color', form.color);
      formData.append('privateLink', form.privateLink || '');
      formData.append('groups', JSON.stringify(groups));
      if (imageFile) formData.append('image', imageFile);
      images.forEach((img) => {
        if (img.file) {
          formData.append('images[]', img.file);
        }
      });
      documents.forEach((doc, idx) => {
        if (doc.file) {
          formData.append(`documents[${idx}][name]`, doc.name);
          formData.append(`documents[${idx}][file]`, doc.file);
          formData.append(`documents[${idx}][isPublic]`, doc.isPublic);
        }
      });
      await axios.put(`${apiUrl}/campaigns/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Campaña actualizada');
      router.push('/admin/campaigns');
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Editar Campaña">
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 space-y-6">
          {/* ZONA PÚBLICA */}
          <div className="border-l-2 border-green-500 pl-4 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <span>🔓</span> Información pública
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
                <div className="flex items-center gap-3">
                  <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
                  <span className="text-sm text-gray-500">{form.color}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ARCHIVOS PÚBLICOS */}
          <div className="border-l-2 border-green-500 pl-4 mt-4 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
              <span>📂</span> Archivos públicos
            </h3>
            <p className="text-xs text-gray-400 mb-2">Estos documentos serán visibles para todos los usuarios.</p>
            <div className="space-y-4">
              <ul className="space-y-1">
                {documents.filter(d => d.isPublic).map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{doc.name} 🔓</span>
                    <button type="button" onClick={() => handleDeleteDocument(doc.id)} className="text-red-600 text-xs">Eliminar</button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del archivo"
                    id="docNamePublicCampEdit"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  />
                  <input
                    type="file"
                    id="docFilePublicCampEdit"
                    className="flex-1 text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const name = document.getElementById('docNamePublicCampEdit').value.trim();
                      const file = document.getElementById('docFilePublicCampEdit').files[0];
                      if (name && file) {
                        addPublicDocument(name, file);
                        document.getElementById('docNamePublicCampEdit').value = '';
                        document.getElementById('docFilePublicCampEdit').value = '';
                      } else {
                        toast.warning('Completa nombre y archivo');
                      }
                    }}
                    className="bg-fuchsia-600 text-white px-4 py-1.5 rounded-lg hover:bg-fuchsia-700 transition-colors text-sm"
                  >
                    Añadir
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* GALERÍA */}
          <div className="border-l-2 border-green-500 pl-4 mt-4 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
              <span>📸</span> Galería de imágenes
            </h3>
            <p className="text-xs text-gray-400 mb-2">Imágenes que se mostrarán en la galería pública.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen principal</label>
                {currentImage && !imageFile && (
                  <div className="mb-2">
                    <img src={`${baseUrl}${currentImage}`} alt="Actual" className="max-h-40 rounded-lg shadow-sm" />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Galería de imágenes</label>
                <div className="grid grid-cols-4 gap-4">
                  {images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={img.preview || img.url} alt="Preview" className="h-20 w-20 object-cover rounded-lg shadow-sm" />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center h-20 w-20 border-2 border-dashed border-fuchsia-300 rounded-lg cursor-pointer hover:border-fuchsia-500 hover:bg-fuchsia-50 transition-colors">
                    <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    <span className="text-xs text-gray-500">Añadir</span>
                    <input type="file" accept="image/*" multiple onChange={(e) => {
                      Array.from(e.target.files).forEach(file => addImage(file));
                      e.target.value = '';
                    }} className="hidden" />
                  </label>
                </div>
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
              <div>
                <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                  <span>🔐</span> Archivos privados
                </h3>
                <p className="text-xs text-gray-400 mb-2">Solo visibles para administradores.</p>
                <ul className="space-y-1">
                  {documents.filter(d => !d.isPublic).map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{doc.name} 🔒</span>
                      <button type="button" onClick={() => handleDeleteDocument(doc.id)} className="text-red-600 text-xs">Eliminar</button>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nombre del archivo"
                      id="docNamePrivateCampEdit"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    />
                    <input
                      type="file"
                      id="docFilePrivateCampEdit"
                      className="flex-1 text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const name = document.getElementById('docNamePrivateCampEdit').value.trim();
                        const file = document.getElementById('docFilePrivateCampEdit').files[0];
                        if (name && file) {
                          addPrivateDocument(name, file);
                          document.getElementById('docNamePrivateCampEdit').value = '';
                          document.getElementById('docFilePrivateCampEdit').value = '';
                        } else {
                          toast.warning('Completa nombre y archivo');
                        }
                      }}
                      className="bg-fuchsia-600 text-white px-4 py-1.5 rounded-lg hover:bg-fuchsia-700 transition-colors text-sm"
                    >
                      Añadir
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enlace a zona privada (opcional)</label>
                <input type="url" name="privateLink" value={form.privateLink} onChange={handleChange} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500" />
                <p className="text-xs text-gray-400 mt-1">Este enlace solo será visible para administradores.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">🔒 Grupos internos (solo para la organización)</label>
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
            image={imagePreview || (currentImage ? `${baseUrl}${currentImage}` : null)}
            groups={groups}
            documents={documents}
            privateLink={form.privateLink}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

export default EditCampaign;