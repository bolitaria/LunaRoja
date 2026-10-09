import { useState, useEffect, useMemo } from 'react';
import api from '../../lib/axios';
import Layout from '../../components/Layout';
import NewsCard from '../../components/NewsCard';
import Pagination from '../../components/Pagination';
import { unwrapList } from '../../utils/apiHelpers';
import { FaYoutube, FaNewspaper, FaPenFancy, FaThLarge } from 'react-icons/fa';

const TYPE_FILTERS = [
  { key: 'all', label: 'Todas', Icon: FaThLarge },
  { key: 'youtube', label: 'Vídeos', Icon: FaYoutube },
  { key: 'article', label: 'Artículos', Icon: FaNewspaper },
  { key: 'internal', label: 'Redacción', Icon: FaPenFancy },
];

export default function Noticias() {
  const [news, setNews] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [showNewsOnly, setShowNewsOnly] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsRes, campaignsRes, actionsRes] = await Promise.all([
          api.get('/news', { params: { limit: 200 } }),
          api.get('/campaigns', { params: { limit: 1000 } }),
          api.get('/actions', { params: { limit: 1000 } }),
        ]);
        setNews(unwrapList(newsRes.data));
        setCampaigns(unwrapList(campaignsRes.data));
        setActions(unwrapList(actionsRes.data));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasCampaign = (n) => n.campaignId != null && n.campaignId !== '';
  const hasAction = (n) => n.actionId != null && n.actionId !== '';

  const counts = useMemo(() => {
    return news.reduce((acc, n) => {
      const t = n.newsType || 'youtube';
      acc[t] = (acc[t] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    }, { all: 0, youtube: 0, article: 0, internal: 0 });
  }, [news]);

  const filteredNews = useMemo(() => {
    return news.filter((n) => {
      if (filterType !== 'all' && (n.newsType || 'youtube') !== filterType) return false;
      if (showNewsOnly) {
        const isNews = n.isNews === true;
        const isGeneral = !hasCampaign(n) && !hasAction(n);
        if (!(isNews || isGeneral)) return false;
      }
      if (filterCampaign !== 'all' && n.campaignId !== parseInt(filterCampaign)) return false;
      return true;
    });
  }, [news, filterType, filterCampaign, showNewsOnly]);

  // Resetear página al cambiar filtros
  useEffect(() => { setCurrentPage(1); }, [filterType, filterCampaign, showNewsOnly, itemsPerPage]);

  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const paginatedNews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNews.slice(start, start + itemsPerPage);
  }, [filteredNews, currentPage, itemsPerPage]);

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
  const actionMap = actions.reduce((acc, a) => ({ ...acc, [a.id]: a }), {});

  return (
    <Layout title="Noticias - Voces Palestinas por la Justicia" bgClass="bg-gradient-to-b from-cyan-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-8 pb-16">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-700">Noticias</h1>

        {/* Chips de tipo */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {TYPE_FILTERS.map(({ key, label, Icon }) => {
            const count = counts[key] || 0;
            if (key !== 'all' && count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterType === key
                    ? 'bg-[#0EA5E9] text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-sky-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Filtros secundarios */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setShowNewsOnly(!showNewsOnly)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
              showNewsOnly
                ? 'bg-[#0EA5E9] text-white border-[#0EA5E9] shadow-md'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-sky-50'
            }`}
          >
            📰 Noticias en General
          </button>
          <select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            className="px-4 py-2 rounded-full border border-gray-300 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9] outline-none transition"
            disabled={showNewsOnly}
          >
            <option value="all">Todas las campañas</option>
            {campaigns.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>

        {loading ? (
          <p className="text-center py-20 text-gray-600">Cargando noticias...</p>
        ) : filteredNews.length === 0 ? (
          <p className="text-center py-20 text-gray-600">No hay noticias que coincidan con los filtros.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedNews.map(noticia => (
                <NewsCard
                  key={noticia.id}
                  noticia={noticia}
                  campaign={campaignMap[noticia.campaignId]}
                  action={actionMap[noticia.actionId]}
                />
              ))}
            </div>

            {filteredNews.length > 0 && (
              <div className="mt-8 max-w-4xl mx-auto">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
