import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { exportInfo } from '../../../utils/exportInfo';
import { FaFileExport, FaSearch, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import Pagination from '../../../components/Pagination';

function AdminImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [exportFormat, setExportFormat] = useState('csv');
  const itemsPerPage = 10;

  const fetchImages = async () => {
    try {
      const res = await api.get('/images');
      setImages(res.data);
    } catch (err) {
      toast.error('Error al cargar imágenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImages(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      await api.delete(`/images/${id}`);
      toast.success('Imagen eliminada');
      fetchImages();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (!confirm(`¿Eliminar ${selected.length} imágenes?`)) return;
    try {
      await Promise.all(selected.map(id => api.delete(`/images/${id}`)));
      toast.success(`${selected.length} imágenes eliminadas`);
      setSelected([]);
      fetchImages();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const exportAll = () => {
    const headers = ['id', 'url', 'relatedTitle', 'relatedType', 'createdAt'];
    const data = images.map(img => ({
      id: img.id,
      url: img.url,
      relatedTitle: img.relatedTitle || '',
      relatedType: img.relatedType === 'report' ? 'Reporte' : 'Acción',
      createdAt: new Date(img.createdAt).toLocaleString()
    }));
    exportInfo(data, headers, 'imagenes', exportFormat);
  };

  const filtered = images.filter(img => (img.relatedTitle || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(paginated.map(img => img.id));
    else setSelected([]);
  };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout title="Imágenes">
      <ToastContainer />

      {/* Métricas */}
      <div className="bg-amber-50/80 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-6 text-sm border border-amber-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Total</span>
          <span className="font-bold text-gray-800">{images.length}</span>
        </div>
      </div>

      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-3">
        <h2 className="text-2xl font-bold text-gray-800">Imágenes</h2>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button onClick={handleDeleteSelected} className="inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
              <FaTrash /> Eliminar ({selected.length})
            </button>
          )}
        </div>
      </div>

      {/* Búsqueda y exportación */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-full"
          />
        </div>
        <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
          <option value="csv">CSV</option>
          <option value="xlsx">Excel</option>
          <option value="txt">Texto</option>
        </select>
        <button onClick={exportAll} className="text-sm text-gray-500 hover:text-gray-700">
          <FaFileExport className="w-4 h-4" />
        </button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-purple-100 text-sm">
            <thead className="bg-fuchsia-50 text-fuchsia-800 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-left w-10">
                  <input type="checkbox" onChange={toggleSelectAll} checked={paginated.length > 0 && selected.length === paginated.length} />
                </th>
                <th className="px-6 py-3 text-left">Imagen</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Relacionado</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Tipo</th>
                <th className="px-6 py-3 text-left hidden lg:table-cell">Fecha</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {paginated.map(img => (
                <tr key={img.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><input type="checkbox" checked={selected.includes(img.id)} onChange={() => toggleOne(img.id)} /></td>
                  <td className="px-6 py-4">
                    <img src={`${process.env.NEXT_PUBLIC_BASE_URL}${img.url}`} alt="" className="h-10 w-10 object-cover rounded" />
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{img.relatedTitle || '-'}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{img.relatedType === 'report' ? 'Reporte' : 'Acción'}</td>
                  <td className="px-6 py-4 hidden lg:table-cell text-gray-500">{new Date(img.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(img.id)} className="p-1.5 text-gray-400 hover:text-red-600"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminImages;