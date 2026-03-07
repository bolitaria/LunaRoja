import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import VideoCard from '../components/VideoCard';

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [showNewsOnly, setShowNewsOnly] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videosRes, campaignsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/videos`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`)
        ]);
        setVideos(videosRes.data);
        setCampaigns(campaignsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrar videos
  const filteredVideos = videos.filter(video => {
    // Filtro "solo noticias": videos con isNews=true y sin campaña
    if (showNewsOnly && (!video.isNews || video.campaignId !== null)) return false;
    // Filtro por campaña
    if (filterCampaign !== 'all' && video.campaignId !== parseInt(filterCampaign)) return false;
    return true;
  });

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});

  return (
    <Layout title="Videos - LunaRoja">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Videos</h1>

        <div className="flex flex-wrap items-center gap-4 mb-8 justify-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showNewsOnly}
              onChange={(e) => setShowNewsOnly(e.target.checked)}
              className="rounded"
            />
            <span>Noticias en General</span>
          </label>

          <select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="all">Todas las campañas</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-center">Cargando videos...</p>
        ) : filteredVideos.length === 0 ? (
          <p className="text-center">No hay videos que coincidan con los filtros.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map(video => (
              <VideoCard key={video.id} video={video} campaign={campaignMap[video.campaignId]} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}