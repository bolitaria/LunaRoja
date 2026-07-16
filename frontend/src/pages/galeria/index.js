import { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import api from '../../lib/axios';
import Layout from '../../components/Layout';
import 'react-calendar/dist/Calendar.css';

const Calendar = dynamic(() => import('react-calendar'), { ssr: false });

const getLocalDateStr = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Galeria() {
  const [imagenes, setImagenes] = useState([]);
  const [todasLasImagenes, setTodasLasImagenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('todas');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCampana, setSelectedCampana] = useState('');
  const [selectedAccion, setSelectedAccion] = useState('');
  const [selectedBds, setSelectedBds] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [campanas, setCampanas] = useState([]);
  const [acciones, setAcciones] = useState([]);
  const [bdsList, setBdsList] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [campRes, accRes, bdsRes] = await Promise.all([
          api.get('/campaigns'),
          api.get('/actions'),
          api.get('/bds'),
        ]);
        setCampanas(campRes.data);
        setAcciones(accRes.data);
        setBdsList(bdsRes.data);
      } catch (err) { console.error('Error cargando listas:', err); }
    };
    fetchLists();
  }, []);

  useEffect(() => {
    const fetchAllImages = async () => {
      setLoading(true);
      try {
        const res = await api.get('/images');
        setTodasLasImagenes(res.data);
        setImagenes(res.data);
      } catch (err) { console.error('Error cargando imágenes:', err); }
      finally { setLoading(false); }
    };
    fetchAllImages();
  }, []);

  useEffect(() => {
    let resultado = [...todasLasImagenes];

    if (filterType === 'campana') {
      if (selectedCampana) {
        resultado = resultado.filter(img => img.campaignId == selectedCampana);
      } else {
        resultado = resultado.filter(img => img.campaignId);
      }
    } else if (filterType === 'accion') {
      if (selectedAccion) {
        resultado = resultado.filter(img => img.actionId == selectedAccion);
      } else {
        resultado = resultado.filter(img => img.actionId);
      }
    } else if (filterType === 'bds') {
      const accionIdsBDS = acciones.filter(a => a.bdsId).map(a => a.id);
      if (selectedBds) {
        resultado = resultado.filter(img => img.actionId && accionIdsBDS.includes(img.actionId) && img.actionId == selectedBds);
      } else {
        resultado = resultado.filter(img => img.actionId && accionIdsBDS.includes(img.actionId));
      }
    }

    if (filterType === 'todas' && selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      resultado = resultado.filter(img => {
        if (img.actionId) {
          const accion = acciones.find(a => a.id == img.actionId);
          if (accion && accion.datetime) {
            const fecha = new Date(accion.datetime);
            return fecha.getFullYear() === year && fecha.getMonth() + 1 === month;
          }
        }
        if (img.created_at || img.createdAt) {
          const fecha = new Date(img.created_at || img.createdAt);
          return fecha.getFullYear() === year && fecha.getMonth() + 1 === month;
        }
        return false;
      });
    }

    if ((filterType !== 'todas' && (selectedCampana || selectedAccion || selectedBds)) && selectedDate) {
      const dateStr = getLocalDateStr(selectedDate);
      resultado = resultado.filter(img => {
        if (img.actionId) {
          const accion = acciones.find(a => a.id == img.actionId);
          if (accion && accion.datetime) return getLocalDateStr(accion.datetime) === dateStr;
        }
        if (img.created_at || img.createdAt) {
          const fecha = new Date(img.created_at || img.createdAt);
          return getLocalDateStr(fecha) === dateStr;
        }
        return false;
      });
    }

    setImagenes(resultado);
  }, [filterType, selectedMonth, selectedCampana, selectedAccion, selectedBds, selectedDate, todasLasImagenes, acciones]);

  const handleFilterTypeChange = (nuevoTipo) => {
    setFilterType(nuevoTipo);
    setSelectedMonth('');
    setSelectedCampana('');
    setSelectedAccion('');
    setSelectedBds('');
    setSelectedDate(null);
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setZoomScale(1);
  };
  const closeLightbox = () => {
    setLightboxIndex(null);
    setZoomScale(1);
  };
  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
    setZoomScale(1);
  };
  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % imagenes.length);
    setZoomScale(1);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  };

  // Botones de filtro: blanco con texto gris, al activar fondo rojo TikTok y texto blanco
  const filterButtonClass = (isActive) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-all border ${
      isActive
        ? 'bg-[#FE2C55] text-white border-[#FE2C55] shadow-sm'
        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
    }`;

  const baseSelectClass = "px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 focus:ring-2 focus:ring-[#FE2C55] outline-none transition bg-white";

  return (
    <Layout title="Galería Multimedia - Voces Palestinas por la Justicia" bgClass="bg-gradient-to-b from-[#FE2C55]/10 to-white min-h-screen">
      <Head><title>Galería Multimedia - Voces Palestinas por la Justicia</title></Head>
      <div className="container mx-auto px-4 py-8 pb-16">
        <h1 className="text-4xl font-bold mb-4 text-center text-gray-700">Galería Multimedia</h1>
        <p className="text-center text-gray-500 mb-10 max-w-xl mx-auto">Explora las galerias de imágenes de las campañas y de las acciones que hemos llevado a cabo</p>

        {/* Filtros de categoría */}
        <div className="flex justify-center mb-6">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => handleFilterTypeChange('todas')} className={filterButtonClass(filterType === 'todas')}>Todas</button>
            <button onClick={() => handleFilterTypeChange('campana')} className={filterButtonClass(filterType === 'campana')}>🎯 Campañas</button>
            <button onClick={() => handleFilterTypeChange('accion')} className={filterButtonClass(filterType === 'accion')}>⚡ Acciones</button>
            <button onClick={() => handleFilterTypeChange('bds')} className={filterButtonClass(filterType === 'bds')}>🚫 BDS</button>
          </div>
        </div>

        {/* Filtros adicionales */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-10">
          {filterType === 'todas' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">Mes:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={baseSelectClass}
              />
              {selectedMonth && (
                <button onClick={() => setSelectedMonth('')} className="text-gray-400 hover:text-gray-600">✕</button>
              )}
            </div>
          )}

          {filterType === 'campana' && (
            <select
              value={selectedCampana}
              onChange={(e) => { setSelectedCampana(e.target.value); setSelectedDate(null); }}
              className={baseSelectClass}
            >
              <option value="">Todas las campañas</option>
              {campanas.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          )}

          {filterType === 'accion' && (
            <select
              value={selectedAccion}
              onChange={(e) => { setSelectedAccion(e.target.value); setSelectedDate(null); }}
              className={baseSelectClass}
            >
              <option value="">Todas las acciones</option>
              {acciones.map(a => (<option key={a.id} value={a.id}>{a.title}</option>))}
            </select>
          )}

          {filterType === 'bds' && (
            <select
              value={selectedBds}
              onChange={(e) => { setSelectedBds(e.target.value); setSelectedDate(null); }}
              className={baseSelectClass}
            >
              <option value="">Todas las campañas BDS</option>
              {bdsList.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          )}

          {(filterType !== 'todas' && (selectedCampana || selectedAccion || selectedBds)) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Día:</span>
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate || new Date()}
                className="rounded-xl border border-gray-200 shadow-sm p-2 bg-white"
                locale="es-ES"
              />
              {selectedDate && (
                <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              )}
            </div>
          )}
        </div>

        {/* Grid de imágenes */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : imagenes.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-lg">No se encontraron imágenes</span>
            <button onClick={() => handleFilterTypeChange('todas')} className="mt-4 text-[#FE2C55] hover:underline text-sm">Limpiar filtros</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {imagenes.map((img, idx) => (
              <div
                key={img.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100"
                onClick={() => openLightbox(idx)}
              >
                <div className="relative aspect-video overflow-hidden bg-gray-100">
                  <img
                    src={`${process.env.NEXT_PUBLIC_BASE_URL}${img.url}`}
                    alt={img.caption || 'Imagen'}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v4m0 0v4m0-4h4m-4 0H6" /></svg>
                  </div>
                </div>
                <div className="p-4">
                  {img.caption && <p className="text-sm text-gray-700 line-clamp-2 mb-2">{img.caption}</p>}
                  {(img.campaignId || img.actionId) && (
                    <div className="flex items-center gap-2 text-xs">
                      {img.campaignId && (
                        <a
                          href={`/campanas/${img.campaignId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
                        >
                          🎯 Campaña
                        </a>
                      )}
                      {img.actionId && (
                        <a
                          href={`/acciones/${img.actionId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition"
                        >
                          ⚡ Acción
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox con zoom */}
        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={closeLightbox}
            onWheel={handleWheel}
          >
            <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <button className="absolute top-0 right-0 text-white text-4xl font-light hover:text-gray-300 z-10" onClick={closeLightbox}>×</button>
              {imagenes.length > 1 && (
                <>
                  <button className="absolute left-0 top-1/2 -translate-y-1/2 text-white text-5xl font-light hover:text-gray-300 z-10" onClick={prevImage}>‹</button>
                  <button className="absolute right-0 top-1/2 -translate-y-1/2 text-white text-5xl font-light hover:text-gray-300 z-10" onClick={nextImage}>›</button>
                </>
              )}
              <div className="overflow-hidden max-h-[80vh] max-w-full flex items-center justify-center">
                <img
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}${imagenes[lightboxIndex].url}`}
                  alt={imagenes[lightboxIndex].caption || 'Imagen'}
                  className="max-h-[80vh] max-w-full object-contain transition-transform duration-100"
                  style={{ transform: `scale(${zoomScale})`, cursor: zoomScale > 1 ? 'grab' : 'zoom-in' }}
                  draggable={false}
                />
              </div>
              <div className="text-white text-center mt-4 flex items-center gap-4">
                <p className="text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">{lightboxIndex + 1} / {imagenes.length}</p>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <button onClick={() => setZoomScale(prev => Math.max(prev - 0.2, 0.5))} className="hover:text-white">−</button>
                  <span>{Math.round(zoomScale * 100)}%</span>
                  <button onClick={() => setZoomScale(prev => Math.min(prev + 0.2, 3))} className="hover:text-white">+</button>
                </div>
              </div>
              {imagenes[lightboxIndex].caption && (
                <p className="text-sm text-white/80 mt-2 max-w-md text-center">{imagenes[lightboxIndex].caption}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}