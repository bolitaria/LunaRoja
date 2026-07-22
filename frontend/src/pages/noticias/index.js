import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import Layout from '../../components/Layout';
import NewsCard from '../../components/NewsCard';

export default function Noticias() {
  const [news, setNews] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [showNewsOnly, setShowNewsOnly] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsRes, campaignsRes, actionsRes] = await Promise.all([
          api.get('/news'), api.get('/campaigns'), api.get('/actions')
        ]);
        setNews(newsRes.data);
        setCampaigns(campaignsRes.data);
        setActions(actionsRes.data);
      } catch (error) { console.error('Error fetching data:', error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const hasCampaign = (noticia) => noticia.campaignId != null && noticia.campaignId !== '';
  const hasAction = (noticia) => noticia.actionId != null && noticia.actionId !== '';

  const filteredNews = news.filter(noticia => {
    if (showNewsOnly) {
      const isNews = noticia.isNews === true;
      const isGeneral = !hasCampaign(noticia) && !hasAction(noticia);
      if (!(isNews || isGeneral)) return false;
    }
    if (filterCampaign !== 'all' && noticia.campaignId !== parseInt(filterCampaign)) return false;
    return true;
  });

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
  const actionMap = actions.reduce((acc, a) => ({ ...acc, [a.id]: a }), {});

  return (
    <Layout title="Noticias - Voces Palestinas por la Justicia" bgClass="bg-gradient-to-b from-cyan-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-8 pb-16">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-700">Noticias</h1>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.map(noticia => (<NewsCard key={noticia.id} noticia={noticia} campaign={campaignMap[noticia.campaignId]} action={actionMap[noticia.actionId]} />))}
          </div>
        )}
      </div>
    </Layout>
  );
}