import Pagination from './Pagination';
import Link from 'next/link';
import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';

export default function DataTable({
  columns,         // [{ key, label, render?: (item) => ReactNode }]
  data,
  selected = [],
  onSelectAll,
  onSelectOne,
  onDelete,
  onEdit,          // (item) => editUrl o función
  onView,          // opcional
  actions = ['edit', 'delete'],
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
}) {
  const toggleSelectAll = (e) => {
    if (e.target.checked) onSelectAll(data.map(item => item.id));
    else onSelectAll([]);
  };

  return (
    <div className="table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left w-10">
              <input
                type="checkbox"
                onChange={toggleSelectAll}
                checked={data.length > 0 && selected.length === data.length}
              />
            </th>
            {columns.map(col => (
              <th key={col.key} className={`px-6 py-3 text-left ${col.className || ''}`}>
                {col.label}
              </th>
            ))}
            <th className="px-6 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id} className={selected.includes(item.id) ? 'selected' : ''}>
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => onSelectOne(item.id)}
                />
              </td>
              {columns.map(col => (
                <td key={col.key} className={`px-6 py-4 ${col.cellClassName || ''}`}>
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-1">
                  {onView && (
                    <button onClick={() => onView(item)} className="action-btn action-btn-edit">
                      <FaEye />
                    </button>
                  )}
                  {onEdit && (
                    <Link href={typeof onEdit === 'function' ? onEdit(item) : `#`} className="action-btn action-btn-edit">
                      <FaEdit />
                    </Link>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(item.id)} className="action-btn action-btn-delete">
                      <FaTrash />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}