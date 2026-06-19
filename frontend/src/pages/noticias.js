import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import NewsCard from '../components/NewsCard';

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
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/news`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`)
        ]);
        setNews(newsRes.data);
        setCampaigns(campaignsRes.data);
        setActions(actionsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
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
    <Layout title="Noticias - Voces Palestinas por la Justicia">
      <div className="container mx-auto px-4 py-8 pb-16">
        <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">Noticias</h1>
        <div className="flex flex-wrap items-center gap-4 mb-8 justify-center">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showNewsOnly} onChange={(e) => setShowNewsOnly(e.target.checked)} className="rounded"/>
            <span className="text-gray-700">Noticias en General</span>
          </label>
          <select value={filterCampaign} onChange={(e) => setFilterCampaign(e.target.value)} className="px-3 py-2 border rounded text-gray-700" disabled={showNewsOnly}>
            <option value="all">Todas las campañas</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {loading ? <p className="text-center text-gray-800">Cargando noticias...</p> : filteredNews.length === 0 ? <p className="text-center text-gray-600">No hay noticias que coincidan con los filtros.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.map(noticia => (
              <NewsCard key={noticia.id} noticia={noticia} campaign={campaignMap[noticia.campaignId]} action={actionMap[noticia.actionId]} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}