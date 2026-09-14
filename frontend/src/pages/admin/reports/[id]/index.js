// frontend/src/pages/admin/reports/[id]/index.js
import api from '../../../../lib/axios';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import ReportPreview from '../../../../components/ReportPreview';
import { FaArrowLeft, FaEdit, FaPaperclip, FaNewspaper, FaFileAlt } from 'react-icons/fa';

export default function ViewReport() {
  const router = useRouter();
  const { id } = router.query;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      try {
        const res = await api.get(`/reports/${id}`);
        setReport(res.data);
      } catch (error) {
        console.error('Error al cargar reporte:', error);
        toast.error(error.response?.data?.message || 'Error al cargar el reporte');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return <AdminLayout title="Reporte"><p className="text-center py-8">Cargando...</p></AdminLayout>;
  }

  if (!report) {
    return (
      <AdminLayout title="Reporte">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Reporte no encontrado</p>
          <button onClick={() => router.push('/admin/reports')} className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg">
            Volver a la lista
          </button>
        </div>
      </AdminLayout>
    );
  }

  const typeLabel = report.type === 'blog' ? 'Blog' : 'Reporte';
  const typeStyle = report.type === 'blog'
    ? 'bg-fuchsia-100 text-fuchsia-800'
    : 'bg-blue-100 text-blue-800';

  return (
    <AdminLayout title="Reporte">
      <ToastContainer />
      <button
        type="button"
        onClick={() => router.push('/admin/reports')}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <FaArrowLeft /> Volver a Reportes
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Columna izquierda: detalle */}
        <div className="lg:w-2/3 lg:self-start space-y-6">
          {/* Tarjeta principal con título + botón Editar */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {report.type === 'blog'
                  ? <FaNewspaper className="text-fuchsia-500 w-6 h-6 mt-1 flex-shrink-0" />
                  : <FaFileAlt className="text-blue-500 w-6 h-6 mt-1 flex-shrink-0" />}
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-gray-800">{report.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeStyle}`}>
                      {typeLabel}
                    </span>
                    {report.publishedAt && (
                      <span className="text-xs text-gray-500">
                        📅 {new Date(report.publishedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                    {report.source && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                        🏷️ {report.source}
                      </span>
                    )}
                    {report.author && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                        ✍️ {report.author}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Link
                href={`/admin/reports/${report.id}/edit`}
                className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-medium border border-fuchsia-300 text-fuchsia-700 bg-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors"
              >
                <FaEdit className="w-3.5 h-3.5" /> Editar
              </Link>
            </div>
          </div>

          {/* Descripción */}
          {report.description && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Descripción</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
            </div>
          )}

          {/* Contenido */}
          {report.content && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Contenido</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{report.content}</p>
            </div>
          )}

          {/* Adjunto */}
          {report.fileUrl && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Archivo adjunto</h2>
              <a
                href={report.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <FaPaperclip /> Abrir documento
              </a>
            </div>
          )}

          {/* Metadata admin */}
          <div className="text-xs text-gray-400 pt-2">
            ID: {report.id} · Creado: {new Date(report.createdAt).toLocaleString()} · Actualizado: {new Date(report.updatedAt).toLocaleString()}
          </div>
        </div>

        {/* Columna derecha: preview */}
        <div className="lg:w-1/3 lg:self-start">
          <ReportPreview form={report} />
        </div>
      </div>
    </AdminLayout>
  );
}
