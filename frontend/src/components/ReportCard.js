import Link from 'next/link';

export default function ReportCard({ report }) {
  if (!report) return null;

  // Función para formatear tamaño de archivo (si existe)
  const formatFileSize = (bytes) => {
    if (!bytes) return null;
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/reports/${report.id}`}>
        <div className="p-4">
          {/* Fila superior: título y fecha */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">{report.title}</h3>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {new Date(report.publishedAt).toLocaleDateString()}
            </span>
          </div>

          {/* Metadatos adicionales (si existen) */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Informe
            </span>
            {report.category && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {report.category}
              </span>
            )}
            {report.author && (
              <span className="text-xs text-gray-500">
                ✍️ {report.author}
              </span>
            )}
          </div>

          {/* Descripción más larga */}
          <p className="text-gray-600 text-sm line-clamp-5">{report.description}</p>

          {/* Información del archivo (si existe fileUrl) */}
          {report.fileUrl && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {report.fileName || 'Documento'} {report.fileSize && `(${formatFileSize(report.fileSize)})`}
              </span>
              <a
                href={report.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-700 text-sm font-medium hover:underline inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()} // Evita que el clic en el enlace navegue al reporte
              >
                Descargar
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}