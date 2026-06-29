import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { exportInfo } from '../../../utils/exportInfo';
import { FaFileExport, FaSearch, FaTrash } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import Pagination from '../../../components/Pagination';

function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [exportFormat, setExportFormat] = useState('csv');
  const itemsPerPage = 10;

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Documento eliminado');
      fetchDocuments();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (!confirm(`¿Eliminar ${selected.length} documentos?`)) return;
    try {
      await Promise.all(selected.map(id => api.delete(`/documents/${id}`)));
      toast.success(`${selected.length} documentos eliminados`);
      setSelected([]);
      fetchDocuments();
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const exportAll = () => {
    const headers = ['title', 'description', 'type', 'campaignId', 'actionId', 'createdAt'];
    const data = documents.map(d => ({
      title: d.title,
      description: d.description || '',
      type: d.type === 'organizer' ? 'Privado' : 'Público',
      campaignId: d.campaignId || '',
      actionId: d.actionId || '',
      createdAt: new Date(d.createdAt).toLocaleString()
    }));
    exportInfo(data, headers, 'documentos', exportFormat);
  };

  const filtered = documents.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(paginated.map(d => d.id));
    else setSelected([]);
  };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout title="Documentos">
      <ToastContainer />

      {/* Métricas */}
      <div className="bg-amber-50/80 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-6 text-sm border border-amber-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Total</span>
          <span className="font-bold text-gray-800">{documents.length}</span>
        </div>
      </div>

      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-3">
        <h2 className="text-2xl font-bold text-gray-800">Documentos</h2>
        <div className="flex items-center gap-2">
          <Link href="/admin/documents/new" className="inline-flex items-center gap-1.5 text-sm font-medium border-2 border-fuchsia-300 text-fuchsia-700 bg-white px-4 py-2 rounded-lg hover:bg-fuchsia-50 transition-colors shadow-sm">
            Subir Documento
          </Link>
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
            placeholder="Buscar documento..."
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
                <th className="px-6 py-3 text-left">Título</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Tipo</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Fecha</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {paginated.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><input type="checkbox" checked={selected.includes(doc.id)} onChange={() => toggleOne(doc.id)} /></td>
                  <td className="px-6 py-4 font-medium text-gray-900">{doc.title}</td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{doc.type === 'organizer' ? 'Privado' : 'Público'}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{new Date(doc.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-gray-400 hover:text-red-600"><FaTrash /></button>
                    </div>
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

export default AdminDocuments;