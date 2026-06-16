import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Layout from '../components/Layout';

export default function Galeria() {
  const [filtroTipo, setFiltroTipo] = useState('todas');       // 'todas', 'campana', 'accion'
  const [filtroTiempo, setFiltroTiempo] = useState('todas');   // 'todas', 'futuras', 'pasadas'
  const [campanas, setCampanas] = useState([]);
  const [acciones, setAcciones] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [todasLasImagenes, setTodasLasImagenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCampana, setSelectedCampana] = useState('');
  const [selectedAccion, setSelectedAccion] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Cargar listas de campañas y acciones
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [campRes, accRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`),
        ]);
        setCampanas(campRes.data);
        setAcciones(accRes.data);
      } catch (err) {
        console.error('Error cargando listas:', err);
      }
    };
    fetchLists();
  }, []);

  // Cargar todas las imágenes una vez
  useEffect(() => {
    const fetchAllImages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/images`);
        setTodasLasImagenes(res.data);
        setImagenes(res.data);
      } catch (err) {
        console.error('Error cargando imágenes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllImages();
  }, []);

  // Aplicar filtros combinados (tipo + tiempo)
  useEffect(() => {
    let resultado = [...todasLasImagenes];

    if (filtroTipo === 'campana' && selectedCampana) {
      resultado = resultado.filter(img => img.campaignId == selectedCampana);
    } else if (filtroTipo === 'accion' && selectedAccion) {
      resultado = resultado.filter(img => img.actionId == selectedAccion);
    }

    if (filtroTipo === 'accion' && filtroTiempo !== 'todas') {
      const ahora = new Date();
      resultado = resultado.filter(img => {
        if (!img.actionId) return false;
        const accion = acciones.find(a => a.id == img.actionId);
        if (!accion || !accion.datetime) return false;
        const fechaAccion = new Date(accion.datetime);
        return filtroTiempo === 'futuras' ? fechaAccion > ahora : fechaAccion <= ahora;
      });
    }

    setImagenes(resultado);
  }, [filtroTipo, selectedCampana, selectedAccion, filtroTiempo, todasLasImagenes, acciones]);

  const handleTipoChange = (nuevoTipo) => {
    setFiltroTipo(nuevoTipo);
    setSelectedCampana('');
    setSelectedAccion('');
    setFiltroTiempo('todas');
  };

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => setLightboxIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % imagenes.length);

  return (
    <Layout title="Galería Multimedia - Voces Palestinas por la Justicia">
      <Head>
        <title>Galería Multimedia - Voces Palestinas por la Justicia</title>
      </Head>

      <div className="container mx-auto px-4 py-8 pb-16">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-600">Galería Multimedia</h1>

        {/* Filtros: selectores sin borde + botones de tiempo con borde */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8">
          {/* Selector de tipo (Todas / Campañas / Acciones) sin borde */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-gray-700 font-medium">Filtrar por:</span>
            <div className="relative inline-block">
              <select
                value={filtroTipo}
                onChange={(e) => handleTipoChange(e.target.value)}
                className="appearance-none bg-transparent border-none text-sm font-medium text-gray-700 pr-6 cursor-pointer focus:outline-none"
              >
                <option value="todas">Todas</option>
                <option value="campana">Campañas</option>
                <option value="accion">Acciones</option>
              </select>
              <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Selección de campaña o acción (sin borde) */}
          {(filtroTipo === 'campana' || filtroTipo === 'accion') && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative inline-block">
                <select
                  value={filtroTipo === 'campana' ? selectedCampana : selectedAccion}
                  onChange={(e) => {
                    if (filtroTipo === 'campana') setSelectedCampana(e.target.value);
                    else setSelectedAccion(e.target.value);
                  }}
                  className="appearance-none bg-transparent border-none text-sm text-gray-700 pr-6 cursor-pointer focus:outline-none"
                >
                  <option value="">Seleccionar {filtroTipo === 'campana' ? 'campaña' : 'acción'}</option>
                  {filtroTipo === 'campana'
                    ? campanas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                    : acciones.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
                <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Filtros de tiempo (con borde, estilo original, fucsia cuando activos) */}
              {filtroTipo === 'accion' && selectedAccion && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setFiltroTiempo('todas')}
                    className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
                      filtroTiempo === 'todas' ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setFiltroTiempo('futuras')}
                    className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
                      filtroTiempo === 'futuras' ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Futuras
                  </button>
                  <button
                    onClick={() => setFiltroTiempo('pasadas')}
                    className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
                      filtroTiempo === 'pasadas' ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Pasadas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Grid de imágenes */}
        {loading ? (
          <p className="text-center text-gray-600 py-12">Cargando imágenes...</p>
        ) : imagenes.length === 0 ? (
          <p className="text-center text-gray-600 py-12">No se encontraron imágenes con los filtros seleccionados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {imagenes.map((img, idx) => (
              <div
                key={img.id}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
                onClick={() => openLightbox(idx)}
              >
                <div className="aspect-video mb-3 overflow-hidden rounded-lg">
                  <img
                    src={`${process.env.NEXT_PUBLIC_BASE_URL}${img.url}`}
                    alt={img.caption || 'Imagen'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div className="space-y-1">
                  {img.caption && (
                    <p className="text-sm text-gray-700 line-clamp-2">{img.caption}</p>
                  )}
                  {(img.campaignId || img.actionId) && (
                    <span
                      className="text-red-700 text-sm font-medium hover:underline inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={img.campaignId ? `/campanas/${img.campaignId}` : `/acciones/${img.actionId}`}>
                        Ver detalle
                      </a>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <div
              className="relative w-[90vw] h-[90vh] max-w-6xl flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 z-10"
                onClick={closeLightbox}
              >
                ×
              </button>
              {imagenes.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl font-bold hover:text-gray-300 z-10"
                    onClick={prevImage}
                  >
                    ‹
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl font-bold hover:text-gray-300 z-10"
                    onClick={nextImage}
                  >
                    ›
                  </button>
                </>
              )}
              <img
                src={`${process.env.NEXT_PUBLIC_BASE_URL}${imagenes[lightboxIndex].url}`}
                alt={imagenes[lightboxIndex].caption || 'Imagen'}
                className="max-w-full max-h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full text-sm">
                {lightboxIndex + 1} / {imagenes.length}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}