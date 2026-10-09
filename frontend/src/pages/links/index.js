import { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { FaExternalLinkAlt, FaMapMarkerAlt, FaLandmark, FaGlobeEurope, FaGlobe, FaBook, FaBookOpen } from 'react-icons/fa';
import api from '../../lib/axios';
import { LINK_REGIONS, LINK_REGION_LABELS } from '../../utils/linkRegions';

const CATEGORIES = [
  { key: 'local', label: 'Locales', Icon: FaMapMarkerAlt },
  { key: 'nacional', label: 'Nacionales', Icon: FaLandmark },
  { key: 'europeo', label: 'Europeos', Icon: FaGlobeEurope },
  { key: 'internacional', label: 'Internacional', Icon: FaGlobe },
  { key: 'literatura', label: 'Literatura', Icon: FaBook },
  { key: 'bibliografia', label: 'Bibliografía', Icon: FaBookOpen },
];

const CAT_STYLES = {
  local: 'bg-green-100 text-green-800',
  nacional: 'bg-blue-100 text-blue-800',
  europeo: 'bg-purple-100 text-purple-800',
  internacional: 'bg-orange-100 text-orange-800',
  literatura: 'bg-pink-100 text-pink-800',
  bibliografia: 'bg-amber-100 text-amber-800',
};

const CAT_LABELS = {
  local: 'Local', nacional: 'Nacional', europeo: 'Europeo',
  internacional: 'Internacional', literatura: 'Literatura', bibliografia: 'Bibliografía',
};

function LinkPublicCard({ link }) {
  const catStyle = CAT_STYLES[link.category] || 'bg-gray-100 text-gray-800';
  const catLabel = CAT_LABELS[link.category] || link.category;
  const showRegion = link.category === 'internacional' && link.region;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${catStyle}`}>
            {catLabel}
          </span>
          {showRegion && (
            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
              {LINK_REGION_LABELS[link.region] || link.region}
            </span>
          )}
        </div>
        <FaExternalLinkAlt className="w-4 h-4 text-gray-300 group-hover:text-[#008000] transition-colors flex-shrink-0 mt-1" />
      </div>
      <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 group-hover:text-[#E4312B] transition-colors">
        {link.title}
      </h3>
      {link.description && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
          {link.description}
        </p>
      )}
      <p className="mt-3 text-xs text-blue-600 truncate">{link.url}</p>
    </a>
  );
}

export default function LinksIndex() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeRegion, setActiveRegion] = useState('all');

  useEffect(() => {
    api.get('/links/public')
      .then((res) => {
        const data = res.data || {};
        // data es { local: [], ..., internacionalByRegion: { ... } }
        const flat = [
          ...(data.local || []),
          ...(data.nacional || []),
          ...(data.europeo || []),
          ...(data.internacional || []),
          ...(data.literatura || []),
          ...(data.bibliografia || []),
        ];
        setLinks(flat);
      })
      .catch(() => setLinks([]))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    return links.reduce((acc, l) => {
      acc[l.category] = (acc[l.category] || 0) + 1;
      return acc;
    }, {});
  }, [links]);

  const regionCounts = useMemo(() => {
    const c = { sin_region: 0 };
    LINK_REGIONS.forEach(r => { c[r.key] = 0; });
    links.forEach(l => {
      if (l.category === 'internacional') {
        const k = l.region && c[l.region] !== undefined ? l.region : 'sin_region';
        c[k] = (c[k] || 0) + 1;
      }
    });
    return c;
  }, [links]);

  const filtered = useMemo(() => {
    let result = links;
    if (activeCategory !== 'all') {
      result = result.filter(l => l.category === activeCategory);
    }
    if (activeCategory === 'internacional' && activeRegion !== 'all') {
      if (activeRegion === 'sin_region') {
        result = result.filter(l => !l.region);
      } else {
        result = result.filter(l => l.region === activeRegion);
      }
    }
    return result;
  }, [links, activeCategory, activeRegion]);

  const handleCategory = (key) => {
    setActiveCategory(key);
    setActiveRegion('all');
  };

  return (
    <Layout title="Links de interés - Voces Palestinas por la Justicia">
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-[#E4312B] mb-4">
              Links de interés
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Descubre organizaciones, colectivos y recursos que luchan por la justicia y los derechos del pueblo palestino.
            </p>
          </div>

          {/* Chips de categoría principal */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <button
              onClick={() => handleCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-[#008000] text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Todos ({links.length})
            </button>
            {CATEGORIES.map(({ key, label, Icon }) => {
              const count = counts[key] || 0;
              if (count === 0 && key !== 'internacional') return null;
              return (
                <button
                  key={key}
                  onClick={() => handleCategory(key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === key
                      ? 'bg-[#008000] text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {/* Sub-chips de región (solo en internacional) */}
          {activeCategory === 'internacional' && (
            <div className="flex flex-wrap justify-center gap-2 mb-8 px-4 py-3 bg-sky-50 border border-sky-200 rounded-2xl max-w-4xl mx-auto">
              <button
                onClick={() => setActiveRegion('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeRegion === 'all'
                    ? 'bg-sky-600 text-white'
                    : 'bg-white text-gray-700 border border-sky-200 hover:bg-sky-50'
                }`}
              >
                Todas las regiones
              </button>
              {LINK_REGIONS.map(({ key, label }) => {
                const count = regionCounts[key] || 0;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveRegion(key)}
                    disabled={count === 0}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      activeRegion === key
                        ? 'bg-sky-600 text-white'
                        : count === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-sky-200 hover:bg-sky-50'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
              {regionCounts.sin_region > 0 && (
                <button
                  onClick={() => setActiveRegion('sin_region')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeRegion === 'sin_region'
                      ? 'bg-sky-600 text-white'
                      : 'bg-white text-gray-700 border border-sky-200 hover:bg-sky-50'
                  }`}
                >
                  Sin región ({regionCounts.sin_region})
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008000]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No hay enlaces en esta selección.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
              {filtered.map(link => (
                <LinkPublicCard key={link.id} link={link} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
