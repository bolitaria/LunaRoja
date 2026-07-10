import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/axios';
import Layout from '../components/Layout';
import NewsCard from '../components/NewsCard';
import ReportCard from '../components/ReportCard';
import ActionCard from '../components/ActionCard';
import GalleryCard from '../components/GalleryCard';

export default function Home() {
  const [news, setNews] = useState([]);
  const [reports, setReports] = useState([]);
  const [actions, setActions] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsRes, reportsRes, actionsRes, galleryRes] = await Promise.allSettled([
          api.get('/news'),
          api.get('/reportes'),
          api.get('/actions'),
          api.get('/images'),
        ]);

        // Noticias
        if (newsRes.status === 'fulfilled') {
          const filteredNews = newsRes.value.data.filter((noticia) => {
            const isNews = noticia.isNews === true;
            const isGeneral =
              (noticia.campaignId == null || noticia.campaignId === '') &&
              (noticia.actionId == null || noticia.actionId === '');
            return isNews || isGeneral;
          });
          setNews(filteredNews.slice(0, 3));
        } else {
          setErrors(prev => ({ ...prev, news: 'Error al cargar noticias' }));
        }

        // Blog/Reportes
        if (reportsRes.status === 'fulfilled') {
          setReports(reportsRes.value.data.slice(0, 3));
        } else {
          setErrors(prev => ({ ...prev, reports: 'No se pudieron cargar los reportes' }));
        }

        // Acciones
        if (actionsRes.status === 'fulfilled') {
          setActions(actionsRes.value.data.slice(0, 3));
        } else {
          setErrors(prev => ({ ...prev, actions: 'Error al cargar acciones' }));
        }

        // Imágenes (galería)
        if (galleryRes.status === 'fulfilled') {
          const images = galleryRes.value.data.map(img => ({
            id: img.id,
            imageUrl: img.url,
            title: img.relatedTitle || 'Imagen'
          }));
          setGallery(images.slice(0, 6));
        } else {
          setErrors(prev => ({ ...prev, gallery: 'Galería no disponible' }));
        }
      } catch (error) {
        console.error('Error general al cargar datos:', error);
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
            Unidos por la justicia, para dar voz a Palestina y a cada voz que merece ser escuchada
          </p>
          <Link
            href="/about"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors hover:text-red-600"
          >
            Conoce más
          </Link>
        </div>
      </section>

      {/* Galería */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-600">Galería</h2>
          {loading ? (
            <p className="text-center text-gray-600">Cargando galería...</p>
          ) : gallery.length === 0 ? (
            <p className="text-center text-gray-600">{errors.gallery || 'No hay imágenes disponibles.'}</p>
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
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-600">Últimas Acciones</h2>
          {loading ? (
            <p className="text-center text-gray-600">Cargando acciones...</p>
          ) : actions.length === 0 ? (
            <p className="text-center text-gray-600">{errors.actions || 'No hay acciones disponibles.'}</p>
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
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-600">Últimas Noticias</h2>
          {loading ? (
            <p className="text-center text-gray-600">Cargando noticias...</p>
          ) : news.length === 0 ? (
            <p className="text-center text-gray-600">{errors.news || 'No hay noticias disponibles.'}</p>
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

      {/* Últimos Blog/Reportes */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Blog/Reportes recientes</h2>
          {loading ? (
            <p className="text-center text-gray-600">Cargando entradas de Blog y reportes...</p>
          ) : reports.length === 0 ? (
            <p className="text-center text-gray-600">{errors.reports || 'No hay entradas de Blog o reportes disponibles.'}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link href="/reportes" className="text-red-700 font-semibold hover:underline">
              Ver todos los Blog/Reportes →
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}