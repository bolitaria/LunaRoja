import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import {
  FaChevronDown, FaChevronRight, FaExternalLinkAlt, FaBookOpen,
  FaMapMarkerAlt, FaLandmark, FaGlobeEurope, FaGlobe
} from 'react-icons/fa';

export default function LinksIndex() {
  const [groupedLinks, setGroupedLinks] = useState({
    local: [],
    nacional: [],
    europeo: [],
    internacional: [],
    literatura: [],
  });
  const [loading, setLoading] = useState(true);
  const [openCategory, setOpenCategory] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    axios.get(`${apiUrl}/links/public`)
      .then(res => setGroupedLinks(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiUrl]);

  const categories = [
    { key: 'local', label: 'Locales', Icon: FaMapMarkerAlt },
    { key: 'nacional', label: 'Nacionales', Icon: FaLandmark },
    { key: 'europeo', label: 'Europeos', Icon: FaGlobeEurope },
    { key: 'internacional', label: 'Internacionales', Icon: FaGlobe },
  ];

  const toggleCategory = (key) => {
    setOpenCategory(openCategory === key ? null : key);
  };

  return (
    <Layout title="Links de interés - Voces Palestinas por la Justicia">
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#E4312B] mb-4">
              Links de interés
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Descubre organizaciones, colectivos y recursos que luchan por la justicia y los derechos del pueblo palestino.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008000]"></div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {categories.map(({ key, label, Icon }) => (
                <div key={key} className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => toggleCategory(key)}
                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-[#008000]" />
                      <h2 className="text-xl font-semibold text-gray-800">{label}</h2>
                      <span className="text-sm text-gray-400 ml-2">
                        ({groupedLinks[key]?.length || 0})
                      </span>
                    </div>
                    {openCategory === key ? (
                      <FaChevronDown className="text-[#008000] w-5 h-5" />
                    ) : (
                      <FaChevronRight className="text-gray-400 w-5 h-5" />
                    )}
                  </button>

                  {openCategory === key && (
                    <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                      {groupedLinks[key]?.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4">No hay enlaces en esta categoría todavía.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupedLinks[key]?.map(link => (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-start gap-3 p-4 rounded-xl hover:bg-green-50 transition-all duration-200 border border-transparent hover:border-green-200"
                            >
                              <div className="mt-1 text-[#008000] group-hover:scale-110 transition-transform">
                                <FaExternalLinkAlt className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-[#008000] transition-colors">
                                  {link.title}
                                </h3>
                                {link.description && (
                                  <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                                )}
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Literatura recomendada */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden mt-8">
                <div className="px-6 py-5 flex items-center gap-3 bg-gray-50">
                  <FaBookOpen className="text-[#008000] w-6 h-6" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Literatura recomendada
                  </h2>
                  <span className="text-sm text-gray-400">
                    ({groupedLinks.literatura?.length || 0})
                  </span>
                </div>
                <div className="px-6 pb-6 pt-4">
                  {groupedLinks.literatura?.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">No hay libros o artículos todavía.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groupedLinks.literatura?.map(link => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start gap-3 p-4 rounded-xl hover:bg-green-50 transition-all duration-200 border border-transparent hover:border-green-200"
                        >
                          <div className="mt-1 text-[#008000] group-hover:scale-110 transition-transform">
                            <FaExternalLinkAlt className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 group-hover:text-[#008000] transition-colors">
                              {link.title}
                            </h3>
                            {link.description && (
                              <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}