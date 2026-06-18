import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../../../components/AdminLayout';
import { withAuth } from '../../../../lib/auth';
import { toast } from 'react-toastify';
import ActionPreview from '../../../../components/ActionPreview';

function EditAction() {
  const router = useRouter();
  const { id } = router.query;
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'protest',
    datetime: '',
    locationType: 'presencial',
    onlineLink: '',
    placeName: '',
    address: '',
    latitude: '',
    longitude: '',
    registrationLink: '',
    recordingUrl: '',
    urgent: false,
    enableAttendance: false,
    campaignId: '',
    documentLink: '',
  });
  const [groups, setGroups] = useState([]);
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState(null);
  const [currentFeaturedImage, setCurrentFeaturedImage] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentFileName, setDocumentFileName] = useState('');
  const [currentDocument, setCurrentDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapApiLoaded, setMapApiLoaded] = useState(false);
  const mapRef = useRef(null);
  const previewMapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const scriptLoadingRef = useRef(false);

  const loadLeaflet = () => {
    if (typeof window === 'undefined') return;
    if (window.L) {
      setMapApiLoaded(true);
      return;
    }
    if (scriptLoadingRef.current) return;
    scriptLoadingRef.current = true;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setMapApiLoaded(true);
      scriptLoadingRef.current = false;
    };
    script.onerror = () => {
      toast.error('Error al cargar el mapa. Intenta de nuevo.');
      scriptLoadingRef.current = false;
    };
    document.head.appendChild(script);
  };

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [actionRes, campaignsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const action = actionRes.data;
        setForm({
          title: action.title,
          description: action.description || '',
          category: action.category,
          datetime: action.datetime.slice(0, 16),
          locationType: action.locationType || 'presencial',
          onlineLink: action.onlineLink || '',
          placeName: action.placeName || '',
          address: action.address || '',
          latitude: action.latitude || '',
          longitude: action.longitude || '',
          registrationLink: action.registrationLink || '',
          recordingUrl: action.recordingUrl || '',
          urgent: action.urgent || false,
          enableAttendance: action.enableAttendance || false,
          campaignId: action.campaignId || '',
          documentLink: action.documentLink || '',
        });
        if (action.groups) {
          const parsed = Array.isArray(action.groups) ? action.groups : JSON.parse(action.groups || '[]');
          setGroups(parsed);
        }
        setCurrentFeaturedImage(action.featuredImage);
        if (action.featuredImage) setFeaturedImagePreview(`${process.env.NEXT_PUBLIC_BASE_URL}${action.featuredImage}`);
        setExistingImages(action.images || []);
        setCurrentDocument(action.document || null);
        setCampaigns(campaignsRes.data);
      } catch (error) {
        toast.error('Error al cargar datos');
      }
    };
    fetchData();
    loadLeaflet();
  }, [id]);

  const searchAddress = async () => {
    if (!form.address.trim()) {
      toast.warning('Escribe una dirección para buscar.');
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon,
          address: display_name,
          placeName: !prev.placeName ? display_name.split(',')[0] : prev.placeName,
        }));
        toast.success('Dirección encontrada.');
      } else {
        toast.error('No se encontró la dirección.');
      }
    } catch (error) {
      toast.error('Error al buscar la dirección.');
    }
  };

  const handleOpenMapModal = () => {
    if (!mapApiLoaded) loadLeaflet();
    setShowMapModal(true);
  };

  useEffect(() => {
    if (!showMapModal || !mapApiLoaded || !mapRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const defaultLat = form.latitude || 40.416775;
    const defaultLng = form.longitude || -3.703790;

    const map = L.map(mapRef.current).setView([parseFloat(defaultLat), parseFloat(defaultLng)], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    if (form.latitude && form.longitude) {
      const marker = L.marker([parseFloat(form.latitude), parseFloat(form.longitude)]).addTo(map);
      markerRef.current = marker;
    }

    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) map.removeLayer(markerRef.current);
      const marker = L.marker([lat, lng]).addTo(map);
      markerRef.current = marker;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        const address = data.display_name || '';
        let placeName = '';
        if (data.address) {
          placeName = data.address.amenity || data.address.road || data.address.suburb || '';
        }
        setForm(prev => ({
          ...prev,
          address: address,
          latitude: lat,
          longitude: lng,
          placeName: placeName || prev.placeName,
        }));
        toast.success('Ubicación seleccionada correctamente.');
        setShowMapModal(false);
      } catch (error) {
        toast.error('Error al obtener la dirección.');
      }
    });

    leafletMapRef.current = map;

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [showMapModal, mapApiLoaded, form.latitude, form.longitude]);

  useEffect(() => {
    if (!form.latitude || !form.longitude || !previewMapRef.current || !mapApiLoaded) return;

    if (previewMapRef.current._leaflet_id) {
      const oldMap = previewMapRef.current._leaflet_map;
      if (oldMap) oldMap.remove();
    }

    const map = L.map(previewMapRef.current, {
      center: [parseFloat(form.latitude), parseFloat(form.longitude)],
      zoom: 15,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    L.marker([parseFloat(form.latitude), parseFloat(form.longitude)]).addTo(map);

    return () => map.remove();
  }, [form.latitude, form.longitude, mapApiLoaded]);

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

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    if (newImageFiles.length + files.length > 20) {
      toast.warning(`Máximo 20 imágenes. Ya tienes ${newImageFiles.length}.`);
      return;
    }
    setNewImageFiles(prev => [...prev, ...files]);
    setNewImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeNewImage = (idx) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== idx));
    setNewImagePreviews(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/actions/images/${imageId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Imagen eliminada');
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      toast.error('Error al eliminar imagen');
    }
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFile(file);
      setDocumentFileName(file.name);
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
      formData.append('groups', JSON.stringify(groups));
      if (featuredImageFile) formData.append('featuredImage', featuredImageFile);
      newImageFiles.forEach(file => formData.append('images', file));
      if (documentFile) formData.append('document', documentFile);

      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/actions/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Acción actualizada');
      router.push('/admin/actions');
    } catch (error) {
      toast.error('Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const getDirectionsUrl = () => {
    if (form.latitude && form.longitude) {
      return `https://www.openstreetmap.org/directions?from=&to=${form.latitude},${form.longitude}`;
    }
    return 'https://www.openstreetmap.org';
  };

  const allPreviewImages = [
    ...(featuredImagePreview ? [featuredImagePreview] : []),
    ...newImagePreviews,
  ];

  return (
    <AdminLayout title="Editar Acción">
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 space-y-6">
          {/* SECCIÓN DATOS BÁSICOS */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <span>📄</span> Datos básicos
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent">
                <option value="bds">Acción BDS</option>
                <option value="solidarity_action">Acción Solidaria</option>
                <option value="talk">Charla</option>
                <option value="strike">Huelga</option>
                <option value="protest">Manifestación</option>
                <option value="march">Marcha</option>
                <option value="workshop">Taller</option>
                <option value="webinar">Webinar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaña relacionada</label>
              <select name="campaignId" value={form.campaignId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent">
                <option value="">-- Ninguna --</option>
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora *</label>
              <input type="datetime-local" name="datetime" value={form.datetime} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" />
            </div>
            <div className="flex items-center pt-6 space-x-4">
              <label className="flex items-center">
                <input type="checkbox" name="urgent" checked={form.urgent} onChange={handleChange} className="mr-2" />
                <span className="text-sm text-gray-700">🔥 Urgente</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" name="enableAttendance" checked={form.enableAttendance} onChange={handleChange} className="mr-2" />
                <span className="text-sm text-gray-700">📋 Registrar asistencia</span>
              </label>
            </div>
          </div>

          {/* SECCIÓN UBICACIÓN Y ENLACES */}
          <div className="border-b border-gray-200 pb-4 mt-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <span>📍</span> Ubicación y enlaces
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de ubicación</label>
              <select name="locationType" value={form.locationType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent">
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
              </select>
            </div>
            {form.locationType === 'online' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enlace de registro *</label>
                  <input type="url" name="registrationLink" value={form.registrationLink} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" placeholder="https://forms.gle/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enlace online (acceso)</label>
                  <input type="url" name="onlineLink" value={form.onlineLink} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" placeholder="https://meet.google.com/..." />
                </div>
              </>
            )}
            {form.locationType === 'presencial' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del lugar</label>
                  <input type="text" name="placeName" value={form.placeName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      placeholder="Buscar dirección..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                    <button type="button" onClick={searchAddress} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Buscar
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenMapModal}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Seleccionar en mapa
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Escribe una dirección y presiona "Buscar", o usa el mapa para elegir un punto.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                  <input type="number" step="any" name="latitude" value={form.latitude} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                  <input type="number" step="any" name="longitude" value={form.longitude} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" />
                </div>
                {form.latitude && form.longitude && (
                  <div className="md:col-span-2 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vista previa del mapa</label>
                    <div ref={previewMapRef} style={{ height: '200px', width: '100%' }} className="rounded-lg border border-gray-300" />
                    <div className="flex gap-2 mt-2">
                      <a
                        href={getDirectionsUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        Cómo llegar
                      </a>
                      <button
                        type="button"
                        onClick={handleOpenMapModal}
                        className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        Expandir mapa
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL de grabación</label>
              <input type="url" name="recordingUrl" value={form.recordingUrl} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" />
            </div>
          </div>

          {/* SECCIÓN GRUPOS */}
          <div className="border-b border-gray-200 pb-4 mt-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <span>🗣️💬</span> Grupos
            </h2>
          </div>
          <div>
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

          {/* SECCIÓN DOCUMENTOS */}
          <div className="border-b border-gray-200 pb-4 mt-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <span>📁</span> Documentos
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enlace externo (Dropbox, Drive…)</label>
              <input type="url" name="documentLink" value={form.documentLink} onChange={handleChange} placeholder="https://drive.google.com/..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent" />
              <p className="text-xs text-gray-400 mt-1">🔒 Solo visible para administradores.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subir documento público</label>
              <p className="text-xs text-gray-400 mb-2">Se subirá un único documento por acción. Si necesitas añadir varios, comprímelos en un ZIP.</p>
              {currentDocument && !documentFile && (
                <div className="mb-2">
                  <span className="text-sm text-gray-600">📎 Documento actual: </span>
                  <a href={`${process.env.NEXT_PUBLIC_BASE_URL}${currentDocument}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    {currentDocument.split('/').pop()}
                  </a>
                  <p className="text-xs text-gray-400">Sube uno nuevo para reemplazarlo.</p>
                </div>
              )}
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={handleDocumentChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                />
              </div>
              {documentFileName && <p className="mt-1 text-sm text-green-600">📎 {documentFileName}</p>}
              <p className="text-xs text-gray-400 mt-1">Visible para todos los usuarios.</p>
            </div>
          </div>

          {/* SECCIÓN IMÁGENES */}
          <div className="border-b border-gray-200 pb-4 mt-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <span>📷</span> Imágenes
            </h2>
          </div>
          <div className="space-y-4">
            {/* Imagen principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen principal de la acción</label>
              {currentFeaturedImage && !featuredImageFile && (
                <div className="mb-2">
                  <img src={`${process.env.NEXT_PUBLIC_BASE_URL}${currentFeaturedImage}`} alt="Actual" className="max-h-40 rounded-lg shadow-sm" />
                  <p className="text-sm text-gray-400">Imagen actual. Sube una nueva para reemplazar.</p>
                </div>
              )}
              <div className="flex items-center gap-4">
                <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-fuchsia-500 hover:bg-fuchsia-50 transition-colors">
                  {featuredImagePreview && featuredImageFile ? (
                    <div className="relative w-full h-full">
                      <img src={featuredImagePreview} alt="Vista previa" className="w-full h-full object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFeaturedImageFile(null);
                          setFeaturedImagePreview(null);
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
                  <input type="file" accept="image/*" onChange={handleFeaturedImageChange} className="hidden" />
                </label>
                <div className="text-sm text-gray-600">
                  <p>Esta imagen será la portada de la acción.</p>
                  <p className="text-xs text-gray-400">Formatos: JPG, PNG, WebP</p>
                </div>
              </div>
            </div>

            {/* Galería de imágenes existentes */}
            {existingImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes de galería actuales</label>
                <div className="grid grid-cols-4 gap-4">
                  {existingImages.map(img => (
                    <div key={img.id} className="relative group">
                      <img src={`${process.env.NEXT_PUBLIC_BASE_URL}${img.url}`} alt="Existente" className="h-20 w-20 object-cover rounded-lg shadow-sm" />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Añadir más imágenes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Añadir más imágenes (máx. 20)</label>
              <div className="grid grid-cols-4 gap-4">
                {newImagePreviews.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img src={src} alt={`Preview ${idx}`} className="h-20 w-20 object-cover rounded-lg shadow-sm" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-fuchsia-500 hover:bg-fuchsia-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  <span className="text-xs text-gray-500">Añadir</span>
                  <input type="file" accept="image/*" multiple onChange={handleNewImages} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-fuchsia-600 text-white px-5 py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors font-medium">
            {loading ? 'Guardando...' : 'Actualizar Acción'}
          </button>
        </form>

        <div className="lg:w-1/3">
          <ActionPreview
            form={form}
            featuredImage={featuredImagePreview || (currentFeaturedImage ? `${process.env.NEXT_PUBLIC_BASE_URL}${currentFeaturedImage}` : null)}
            images={allPreviewImages}
          />
        </div>
      </div>

      {/* Modal de mapa */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-700">Seleccionar ubicación en el mapa</h3>
              <button onClick={() => setShowMapModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                id="modal-search-input"
                placeholder="Buscar una dirección..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = e.target.value;
                    if (query && leafletMapRef.current) {
                      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
                        .then(res => res.json())
                        .then(data => {
                          if (data.length > 0) {
                            const { lat, lon } = data[0];
                            leafletMapRef.current.setView([parseFloat(lat), parseFloat(lon)], 15);
                            if (markerRef.current) leafletMapRef.current.removeLayer(markerRef.current);
                            markerRef.current = L.marker([parseFloat(lat), parseFloat(lon)]).addTo(leafletMapRef.current);
                            toast.success('Ubicación encontrada.');
                          } else {
                            toast.error('Dirección no encontrada.');
                          }
                        })
                        .catch(() => toast.error('Error al buscar.'));
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('modal-search-input');
                  if (input && leafletMapRef.current) {
                    const query = input.value;
                    if (!query) return;
                    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.length > 0) {
                          const { lat, lon } = data[0];
                          leafletMapRef.current.setView([parseFloat(lat), parseFloat(lon)], 15);
                          if (markerRef.current) leafletMapRef.current.removeLayer(markerRef.current);
                          markerRef.current = L.marker([parseFloat(lat), parseFloat(lon)]).addTo(leafletMapRef.current);
                          toast.success('Ubicación encontrada.');
                        } else {
                          toast.error('Dirección no encontrada.');
                        }
                      })
                      .catch(() => toast.error('Error al buscar.'));
                  }
                }}
                className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors text-sm"
              >
                Buscar
              </button>
            </div>
            {!mapApiLoaded ? (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Cargando mapa...</p>
              </div>
            ) : (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <div ref={mapRef} className="absolute inset-0 w-full h-full rounded-lg border border-gray-300" />
              </div>
            )}
            <p className="text-sm text-gray-600 mt-3 text-center">
              Puedes escribir una dirección en el buscador o hacer clic directamente en el mapa para seleccionar la ubicación.
            </p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default withAuth(EditAction);