import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function PeticionesIndex() {
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('todas');
  const [filterUrgency, setFilterUrgency] = useState('todas');

  useEffect(() => {
    const fetchPetitions = async () => {
      try {
        const res = await axios.get('/api/petitions/public', { timeout: 15000 });
        if (!Array.isArray(res.data)) throw new Error('Respuesta inesperada');
        const sorted = [...res.data].sort((a, b) => {
          if (a.urgency && !b.urgency) return -1;
          if (!a.urgency && b.urgency) return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setPetitions(sorted);
        setError(null);
      } catch (err) {
        console.error('Error fetching petitions:', err);
        setError('No se pudieron cargar las peticiones.');
      } finally {
        setLoading(false);
      }
    };
    fetchPetitions();
  }, []);

  const now = new Date();
  const filtered = petitions.filter(p => {
    if (filterType === 'externas' && p.type !== 'official') return false;
    if (filterType === 'internas' && p.type !== 'custom') return false;
    if (filterUrgency === 'urgente' && !p.urgency) return false;
    return true;
  });

  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return img; // ruta relativa, el proxy de Next.js la sirve
  };

  const filterBtnBase = "px-4 py-2 rounded-lg text-sm font-medium transition border border-gray-300";

  return (
    <Layout title="Firma Peticiones - Voces Palestinas por la Justicia">
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 via-amber-50 to-white">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-600 mb-6 text-center">Firma Peticiones</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
              {error}
              <button onClick={() => window.location.reload()} className="ml-2 underline font-medium hover:text-red-900">
                Reintentar
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFilterType('todas')} className={`${filterBtnBase} ${filterType === 'todas' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Todas</button>
              <button onClick={() => setFilterType('externas')} className={`${filterBtnBase} ${filterType === 'externas' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Externas</button>
              <button onClick={() => setFilterType('internas')} className={`${filterBtnBase} ${filterType === 'internas' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Internas</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterUrgency('todas')}
                className={`${filterBtnBase} ${filterUrgency === 'todas' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterUrgency(filterUrgency === 'urgente' ? 'todas' : 'urgente')}
                className={`${filterBtnBase} ${filterUrgency === 'urgente' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                🔥 Urgentes
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-center py-20">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-20 text-gray-600">No hay peticiones que mostrar.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(pet => {
                const isOfficial = pet.type === 'official';
                const deadline = pet.deadline ? new Date(pet.deadline) : null;
                const isExpired = deadline && deadline < now;

                const cardContent = (
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition h-full flex flex-col">
                    {pet.featured_image && (
                      <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
                        <img
                          src={getImageUrl(pet.featured_image)}
                          alt={pet.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 flex-1">{pet.title}</h3>
                        {pet.urgency && <span className="flex-shrink-0 inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">🔥 Urgente</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${isOfficial ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                          {isOfficial ? 'Externa' : 'Interna'}
                        </span>
                        {deadline && <span className={`text-xs ${isExpired ? 'text-red-500 font-medium' : 'text-gray-500'}`}>{isExpired ? 'Expirada' : `Hasta ${deadline.toLocaleDateString()}`}</span>}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3 flex-1">{isOfficial ? 'Redirige a un sitio externo para firmar.' : pet.content?.replace(/<[^>]*>/g, '').substring(0, 120) + '…'}</p>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{pet.total_signatures} firmas</span>
                        <span className="text-[#008000] text-sm font-semibold">{isOfficial ? 'Ir a firmar →' : 'Firmar →'}</span>
                      </div>
                    </div>
                  </div>
                );

                if (isOfficial) {
                  return <a key={pet.id} href={pet.external_url} target="_blank" rel="noopener noreferrer" className="group">{cardContent}</a>;
                } else {
                  return <Link key={pet.id} href={`/peticiones/${pet.id}`} className="group">{cardContent}</Link>;
                }
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
