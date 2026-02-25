import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import VideoCard from '../components/VideoCard';

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/videos`);
        setVideos(res.data);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  return (
    <Layout title="Videos - LunaRoja">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Videos</h1>
        {loading ? (
          <p className="text-center">Cargando videos...</p>
        ) : videos.length === 0 ? (
          <p className="text-center">No hay videos disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}