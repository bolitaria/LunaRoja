import { FaTh, FaList } from 'react-icons/fa';

/**
 * Toggle reutilizable mosaico (grid) / lista (table).
 * Estilo consistente con Actions/Campaigns.
 */
export default function ViewToggle({ viewMode, onChange, accentColor = 'fuchsia' }) {
  const btn = (mode, icon, title) => {
    const isActive = viewMode === mode;
    return (
      <button
        type="button"
        onClick={() => onChange(mode)}
        className={`inline-flex items-center gap-1 px-3 py-1.5 transition-colors focus:outline-none ${
          mode === 'grid' ? 'rounded-l-lg' : 'rounded-r-lg'
        } ${
          isActive
            ? `bg-${accentColor}-100 text-${accentColor}-700`
            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
        title={title}
        aria-label={title}
        aria-pressed={isActive}
      >
        {icon}
      </button>
    );
  };

  return (
    <div className="inline-flex rounded-lg shadow-sm">
      {btn('grid', <FaTh className="w-4 h-4" />, 'Vista mosaico')}
      {btn('table', <FaList className="w-4 h-4" />, 'Vista lista')}
    </div>
  );
}
