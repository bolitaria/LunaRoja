import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage = 10, onItemsPerPageChange }) {
  const maxVisiblePages = 5; // número máximo de botones numéricos

  // Calcular rango de páginas a mostrar con elipsis
  const getPageNumbers = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);
    const pages = [1];

    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
      {/* Selector de items por página (opcional) */}
      {onItemsPerPageChange && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Mostrar</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-fuchsia-400"
          >
            {[10, 20, 50].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span>por página</span>
        </div>
      )}

      {/* Controles de paginación simplificados */}
      <nav className="flex items-center gap-2" aria-label="Paginación">
        {/* Anterior (solo flecha) */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors focus:outline-none ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          aria-label="Página anterior"
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>

        {/* Números de página con elipsis */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) =>
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">…</span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition-colors focus:outline-none ${
                  currentPage === page
                    ? 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-300'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Siguiente (solo flecha) */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors focus:outline-none ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          aria-label="Página siguiente"
        >
          <FaChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}