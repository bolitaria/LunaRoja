import Link from 'next/link';

export default function ReportCard({ report }) {
  if (!report) return null;

  const dateStr = report.publishedAt || report.published_at || report.created_at || report.createdAt;
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Fecha desconocida';

  const isReport = report.type === 'report';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <Link href={`/reportes/${report.id}`} className="flex flex-col h-full p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">{report.title}</h3>
          <span className="text-xs text-gray-400 whitespace-nowrap">{formattedDate}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              isReport ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}
          >
            {isReport ? '📄 Reporte' : '📝 Blog'}
          </span>
          {report.author && <span className="text-xs text-gray-500">✍️ {report.author}</span>}
        </div>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-5 flex-1">
          {report.description || 'Sin descripción'}
        </p>
        {report.source && (
          <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100">
            Fuente: {report.source}
          </p>
        )}
      </Link>
    </div>
  );
}