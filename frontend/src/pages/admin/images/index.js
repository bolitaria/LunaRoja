import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { exportInfo } from '../../../utils/exportInfo';
import { FaFileExport, FaSearch, FaTrash, FaImage, FaList, FaTh } from 'react-icons/fa';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';

function AdminImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');
  const itemsPerPage = viewMode === 'grid' ? 12 : 10;

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

  const handleDelete = (id) => { setDeleteTarget(id); setShowDeleteModal(true); };
  const handleDeleteSelected = () => { if (selected.length === 0) return; setDeleteTarget(selected); setShowDeleteModal(true); };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/images/${id}`)));
      toast.success(`${ids.length} imagen(es) eliminada(s)`);
      setSelected([]);
      fetchImages();
    } catch (err) {
      toast.error('Error al eliminar');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
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

  const total = images.length;

  return (
    <AdminLayout title="Imágenes">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar imagen"
        message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} imágenes?` : '¿Eliminar esta imagen?')}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      <div className="bg-gray-50/80 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-6 text-sm border border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Total</span>
          <span className="font-bold text-gray-800">{total}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Acciones</span>
          <span className="font-bold text-gray-800">{images.filter(i => i.relatedType === 'action').length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Blog/Reportes</span>
          <span className="font-bold text-gray-800">{images.filter(i => i.relatedType === 'report').length}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <FaTh /> Galería
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <FaList /> Lista
          </button>
          {selected.length > 0 && (
            <button onClick={handleDeleteSelected} className="inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
              <FaTrash /> Eliminar ({selected.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-48"
            />
          </div>
          <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-xs">
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
            <option value="txt">Texto</option>
          </select>
          <button onClick={exportAll} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors" title="Exportar">
            <FaFileExport className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FaImage className="mx-auto text-4xl mb-3" />
          <p className="text-lg">No se encontraron imágenes</p>
          <p className="text-sm">Sube imágenes desde acciones o reportes.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {paginated.map(img => (
            <div key={img.id} className="relative group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-100 relative">
                <img
                  src={`${process.env.NEXT_PUBLIC_BASE_URL}${img.url}`}
                  alt={img.relatedTitle || 'Imagen'}
                  className="w-full h-full object-cover"
                />
                <input
                  type="checkbox"
                  checked={selected.includes(img.id)}
                  onChange={() => toggleOne(img.id)}
                  className="absolute top-2 left-2 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500"
                />
                <button
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
              <div className="p-2 text-xs">
                <p className="font-medium text-gray-700 truncate">{img.relatedTitle || 'Sin título'}</p>
                <p className="text-gray-500">{img.relatedType === 'report' ? 'Reporte' : 'Acción'}</p>
                <p className="text-gray-400 text-[10px]">{new Date(img.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {paginated.map(img => (
                <tr key={img.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selected.includes(img.id)} onChange={() => toggleOne(img.id)} />
                  </td>
                  <td className="px-6 py-4">
                    <img src={`${process.env.NEXT_PUBLIC_BASE_URL}${img.url}`} alt="" className="h-10 w-10 object-cover rounded" />
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{img.relatedTitle || '-'}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{img.relatedType === 'report' ? 'Reporte' : 'Acción'}</td>
                  <td className="px-6 py-4 hidden lg:table-cell text-gray-500">{new Date(img.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(img.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <FaTrash className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </AdminLayout>
  );
}

export default AdminImages;