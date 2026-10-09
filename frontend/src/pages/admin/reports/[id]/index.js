// frontend/src/pages/admin/reports/[id]/index.js
import api from '../../../../lib/axios';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import {
  FaArrowLeft, FaEdit, FaPaperclip, FaNewspaper, FaFileAlt,
  FaExternalLinkAlt, FaCalendarAlt, FaTag, FaUserEdit,
} from 'react-icons/fa';

// ─── Helpers ────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch { return '—'; }
}

function fmtDateTime(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

// ─── Página ─────────────────────────────────────────────────
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
        const payload = res.data?.data ?? res.data;
        setReport(payload);
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

  const isBlog = report.type === 'blog';
  const typeLabel = isBlog ? 'Blog' : 'Reporte';
  const typeBadge = isBlog ? 'bg-fuchsia-100 text-fuchsia-800' : 'bg-blue-100 text-blue-800';
  const accentBar = isBlog ? 'bg-fuchsia-500' : 'bg-blue-500';
  const typeIcon = isBlog
    ? <FaNewspaper className="w-3 h-3" />
    : <FaFileAlt className="w-3 h-3" />;

  // bibliografía: puede venir como array o como string JSON
  let bibliography = report.bibliography;
  if (typeof bibliography === 'string') {
    try { bibliography = JSON.parse(bibliography); } catch { bibliography = null; }
  }

  return (
    <AdminLayout title="Reporte">
      <ToastContainer />

      {/* Volver */}
      <button
        type="button"
        onClick={() => router.push('/admin/reports')}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <FaArrowLeft /> Volver a Reportes
      </button>

      <div className="max-w-4xl mx-auto">
        <article className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Barra de color superior */}
          <div className={`h-1.5 w-full ${accentBar}`} />

          {/* HEADER */}
          <header className="px-6 sm:px-8 pt-6 pb-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeBadge}`}>
                    {typeIcon}
                    {typeLabel}
                  </span>
                  <span className="text-xs text-gray-400">ID #{report.id}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight break-words">
                  {report.title}
                </h1>
              </div>
              <Link
                href={`/admin/reports/${report.id}/edit`}
                className="flex-shrink-0 inline-flex items-center gap-2 text-sm font-medium border border-fuchsia-300 text-fuchsia-700 bg-white px-4 py-2 rounded-lg hover:bg-fuchsia-50 transition-colors"
              >
                <FaEdit className="w-3.5 h-3.5" /> Editar
              </Link>
            </div>

            {/* Metadata en grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
              <MetaItem icon={<FaCalendarAlt />} label="Publicado" value={fmtDate(report.publishedAt)} />
              <MetaItem icon={<FaTag />} label="Fuente" value={report.source || '—'} />
              <MetaItem icon={<FaUserEdit />} label="Autor" value={report.author || '—'} />
            </div>
          </header>

          {/* BODY */}
          <div className="px-6 sm:px-8 py-8 space-y-8">

            {/* Descripción */}
            {report.description && (
              <Section title="Descripción">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.description}</p>
              </Section>
            )}

            {/* Contenido (HTML renderizado) */}
            {report.content && (
              <Section title="Contenido">
                <div
                  className="text-gray-700 leading-relaxed
                    [&_p]:mb-3 [&_p:last-child]:mb-0
                    [&_a]:text-red-700 [&_a]:underline hover:[&_a]:text-red-800
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
                    [&_li]:mb-1
                    [&_strong]:font-bold [&_em]:italic
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
                    [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2
                    [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600
                    [&_img]:rounded-lg [&_img]:my-3 [&_img]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: report.content }}
                />
              </Section>
            )}

            {/* Archivo adjunto */}
            {report.fileUrl && (
              <Section title="Archivo adjunto">
                <a
                  href={report.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <FaPaperclip /> Abrir documento <FaExternalLinkAlt className="w-3 h-3 opacity-60" />
                </a>
              </Section>
            )}

            {/* Bibliografía (solo reports con fuentes) */}
            {!isBlog && Array.isArray(bibliography) && bibliography.length > 0 && (
              <Section title={`Fuentes bibliográficas (${bibliography.length})`}>
                <ul className="space-y-2">
                  {bibliography.map((b, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        {b.source && (
                          <p className="text-sm font-semibold text-gray-800">{b.source}</p>
                        )}
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-red-700 hover:underline break-all inline-flex items-center gap-1"
                        >
                          <FaExternalLinkAlt className="w-2.5 h-2.5 flex-shrink-0" />
                          {b.url}
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Aviso si falta bibliografía */}
            {!isBlog && (!Array.isArray(bibliography) || bibliography.length === 0) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                ⚠️ Este reporte no tiene fuentes bibliográficas. El backend exige al menos una al editarlo.
              </div>
            )}
          </div>

          {/* FOOTER */}
          <footer className="px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 justify-between">
            <span>Creado: {fmtDateTime(report.createdAt)}</span>
            <span>Actualizado: {fmtDateTime(report.updatedAt)}</span>
          </footer>
        </article>
      </div>
    </AdminLayout>
  );
}

// ─── Sub-componentes ────────────────────────────────────────
function MetaItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label}</p>
        <p className="text-sm text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 pb-2 border-b border-gray-100">
        {title}
      </h2>
      {children}
    </section>
  );
}
