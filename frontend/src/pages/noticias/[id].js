import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import ReactPlayer from 'react-player';

export default function NewsDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchNews = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/noticias/${id}`);
          setNews(res.data);
        } catch (error) {
          console.error('Error fetching news', error);
        } finally {
          setLoading(false);
        }
      };
      fetchNews();
    }
  }, [id]);

  if (loading) return <Layout><p className="text-center py-20">Cargando...</p></Layout>;
  if (!news) return <Layout><p className="text-center py-20">Video de noticia no encontrado</p></Layout>;

  return (
    <Layout title={news.title}>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{news.title}</h1>
          <p className="text-gray-500 mb-6">{new Date(news.publishedAt).toLocaleDateString()}</p>
          <div className="aspect-w-16 aspect-h-9 mb-8">
            <ReactPlayer url={news.youtubeUrl} width="100%" height="100%" controls />
          </div>
          <p className="text-lg leading-relaxed">{news.description}</p>
        </div>
      </div>
    </Layout>
  );
}