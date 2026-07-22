import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import axios from 'axios';
import { FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';

export default function SingleLink() {
  const router = useRouter();
  const { id } = router.query;
  const [link, setLink] = useState(null);
  const [error, setError] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (!id) return;
    axios.get(`${apiUrl}/links/public`)
      .then(res => {
        const allLinks = Object.values(res.data).flat();
        const found = allLinks.find(l => l.id === id);
        if (found) setLink(found);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [id, apiUrl]);

  useEffect(() => {
    if (!link) return;
    const timer = setTimeout(() => {
      router.push(link.url);
    }, 3500);
    return () => clearTimeout(timer);
  }, [link, router]);

  if (!id || error) {
    return (
      <Layout title="Enlace no encontrado">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Enlace no encontrado</h1>
          <p className="text-gray-600 mb-8">El enlace que buscas no existe o ha sido desactivado.</p>
          <Link href="/links" className="text-[#E4312B] hover:underline font-medium">
            ← Volver a Links de interés
          </Link>
        </div>
      </Layout>
    );
  }

  if (!link) {
    return (
      <Layout title="Cargando...">
        <div className="flex items-center justify-center py-20">
          <FaSpinner className="animate-spin text-[#008000] w-10 h-10" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${link.title} - Voces Palestinas por la Justicia`}>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center transform transition-all animate-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaExternalLinkAlt className="text-[#008000] w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{link.title}</h2>
          {link.description && <p className="text-gray-600 mb-6">{link.description}</p>}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <FaSpinner className="animate-spin w-4 h-4 text-[#008000]" />
            <span>Redirigiendo al sitio externo...</span>
          </div>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#008000] hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            <FaExternalLinkAlt /> Ir ahora
          </a>
          <p className="mt-4 text-xs text-gray-400">
            Serás redirigido automáticamente en unos segundos
          </p>
        </div>
      </div>
    </Layout>
  );
}