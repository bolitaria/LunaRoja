import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Layout from '../components/Layout';
import VideoCard from '../components/VideoCard';
import ReportCard from '../components/ReportCard';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videosRes, reportsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/videos`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`)
        ]);
        setVideos(videosRes.data.slice(0, 3)); // Últimos 3 videos
        setReports(reportsRes.data.slice(0, 3)); // Últimos 3 reportes
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

      {/* Últimos videos */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Últimos videos</h2>
          {loading ? (
            <p className="text-center">Cargando videos...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {videos.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/videos" className="text-red-700 font-semibold hover:underline">
              Ver todos los videos →
            </Link>
          </div>
        </div>
      </section>

      {/* Últimos reportes */}
      <section className="py-16">
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

      {/* Llamado a la acción - suscripción */}
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