import Link from 'next/link';

export default function ReportCard({ report }) {
  if (!report) return null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/reportes/${report.id}`}>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">{report.title}</h3>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {new Date(report.publishedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full ${report.type === 'report' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {report.type === 'report' ? '📄 Reporte' : '📝 Blog'}
            </span>
            {report.author && (
              <span className="text-xs text-gray-500">✍️ {report.author}</span>
            )}
          </div>
          <p className="text-gray-600 text-sm line-clamp-3">{report.description}</p>
          {report.source && (
            <p className="text-xs text-gray-400 mt-2">Fuente: {report.source}</p>
          )}
        </div>
      </Link>
    </div>
  );
}
