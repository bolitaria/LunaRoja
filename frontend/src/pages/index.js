import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Layout from '../components/Layout';
import NewsCard from '../components/NewsCard';
import ReportCard from '../components/ReportCard';
import ActionCard from '../components/ActionCard';
import GalleryCard from '../components/GalleryCard';

// Datos de prueba para galería (si el endpoint falla)
const GALLERY_MOCK = [
  { id: 1, imageUrl: 'https://via.placeholder.com/300x200?text=Palestina+1', title: 'Foto 1' },
  { id: 2, imageUrl: 'https://via.placeholder.com/300x200?text=Palestina+2', title: 'Foto 2' },
  { id: 3, imageUrl: 'https://via.placeholder.com/300x200?text=Palestina+3', title: 'Foto 3' },
  { id: 4, imageUrl: 'https://via.placeholder.com/300x200?text=Palestina+4', title: 'Foto 4' },
  { id: 5, imageUrl: 'https://via.placeholder.com/300x200?text=Palestina+5', title: 'Foto 5' },
  { id: 6, imageUrl: 'https://via.placeholder.com/300x200?text=Palestina+6', title: 'Foto 6' },
];

export default function Home() {
  const [news, setNews] = useState([]);
  const [reports, setReports] = useState([]);
  const [actions, setActions] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsRes, reportsRes, actionsRes, galleryRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/news`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/actions`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/gallery`).catch(() => ({ data: GALLERY_MOCK })), // fallback
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
        setActions(actionsRes.data.slice(0, 3));
        setGallery(galleryRes.data.slice(0, 6));
      } catch (error) {
        console.error('Error fetching data:', error);
        // Si hay error, usa el mock para la galería
        setGallery(GALLERY_MOCK);
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

      {/* GALERÍA PRIMERO */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Galería</h2>
          {loading ? (
            <p className="text-center text-gray-600">Cargando galería...</p>
          ) : gallery.length === 0 ? (
            <p className="text-center text-gray-600">No hay imágenes disponibles.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {gallery.map((item) => (
                <GalleryCard key={item.id} item={item} />
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/galeria" className="text-red-700 font-semibold hover:underline">
              Ver toda la galería →
            </Link>
          </div>
        </div>
      </section>

            {/* Últimas Acciones */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Últimas Acciones</h2>
          {loading ? (
            <p className="text-center text-gray-600">Cargando acciones...</p>
          ) : actions.length === 0 ? (
            <p className="text-center text-gray-600">No hay acciones disponibles.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {actions.map((action) => (
                <ActionCard key={action.id} action={action} />
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/acciones" className="text-red-700 font-semibold hover:underline">
              Ver todas las acciones →
            </Link>
          </div>
        </div>
      </section>

      {/* Últimas Noticias */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Últimas Noticias</h2>
          {loading ? (
            <p className="text-center text-gray-600">Cargando noticias...</p>
          ) : news.length === 0 ? (
            <p className="text-center text-gray-600">No hay noticias disponibles.</p>
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

      {/* Últimos Reportes */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Reportes recientes</h2>
          {loading ? (
            <p className="text-center text-gray-600">Cargando reportes...</p>
          ) : reports.length === 0 ? (
            <p className="text-center text-gray-600">No hay reportes disponibles.</p>
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