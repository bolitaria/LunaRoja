import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/axios';
import Layout from '../../components/Layout';

export default function ReportDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      try {
        const res = await api.get(`/reports/${id}`);
        setReport(res.data);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('No se pudo cargar la entrada.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <Layout title="Cargando..." bgClass="bg-gradient-to-b from-lime-50 to-white min-h-screen">
        <div className="container mx-auto px-4 py-16 text-center text-gray-600">Cargando entrada...</div>
      </Layout>
    );
  }

  if (error || !report) {
    return (
      <Layout title="Error" bgClass="bg-gradient-to-b from-lime-50 to-white min-h-screen">
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">{error || 'Entrada no encontrada'}</p>
          <Link href="/reportes" className="text-red-600 hover:underline">← Volver a Blog/Reportes</Link>
        </div>
      </Layout>
    );
  }

  const dateStr = report.publishedAt || report.published_at || report.created_at || report.createdAt;
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Fecha desconocida';

  const isBlog = report.type === 'blog';

  return (
    <Layout title={`${report.title} - Voces Palestinas por la Justicia`} bgClass="bg-gradient-to-b from-cyan-50 to-white min-h-screen">
      <article className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <Link href="/reportes" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#E4312B] transition group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Blog/Reportes
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isBlog ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isBlog ? '📝 Blog' : '📄 Reporte'}
          </span>
          {report.author && <span className="text-sm text-gray-500">✍️ {report.author}</span>}
          <span className="text-sm text-gray-400">{formattedDate}</span>
          {report.source && <span className="text-sm text-gray-400">· Fuente: {report.source}</span>}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 leading-tight mb-6">
          {report.title}
        </h1>

        {report.featuredImage && (
          <div className="mb-10 rounded-xl overflow-hidden shadow-md">
            <img
              src={report.featuredImage}
              alt={report.title}
              className="w-full h-auto max-h-[500px] object-cover"
              onError={(e) => e.target.style.display = 'none'}
              loading="lazy"
            />
          </div>
        )}

        {report.description && (
          <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Resumen</h2>
            <p className="text-gray-600 leading-relaxed">{report.description}</p>
          </div>
        )}

        {report.content ? (
          <div
            className="prose prose-lg max-w-none text-gray-800 prose-headings:text-gray-900 prose-a:text-[#E4312B] prose-a:underline prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: report.content }}
          />
        ) : (
          <p className="text-gray-500 italic text-center py-12">Este artículo no tiene contenido aún.</p>
        )}

        {report.fileUrl && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Archivo adjunto</h3>
            <a
              href={report.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar archivo
            </a>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link href="/reportes" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#E4312B] transition group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Blog/Reportes
          </Link>
        </div>
      </article>
    </Layout>
  );
}