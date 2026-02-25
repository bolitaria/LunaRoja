import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import ReactPlayer from 'react-player';

export default function VideoDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchVideo = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/videos/${id}`);
          setVideo(res.data);
        } catch (error) {
          console.error('Error fetching video', error);
        } finally {
          setLoading(false);
        }
      };
      fetchVideo();
    }
  }, [id]);

  if (loading) return <Layout><p className="text-center py-20">Cargando...</p></Layout>;
  if (!video) return <Layout><p className="text-center py-20">Video no encontrado</p></Layout>;

  return (
    <Layout title={video.title}>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{video.title}</h1>
          <p className="text-gray-500 mb-6">{new Date(video.publishedAt).toLocaleDateString()}</p>
          <div className="aspect-w-16 aspect-h-9 mb-8">
            <ReactPlayer url={video.youtubeUrl} width="100%" height="100%" controls />
          </div>
          <p className="text-lg leading-relaxed">{video.description}</p>
        </div>
      </div>
    </Layout>
  );
}