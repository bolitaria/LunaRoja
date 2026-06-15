import Link from 'next/link';

export default function ReportCard({ report }) {
  if (!report) return null;

  return (
    <div className="bg-green-50 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <Link href={`/reports/${report.id}`}>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">{report.title}</h3>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {new Date(report.publishedAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-600 text-sm line-clamp-3">{report.description}</p>
        </div>
        {report.fileUrl && (
          <div className="px-4 pb-4">
            <a
              href={report.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-700 text-sm font-medium hover:underline inline-flex items-center gap-1"
            >
              Descargar documento
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </a>
          </div>
        )}
      </Link>
    </div>
  );
}