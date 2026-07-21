import api from '../../../lib/axios';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import { toast } from 'react-toastify';
import ActionPreview from '../../../components/ActionPreview';

function NewAction() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [bdsList, setBdsList] = useState([]);
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
    bdsId: '',
    privateLink: '',
  });
  const [groups, setGroups] = useState([]);
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapApiLoaded, setMapApiLoaded] = useState(false);
  const mapRef = useRef(null);
  const previewMapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);
  const scriptLoadingRef = useRef(false);

  const [linkType, setLinkType] = useState('none');

  const DEFAULT_LAT = 36.7213;
  const DEFAULT_LNG = -4.4214;

  // ---------- LEAFLET ----------
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
      toast.error('Error al cargar el mapa');
      scriptLoadingRef.current = false;
    };
    document.head.appendChild(script);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campRes, bdsRes] = await Promise.all([
          api.get('/campaigns'),
          api.get('/bds'),
        ]);
        setCampaigns(campRes.data);
        setBdsList(bdsRes.data);
      } catch (error) {
        console.warn('No se pudieron cargar campañas/BDS', error);
        setCampaigns([]);
        setBdsList([]);
      }
    };
    fetchData();
    loadLeaflet();
  }, []);

  // ---------- MAPA ----------
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
    const defaultLat = form.latitude || DEFAULT_LAT;
    const defaultLng = form.longitude || DEFAULT_LNG;
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

  // ---------- SINCRONIZACIÓN DE CATEGORÍA ----------
  useEffect(() => {
    if (linkType === 'bds') {
      setForm(prev => ({ ...prev, category: 'bds' }));
    } else {
      if (form.category === 'bds') {
        setForm(prev => ({ ...prev, category: 'protest' }));
      }
    }
  }, [linkType]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  // ---------- IMÁGENES ----------
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

  // ---------- GRUPOS ----------
  const addGroup = () => setGroups([...groups, { platform: 'whatsapp', link: '' }]);
  const removeGroup = (index) => setGroups(groups.filter((_, i) => i !== index));
  const updateGroup = (index, field, value) => {
    const updated = [...groups];
    updated[index][field] = value;
    setGroups(updated);
  };

  // ---------- DOCUMENTOS ----------
  const addPublicDocument = (name, file) => {
    setDocuments([...documents, { id: Date.now(), name, file, isPublic: true }]);
  };
  const addPrivateDocument = (name, file) => {
    setDocuments([...documents, { id: Date.now(), name, file, isPublic: false }]);
  };
  const removeDocument = (id) => setDocuments(documents.filter(doc => doc.id !== id));

  // ---------- ENVÍO ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.locationType === 'online' && !form.registrationLink.trim()) {
      toast.warning('Recomendamos incluir un enlace de registro, pero puedes continuar.');
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description || '');
      formData.append('category', form.category);
      formData.append('datetime', form.datetime);
      formData.append('locationType', form.locationType);
      formData.append('onlineLink', form.onlineLink || '');
      formData.append('placeName', form.placeName || '');
      formData.append('address', form.address || '');
      formData.append('latitude', form.latitude || '');
      formData.append('longitude', form.longitude || '');
      formData.append('registrationLink', form.registrationLink || '');
      formData.append('recordingUrl', form.recordingUrl || '');
      formData.append('urgent', form.urgent);
      formData.append('enableAttendance', form.enableAttendance);
      formData.append('privateLink', form.privateLink || '');
      formData.append('groups', JSON.stringify(groups));

      if (linkType === 'campaign') {
        formData.append('campaignId', form.campaignId || '');
        formData.append('bdsId', '');
      } else if (linkType === 'bds') {
        formData.append('campaignId', '');
        formData.append('bdsId', form.bdsId || '');
      } else {
        formData.append('campaignId', '');
        formData.append('bdsId', '');
      }

      if (featuredImageFile) formData.append('featuredImage', featuredImageFile);
      imageFiles.forEach(file => formData.append('images[]', file));

      documents.forEach((doc, idx) => {
        formData.append(`documents[${idx}][name]`, doc.name);
        formData.append(`documents[${idx}][file]`, doc.file);
        formData.append(`documents[${idx}][isPublic]`, doc.isPublic);
      });

      await api.post('/actions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Acción creada');
      router.push('/admin/actions');
    } catch (error) {
      console.error(error);
      toast.error('Error al crear acción');
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

  // ---------- CLASES COMUNES (sutiles y grandes) ----------
  const inputClass =
    "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400 transition-colors";
  const selectClass = inputClass;

  return (
    <AdminLayout title="Nueva Acción">
      <div className="flex flex-col lg:flex-row gap-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm lg:w-2/3 space-y-6">
          {/* ZONA PÚBLICA */}
          <div className="border-l-2 border-green-500 pl-4 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <span>🌍</span> Información pública
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Título *</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Descripción</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows="4" className={inputClass} />
              </div>

              {/* VINCULAR A */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-base font-medium text-gray-700 mb-2">Vincular a</p>
                <div className="flex flex-wrap gap-6 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="linkType" value="none" checked={linkType === 'none'} onChange={() => setLinkType('none')} className="text-fuchsia-600 focus:ring-fuchsia-500" />
                    <span className="text-base">Ninguna</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="linkType" value="campaign" checked={linkType === 'campaign'} onChange={() => setLinkType('campaign')} className="text-fuchsia-600 focus:ring-fuchsia-500" />
                    <span className="text-base">Campaña</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="linkType" value="bds" checked={linkType === 'bds'} onChange={() => setLinkType('bds')} className="text-fuchsia-600 focus:ring-fuchsia-500" />
                    <span className="text-base">BDS</span>
                  </label>
                </div>

                {linkType === 'campaign' && (
                  <div>
                    <select name="campaignId" value={form.campaignId} onChange={handleChange} className={selectClass}>
                      <option value="">-- Seleccionar campaña --</option>
                      {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                {linkType === 'bds' && (
                  <div>
                    <select name="bdsId" value={form.bdsId} onChange={handleChange} className={selectClass}>
                      <option value="">-- Seleccionar BDS --</option>
                      {bdsList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* CATEGORÍA */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Categoría *</label>
                {linkType === 'bds' ? (
                  <div className="px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-base text-gray-700">
                    Acción BDS
                  </div>
                ) : (
                  <select name="category" value={form.category} onChange={handleChange} className={selectClass}>
                    {linkType !== 'campaign' && <option value="bds">Acción BDS</option>}
                    <option value="solidarity_action">Acción Solidaria</option>
                    <option value="talk">Charla</option>
                    <option value="strike">Huelga</option>
                    <option value="protest">Manifestación</option>
                    <option value="march">Marcha</option>
                    <option value="workshop">Taller</option>
                    <option value="webinar">Webinar</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Fecha y hora *</label>
                <input type="datetime-local" name="datetime" value={form.datetime} onChange={handleChange} required className={inputClass} />
              </div>

              {/* UBICACIÓN */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-700 mb-2">📍 Ubicación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">Tipo de ubicación</label>
                    <select name="locationType" value={form.locationType} onChange={handleChange} className={selectClass}>
                      <option value="presencial">Presencial</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                  {form.locationType === 'online' && (
                    <>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">
                          Enlace de registro (recomendado)
                        </label>
                        <input type="url" name="registrationLink" value={form.registrationLink} onChange={handleChange} className={inputClass} placeholder="https://forms.gle/..." />
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">Enlace online (acceso)</label>
                        <input type="url" name="onlineLink" value={form.onlineLink} onChange={handleChange} className={inputClass} placeholder="https://meet.google.com/..." />
                      </div>
                    </>
                  )}
                  {form.locationType === 'presencial' && (
                    <>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">Nombre del lugar</label>
                        <input type="text" name="placeName" value={form.placeName} onChange={handleChange} className={inputClass} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-base font-medium text-gray-700 mb-1">Dirección *</label>
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="text"
                            placeholder="Buscar dirección..."
                            className={`flex-1 ${inputClass}`}
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                          />
                          <button type="button" onClick={searchAddress} className="px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-600 hover:bg-gray-50">
                            Buscar
                          </button>
                          <button
                            type="button"
                            onClick={handleOpenMapModal}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-base text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Mapa
                          </button>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Escribe una dirección y presiona &quot;Buscar&quot; o usa el mapa.</p>
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">Latitud</label>
                        <input type="number" step="any" name="latitude" value={form.latitude} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">Longitud</label>
                        <input type="number" step="any" name="longitude" value={form.longitude} onChange={handleChange} className={inputClass} />
                      </div>
                      {form.latitude && form.longitude && (
                        <div className="md:col-span-2 mt-2">
                          <label className="block text-base font-medium text-gray-700 mb-1">Vista previa del mapa</label>
                          <div ref={previewMapRef} style={{ height: '200px', width: '100%' }} className="rounded-lg border border-gray-300" />
                          <div className="flex gap-2 mt-2">
                            <a
                              href={getDirectionsUrl()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm px-3 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200 transition-colors flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                              Cómo llegar
                            </a>
                            <button
                              type="button"
                              onClick={handleOpenMapModal}
                              className="text-sm px-3 py-1 rounded bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200 transition-colors flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                              Expandir
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">URL de grabación</label>
                <input type="url" name="recordingUrl" value={form.recordingUrl} onChange={handleChange} className={inputClass} />
              </div>
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input type="checkbox" name="urgent" checked={form.urgent} onChange={handleChange} className="mr-2 h-5 w-5 text-fuchsia-600 focus:ring-fuchsia-500" />
                  <span className="text-base text-gray-700">🔥 Urgente</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" name="enableAttendance" checked={form.enableAttendance} onChange={handleChange} className="mr-2 h-5 w-5 text-fuchsia-600 focus:ring-fuchsia-500" />
                  <span className="text-base text-gray-700">📝 Registrar asistencia</span>
                </label>
              </div>
            </div>
          </div>

          {/* GRUPOS PÚBLICOS */}
          <div className="border-l-2 border-green-500 pl-4 mt-4 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <span>💬</span> Grupos de chat públicos
            </h3>
            <p className="text-sm text-gray-400 mb-2">Estos grupos se mostrarán en la acción pública para que los usuarios se unan.</p>
            <div className="space-y-2">
              {groups.map((group, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <select value={group.platform} onChange={(e) => updateGroup(idx, 'platform', e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400">
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="signal">Signal</option>
                  </select>
                  <input type="url" placeholder="https://..." value={group.link} onChange={(e) => updateGroup(idx, 'link', e.target.value)} className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400" />
                  <button type="button" onClick={() => removeGroup(idx)} className="text-red-600 hover:text-red-800 text-xl">✕</button>
                </div>
              ))}
              <button type="button" onClick={addGroup} className="text-fuchsia-600 text-base hover:underline flex items-center gap-1">
                <span>+</span> Añadir grupo público
              </button>
            </div>
          </div>

          {/* ARCHIVOS PÚBLICOS */}
          <div className="border-l-2 border-green-500 pl-4 mt-4 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <span>📂</span> Archivos públicos
            </h3>
            <p className="text-sm text-gray-400 mb-2">Estos documentos serán visibles para todos los usuarios.</p>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="Nombre del archivo" id="docNamePublicAction" className={`flex-1 ${inputClass}`} />
                  <input type="file" id="docFilePublicAction" className="flex-1 text-base text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer" />
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => {
                    const name = document.getElementById('docNamePublicAction').value.trim();
                    const file = document.getElementById('docFilePublicAction').files[0];
                    if (name && file) {
                      addPublicDocument(name, file);
                      document.getElementById('docNamePublicAction').value = '';
                      document.getElementById('docFilePublicAction').value = '';
                    } else toast.warning('Completa nombre y archivo');
                  }} className="bg-fuchsia-600 text-white px-5 py-2 rounded-lg hover:bg-fuchsia-700 transition-colors text-base">
                    Añadir
                  </button>
                </div>
              </div>
              <ul className="space-y-1 mt-2">
                {documents.filter(d => d.isPublic).map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between bg-gray-50 p-3 rounded text-base">
                    <span>{doc.name} 🔓</span>
                    <button type="button" onClick={() => removeDocument(doc.id)} className="text-red-600 text-sm">Eliminar</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* GALERÍA */}
          <div className="border-l-2 border-green-500 pl-4 mt-4 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <span>📸 </span> Galería de imágenes
            </h3>
            <p className="text-sm text-gray-400 mb-2">Imágenes que se mostrarán en la galería pública.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Imagen destacada</label>
                <div className="flex items-center gap-4">
                  <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-fuchsia-300 rounded-lg cursor-pointer hover:border-fuchsia-500 hover:bg-fuchsia-50 transition-colors">
                    {featuredImagePreview ? (
                      <div className="relative w-full h-full">
                        <img src={featuredImagePreview} alt="Vista previa" className="w-full h-full object-cover rounded-lg" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); setFeaturedImageFile(null); setFeaturedImagePreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600">✕</button>
                      </div>
                    ) : (
                      <>
                        <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-base text-gray-500">Subir imagen</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleFeaturedImageChange} className="hidden" />
                  </label>
                  <div className="text-base text-gray-600">
                    <p>Portada de la acción.</p>
                    <p className="text-sm text-gray-400">JPG, PNG, WebP</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Imágenes de galería (máx. 20)</label>
                <div className="grid grid-cols-4 gap-4">
                  {imagePreviews.map((src, idx) => (
                    <div key={idx} className="relative group">
                      <img src={src} alt={`Preview ${idx}`} className="h-24 w-24 object-cover rounded-lg shadow-sm" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 transition-colors">✕</button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center h-24 w-24 border-2 border-dashed border-fuchsia-300 rounded-lg cursor-pointer hover:border-fuchsia-500 hover:bg-fuchsia-50 transition-colors">
                    <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    <span className="text-sm text-gray-500">Añadir</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ZONA PRIVADA */}
          <div className="border-l-2 border-rose-400 pl-4 mt-8 relative">
            <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <span>🔒</span> Área privada de administración
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <span>🔐</span> Archivos privados
                </h3>
                <p className="text-sm text-gray-400 mb-2">Solo visibles para administradores.</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="Nombre del archivo" id="docNamePrivateAction" className={`flex-1 ${inputClass}`} />
                    <input type="file" id="docFilePrivateAction" className="flex-1 text-base text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => {
                      const name = document.getElementById('docNamePrivateAction').value.trim();
                      const file = document.getElementById('docFilePrivateAction').files[0];
                      if (name && file) {
                        addPrivateDocument(name, file);
                        document.getElementById('docNamePrivateAction').value = '';
                        document.getElementById('docFilePrivateAction').value = '';
                      } else toast.warning('Completa nombre y archivo');
                    }} className="bg-fuchsia-600 text-white px-5 py-2 rounded-lg hover:bg-fuchsia-700 transition-colors text-base">
                      Añadir
                    </button>
                  </div>
                </div>
                <ul className="space-y-1 mt-2">
                  {documents.filter(d => !d.isPublic).map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between bg-gray-50 p-3 rounded text-base">
                      <span>{doc.name} 🔒</span>
                      <button type="button" onClick={() => removeDocument(doc.id)} className="text-red-600 text-sm">Eliminar</button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-1">Enlace a zona privada (opcional)</label>
                <input type="url" name="privateLink" value={form.privateLink} onChange={handleChange} placeholder="https://..." className={inputClass} />
                <p className="text-sm text-gray-400 mt-1">Este enlace solo será visible para administradores.</p>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-fuchsia-600 text-white px-5 py-3 rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 transition-colors font-medium text-lg">
            {loading ? 'Guardando...' : 'Crear Acción'}
          </button>
        </form>

        <div className="lg:w-1/3">
          <ActionPreview form={form} featuredImage={featuredImagePreview} images={imagePreviews} documents={documents} groups={groups} />
        </div>
      </div>

      {/* MODAL DEL MAPA */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-700">Seleccionar ubicación</h3>
              <button onClick={() => setShowMapModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                id="modal-search-input"
                placeholder="Buscar dirección..."
                className={`flex-1 ${inputClass}`}
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
                          } else toast.error('Dirección no encontrada.');
                        })
                        .catch(() => toast.error('Error al buscar.'));
                    }
                  }
                }}
              />
              <button type="button" onClick={() => {
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
                      } else toast.error('Dirección no encontrada.');
                    })
                    .catch(() => toast.error('Error al buscar.'));
                }
              }} className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors text-base">
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
            <p className="text-base text-gray-600 mt-3 text-center">Haz clic en el mapa o busca una dirección.</p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default NewAction;