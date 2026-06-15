import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Layout from '../components/Layout';
import NewsCard from '../components/NewsCard';
import ReportCard from '../components/ReportCard';

export default function Home() {
  const [news, setNews] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsRes, reportsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/news`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`),
        ]);

        const filteredNews = newsRes.data.filter((noticia) => {
          const isNews = noticia.isNews === true;
          const isGeneral =
            (noticia.campaignId == null || noticia.campaignId === '') &&
            (noticia.actionId == null || noticia.actionId === '');
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

    fetchData();
  }, []);

  return (
    <Layout title="Inicio - Voces Palestinas por la Justicia">
      {/* Hero */}
      <section className="bg-red-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
            Voces Palestinas por la Justicia
          </h1>
          <p className="text-lg mb-8">
            Unidos por la justicia, para dar voz al pueblo Palestino y a todas las causas que necesitan voz y justicia.
          </p>
          <Link
            href="/about"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors hover:text-red-600"
          >
            Conoce más
          </Link>
        </div>
      </section>

      {/* Últimas Noticias – fondo blanco */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Últimas Noticias</h2>
          {loading ? (
            <p className="text-center">Cargando noticias...</p>
          ) : news.length === 0 ? (
            <p className="text-center">No hay noticias disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((noticia) => (
                <NewsCard key={noticia.id} noticia={noticia} />
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/noticias" className="text-red-700 font-semibold hover:underline">
              Ver todas →
            </Link>
          </div>
        </div>
      </section>

      {/* Últimos Reportes – fondo blanco */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Reportes recientes</h2>
          {loading ? (
            <p className="text-center">Cargando reportes...</p>
          ) : reports.length === 0 ? (
            <p className="text-center">No hay reportes disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reports.map((report) => (
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
    </Layout>
  );
}