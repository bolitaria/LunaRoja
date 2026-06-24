import { useState, useRef, useEffect } from 'react';

const PRESET_COLORS = [
  // Rojos y rosas
  '#FF0000', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D',
  '#EF4444', '#F87171', '#FCA5A5', '#FECACA',
  '#E53E3E', '#C53030', '#9B2C2C',
  '#FF6B6B', '#FF8A8A', '#FFB3B3',
  // Naranjas
  '#FF7F00', '#DD6B20', '#ED8936', '#F59E0B', '#D97706',
  '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7',
  '#FF9F1C', '#FFBF69',
  // Amarillos
  '#FFFF00', '#F6E05E', '#FDE047', '#FEF08A', '#FEF9C3',
  '#EAB308', '#CA8A04',
  // Verdes
  '#00FF00', '#38A169', '#48BB78', '#10B981', '#059669',
  '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5',
  '#22C55E', '#16A34A', '#15803D',
  '#4ADE80', '#86EFAC',
  // Turquesas y cian
  '#00FFFF', '#319795', '#4FD1C5', '#06B6D4', '#0891B2',
  '#22D3EE', '#67E8F9', '#A5F3FC', '#CFFAFE',
  '#2DD4BF', '#14B8A6',
  // Azules
  '#0000FF', '#3182CE', '#3B82F6', '#2563EB', '#1D4ED8',
  '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE',
  '#0EA5E9', '#0284C7', '#0369A1',
  // Púrpuras
  '#8B00FF', '#805AD5', '#8B5CF6', '#7C3AED', '#6D28D9',
  '#A78BFA', '#C4B5FD', '#DDD6FE',
  '#8B5CF6', '#7C3AED',
  // Magentas
  '#FF00FF', '#D53F8C', '#EC4899', '#DB2777', '#BE185D',
  '#F472B6', '#F9A8D4', '#FBCFE8',
  '#E879A8', '#F06292',
  // Marrones y tierra
  '#8B4513', '#92400E', '#78350F', '#451A03',
  '#D97706', '#B45309',
  '#A0522D', '#8B6914',
  // Grises
  '#6B7280', '#4B5563', '#374151', '#1F2937',
  '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6',
  // Pasteles
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E8BAFF',
  '#FFD1DC', '#FFE5B4', '#FDFD96', '#B5EAD7', '#C7CEEA', '#F5B7B1',
  // Brillantes
  '#FF4500', '#FFA500', '#32CD32', '#00CED1', '#1E90FF', '#8A2BE2',
  '#FF1493', '#00FF7F', '#FFD700', '#FF6347', '#7FFF00', '#00BFFF',
  // Otros
  '#2C3E50', '#E74C3C', '#3498DB', '#2ECC71', '#F1C40F', '#9B59B6',
  '#1ABC9C', '#E67E22', '#34495E', '#ECF0F1'
];

const ColorPicker = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const popupRef = useRef(null);
  const buttonRef = useRef(null);

  const handleSelect = (color) => {
    onChange(color);
    setCustomColor(color);
    setIsOpen(false);
  };

  const handleCustomChange = (e) => {
    const color = e.target.value;
    setCustomColor(color);
    onChange(color);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow flex items-center justify-center"
        style={{ backgroundColor: value }}
        title="Seleccionar color"
      >
        <span className="sr-only">Color: {value}</span>
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          className="absolute z-50 top-0 left-full ml-2 bg-white p-4 rounded-xl shadow-2xl border border-gray-200 w-96 max-h-96 overflow-y-auto"
          style={{ minWidth: '320px' }}
        >
          <div className="grid grid-cols-8 gap-1 justify-center">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleSelect(color)}
                className="w-8 h-8 rounded-full border-2 border-transparent hover:border-gray-500 transition-all transform hover:scale-110"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-gray-200 pt-3">
            <label className="text-xs text-gray-500 flex-1">Personalizado:</label>
            <input
              type="color"
              value={customColor}
              onChange={handleCustomChange}
              className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
            />
            <span className="text-xs text-gray-400">{customColor}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;