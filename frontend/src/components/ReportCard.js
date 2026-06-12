import Link from 'next/link';

export default function ReportCard({ report }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{report.description}</p>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {new Date(report.publishedAt).toLocaleDateString()}
        </span>
        <a
            href={`${process.env.NEXT_PUBLIC_BASE_URL}${report.fileUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition"
        >
        Ver PDF
        </a>
      </div>
    </div>
  );
}

