import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { exportInfo } from '../../../utils/exportInfo';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import { FaTrash, FaFileExport, FaSearch } from 'react-icons/fa';

function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exportFormat, setExportFormat] = useState('csv');
  const itemsPerPage = 10;

  const fetchSubscribers = async () => {
    try {
      const res = await api.get('/subscribers');
      setSubscribers(res.data);
    } catch (error) {
      toast.error('Error al cargar suscriptores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubscribers(); }, []);

  const handleDeleteSelected = () => { if (selected.length === 0) return; setDeleteTarget(selected); setShowDeleteModal(true); };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/subscribers/${id}`)));
      toast.success(`${ids.length} suscriptor(es) eliminado(s)`);
      setSelected([]);
      fetchSubscribers();
    } catch (error) { toast.error('Error al eliminar'); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  };

  const filtered = subscribers.filter(sub => {
    if (searchTerm && !sub.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterStatus && sub.status !== filterStatus) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const total = subscribers.length;
  const activeCount = subscribers.filter(s => s.status === 'active').length;
  const unsubscribedCount = total - activeCount;

  const exportCSV = () => {
    const headers = ['email', 'status', 'subscribedAt'];
    const data = filtered.map(s => ({
      email: s.email,
      status: s.status === 'active' ? 'Activo' : 'Desuscrito',
      subscribedAt: new Date(s.subscribedAt).toLocaleDateString()
    }));
    exportInfo(data, headers, 'suscriptores', exportFormat);
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelected(paginated.map(s => s.id));
    else setSelected([]);
  };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout title="Suscriptores">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar suscriptor"
        message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} suscriptores seleccionados?` : '¿Eliminar este suscriptor?')}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-300 px-4 py-2.5 mb-6 flex items-center gap-6 text-sm">
        <button onClick={() => { setFilterStatus(''); setCurrentPage(1); }} className="flex items-center gap-1.5 hover:text-fuchsia-700 transition-colors group">
          <span className="text-xs text-gray-500 group-hover:text-fuchsia-600">Total</span>
          <span className="font-bold text-gray-800 group-hover:text-fuchsia-700">{total}</span>
        </button>
        <button onClick={() => { setFilterStatus('active'); setCurrentPage(1); }} className="flex items-center gap-1.5 hover:text-fuchsia-700 transition-colors group">
          <span className="text-xs text-gray-500 group-hover:text-fuchsia-600">Activos</span>
          <span className="font-bold text-gray-800 group-hover:text-fuchsia-700">{activeCount}</span>
        </button>
        <button onClick={() => { setFilterStatus('unsubscribed'); setCurrentPage(1); }} className="flex items-center gap-1.5 hover:text-fuchsia-700 transition-colors group">
          <span className="text-xs text-gray-500 group-hover:text-fuchsia-600">Desuscritos</span>
          <span className="font-bold text-gray-800 group-hover:text-fuchsia-700">{unsubscribedCount}</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
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
              placeholder="Buscar email..."
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
          <button onClick={exportCSV} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors" title="Exportar">
            <FaFileExport className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron suscriptores</p>
          <p className="text-sm">Prueba a cambiar los filtros.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-purple-100 text-sm">
            <thead className="bg-fuchsia-50 text-fuchsia-800 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-left">Acciones</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Estado</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Fecha suscripción</th>
                <th className="px-6 py-3 text-right w-10">
                  <input type="checkbox" onChange={toggleSelectAll} checked={paginated.length > 0 && selected.length === paginated.length} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100">
              {paginated.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {/* Sin acciones individuales */}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{sub.email}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {sub.status === 'active' ? 'Activo' : 'Desuscrito'}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{new Date(sub.subscribedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <input type="checkbox" checked={selected.includes(sub.id)} onChange={() => toggleOne(sub.id)} />
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

export default AdminSubscribers;