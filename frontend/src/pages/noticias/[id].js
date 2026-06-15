import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function NoticiaDetalle() {
  const router = useRouter();
  const { id } = router.query;
  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchNoticia = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/news/${id}`);
          setNoticia(res.data);
        } catch (error) {
          console.error('Error fetching noticia:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchNoticia();
    }
  }, [id]);

  if (loading) return <Layout><p className="text-center py-20">Cargando...</p></Layout>;
  if (!noticia) return <Layout><p className="text-center py-20">Noticia no encontrada</p></Layout>;

  // Extraer ID de YouTube si existe la URL
  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  const videoId = getYoutubeId(noticia.youtubeUrl);

  return (
    <Layout title={noticia.title}>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">{noticia.title}</h1>
        <p className="text-gray-500 mb-4">
          {new Date(noticia.publishedAt).toLocaleDateString()}
        </p>
        <p className="text-gray-700 whitespace-pre-line mb-6">{noticia.description}</p>

        {/* Reproductor de video */}
        {videoId ? (
          <div className="aspect-video mb-8">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={noticia.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg shadow"
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
            <p>Video de noticia no encontrado.</p>
            {noticia.youtubeUrl && (
              <a
                href={noticia.youtubeUrl}
                target="_blank"
                rel="noopener"
                className="text-blue-600 underline mt-2 inline-block"
              >
                Ver en YouTube
              </a>
            )}
          </div>
        )}

        {/* Enlace para volver */}
        <div className="mt-8">
          <Link href="/noticias" className="text-red-700 hover:underline">
            ← Volver a noticias
          </Link>
        </div>
      </div>
    </Layout>
  );
}