import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Layout from '../components/Layout';
import NewsCard from '../components/NewsCard';
import ReportCard from '../components/ReportCard';
import InstagramPostCard from '../components/InstagramPostCard';

export default function Home() {
  const [news, setNews] = useState([]);
  const [reports, setReports] = useState([]);
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingInstagram, setLoadingInstagram] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsRes, reportsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/news`),

          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`),
        ]);

        // Filtrar noticias: solo noticias o sin campaña/acción (igual que antes)
        const filteredNews = newsRes.data.filter(news => {
          const isNews = news.isNews === true;
          const isGeneral = (news.campaignId == null || news.campaignId === '') &&
                            (news.actionId == null || news.actionId === '');
          return isNews || isGeneral;
        });

        setNews(filteredNews.slice(0, 3));
        setReports(reportsRes.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchInstagramPosts = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/instagram/posts?limit=3`);
        setInstagramPosts(res.data.posts || []);
      } catch (error) {
        console.error('Error fetching Instagram posts:', error);
      } finally {
        setLoadingInstagram(false);
      }
    };

    fetchData();
    fetchInstagramPosts();
  }, []);

  return (
    <Layout title="Inicio - LunaRoja">
      {/* Hero section */}
      <section className="bg-red-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">LunaRoja</h1>
          <p className="text-xl mb-8">Unidos por una causa: información, conciencia y acción.</p>
          <Link href="/about" className="bg-white text-red-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Conoce más
          </Link>
        </div>
      </section>

      {/* Noticias (videos) */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Últimas Noticias</h2>
          {loading ? (
            <p className="text-center">Cargando vídeos...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map(news => (
                <NewsCard key={news.id} video={news} />
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/news" className="text-red-700 font-semibold hover:underline">
              Ver todas →
            </Link>
          </div>
        </div>
      </section>

      {/* Instagram */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Últimas Publicaciones en Instagram</h2>
          {loadingInstagram ? (
            <p className="text-center">Cargando publicaciones...</p>
          ) : instagramPosts.length === 0 ? (
            <p className="text-center">No hay publicaciones recientes.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {instagramPosts.map(post => (
                <InstagramPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/instagram" className="text-red-700 font-semibold hover:underline">
              Ver más en Instagram →
            </Link>
          </div>
        </div>
      </section>

      {/* Últimos reportes */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Reportes recientes</h2>
          {loading ? (
            <p className="text-center">Cargando reportes...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reports.map(report => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/reports" className="text-red-700 font-semibold hover:underline">
              Ver todos los reportes →
            </Link>
          </div>
        </div>
      </section>

      {/* Llamado a la acción */}
      <section className="bg-gray-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Mantente informado</h2>
          <p className="text-lg mb-8">Recibe nuestras novedades y recordatorios directamente en tu correo.</p>
          <Link href="/contact" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition">
            Suscríbete ahora
          </Link>
        </div>
      </section>
    </Layout>
  );
}