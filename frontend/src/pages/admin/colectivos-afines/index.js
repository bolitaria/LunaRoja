import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';
import api from '../../../lib/axios';

export default function ColectivosAfinesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ link: '', nombre: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/colectivosAfines');
      setItems(data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar los colectivos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.link.trim()) return alert('El enlace (URL) es obligatorio');
    if (!editingItem && !logoFile) return alert('La imagen es obligatoria');

    const form = new FormData();
    form.append('link', formData.link.trim());
    if (formData.nombre.trim()) form.append('nombre', formData.nombre.trim());
    if (logoFile) form.append('imagen', logoFile);

    try {
      setUploading(true);
      // 👇 Clave: forzar multipart como en NewAction
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (editingItem) {
        await api.put(`/colectivosAfines/${editingItem.id}`, form, { headers });
      } else {
        await api.post('/colectivosAfines', form, { headers });
      }
      closeModal();
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este colectivo?')) return;
    try {
      await api.delete(`/colectivosAfines/${id}`);
      fetchItems();
    } catch (err) {
      alert('No se pudo eliminar');
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ link: item.link || '', nombre: item.nombre || '' });
      setLogoFile(null);
      setLogoPreview(null);
    } else {
      setEditingItem(null);
      setFormData({ link: '', nombre: '' });
      setLogoFile(null);
      setLogoPreview(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setLogoFile(null);
    setLogoPreview(null);
  };

  return (
    <AdminLayout title="Colectivos Afines">
      <div className="max-w-6xl mx-auto px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Colectivos Afines</h2>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Administra los logos y enlaces de los colectivos</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold transition-colors shadow-sm text-sm sm:text-base"
          >
            <FaPlus /> Añadir Colectivo
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-green-600 text-4xl" /></div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg text-center">
            {error}
            <button onClick={fetchItems} className="underline ml-2">Reintentar</button>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 sm:p-12 text-center">
            <FaExternalLinkAlt className="mx-auto text-gray-300 text-5xl mb-4" />
            <p className="text-gray-500 text-lg">No hay colectivos registrados.</p>
            <button onClick={() => openModal()} className="mt-4 text-green-600 hover:underline font-medium">
              Añadir el primero
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="block h-40 sm:h-48 bg-gray-50 rounded-t-xl flex items-center justify-center p-4 overflow-hidden group relative">
                  <img src={item.url} alt={item.nombre || 'Logo'} className="max-h-full max-w-full object-contain" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <FaExternalLinkAlt className="text-white opacity-0 group-hover:opacity-100 text-xl" />
                  </div>
                </a>
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  {item.nombre && (
                    <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-2" title={item.nombre}>{item.nombre}</h3>
                  )}
                  <div className="mt-auto flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openModal(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    >
                      <FaEdit className="text-xs sm:text-sm" /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                    >
                      <FaTrash className="text-xs sm:text-sm" /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
            <div className="fixed inset-0 bg-black/40" onClick={closeModal}></div>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-2 sm:mx-0 p-5 sm:p-6 z-10">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-5">
                {editingItem ? 'Editar Colectivo' : 'Añadir Colectivo'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enlace (URL) *</label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="https://ejemplo.org"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo {editingItem ? '(dejar vacío para mantener el actual)' : '*'}
                  </label>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <label className="flex flex-col items-center justify-center w-full sm:w-40 h-40 border-2 border-dashed border-fuchsia-300 rounded-lg cursor-pointer hover:border-fuchsia-500 hover:bg-fuchsia-50 transition-colors relative">
                      {logoPreview ? (
                        <div className="relative w-full h-full">
                          <img src={logoPreview} alt="Vista previa" className="w-full h-full object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLogo();
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-gray-500">Subir imagen</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/svg+xml"
                        onChange={handleLogoChange}
                        className="hidden"
                        ref={fileInputRef}
                      />
                    </label>
                    <div className="text-xs sm:text-sm text-gray-600">
                      <p>Logo del colectivo.</p>
                      <p className="text-xs text-gray-400">JPG, PNG, WebP, SVG</p>
                      {editingItem && (
                        <p className="text-xs text-gray-400 mt-1">Deja vacío para no cambiar la imagen actual.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre (opcional)</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Nombre del colectivo (se muestra al hacer zoom)"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-2 sm:py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base" disabled={uploading}>
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm sm:text-base" disabled={uploading}>
                    {uploading ? <FaSpinner className="animate-spin" /> : editingItem ? 'Guardar Cambios' : 'Crear Colectivo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}