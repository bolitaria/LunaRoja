import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Layout from '../components/Layout';

export default function Galeria() {
  const [filtroTipo, setFiltroTipo] = useState('todas'); // 'todas', 'campana', 'accion'
  const [filtroTiempo, setFiltroTiempo] = useState('todas'); // 'todas', 'futuras', 'pasadas'
  const [campanas, setCampanas] = useState([]);
  const [acciones, setAcciones] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [todasLasImagenes, setTodasLasImagenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCampana, setSelectedCampana] = useState('');
  const [selectedAccion, setSelectedAccion] = useState('');

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

    // Filtro por tipo
    if (filtroTipo === 'campana' && selectedCampana) {
      resultado = resultado.filter(img => img.campaignId == selectedCampana);
    } else if (filtroTipo === 'accion' && selectedAccion) {
      resultado = resultado.filter(img => img.actionId == selectedAccion);
    }

    // Filtro por tiempo (solo para acciones)
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

  return (
    <Layout title="Galería Multimedia - Voces Palestinas por la Justicia">
      <Head>
        <title>Galería Multimedia - Voces Palestinas por la Justicia</title>
      </Head>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Galería Multimedia</h1>

          {/* Botones de filtro */}
          <div className="flex flex-col items-end gap-2 mt-4 md:mt-0">
            <div className="flex gap-2">
              <button
                onClick={() => handleTipoChange('todas')}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  filtroTipo === 'todas' ? 'bg-red-700 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => handleTipoChange('campana')}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  filtroTipo === 'campana' ? 'bg-red-700 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Por campaña
              </button>
              <button
                onClick={() => handleTipoChange('accion')}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  filtroTipo === 'accion' ? 'bg-red-700 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Por acción
              </button>
            </div>

            {(filtroTipo === 'campana' || filtroTipo === 'accion') && (
              <div className="flex flex-col items-end gap-2">
                {filtroTipo === 'campana' && (
                  <select
                    value={selectedCampana}
                    onChange={(e) => setSelectedCampana(e.target.value)}
                    className="border rounded px-3 py-1.5 text-sm w-48"
                  >
                    <option value="">Seleccionar campaña</option>
                    {campanas.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}

                {filtroTipo === 'accion' && (
                  <>
                    <select
                      value={selectedAccion}
                      onChange={(e) => setSelectedAccion(e.target.value)}
                      className="border rounded px-3 py-1.5 text-sm w-48"
                    >
                      <option value="">Seleccionar acción</option>
                      {acciones.map(a => (
                        <option key={a.id} value={a.id}>{a.title}</option>
                      ))}
                    </select>

                    {selectedAccion && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFiltroTiempo('todas')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            filtroTiempo === 'todas' ? 'bg-red-700 text-white' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          Todas
                        </button>
                        <button
                          onClick={() => setFiltroTiempo('futuras')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            filtroTiempo === 'futuras' ? 'bg-red-700 text-white' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          Futuras
                        </button>
                        <button
                          onClick={() => setFiltroTiempo('pasadas')}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            filtroTiempo === 'pasadas' ? 'bg-red-700 text-white' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          Pasadas
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Grid de imágenes */}
        {loading ? (
          <p className="text-center py-12">Cargando imágenes...</p>
        ) : imagenes.length === 0 ? (
          <p className="text-center py-12 text-gray-600">No se encontraron imágenes con los filtros seleccionados.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {imagenes.map((img) => (
              <div key={img.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
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
                    <a
                      href={img.campaignId ? `/campanas/${img.campaignId}` : `/acciones/${img.actionId}`}
                      className="text-red-700 text-sm font-medium hover:underline inline-flex items-center gap-1"
                    >
                      Ver detalle
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}