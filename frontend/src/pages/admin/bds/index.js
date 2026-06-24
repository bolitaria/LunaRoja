import api from '../../../lib/axios';
import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { downloadCSV } from '../../../utils/exportCsv';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import { FaEdit, FaTrash, FaFileExport, FaSearch } from 'react-icons/fa';

function AdminBDS() {
  const [bdsList, setBdsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = 10;

  const fetchBDS = async () => {
    try {
      const res = await api.get('/bds');
      setBdsList(res.data);
    } catch (error) {
      toast.error('Error al cargar BDS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBDS(); }, []);

  const handleDelete = (id) => { setDeleteTarget(id); setShowDeleteModal(true); };
  const handleDeleteSelected = () => { if (selected.length === 0) return; setDeleteTarget(selected); setShowDeleteModal(true); };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/bds/${id}`)));
      toast.success(`${ids.length} BDS eliminada(s)`);
      setSelected([]); fetchBDS();
    } catch (error) { toast.error('Error al eliminar'); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  };

  const filtered = bdsList.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = (e) => { if (e.target.checked) setSelected(paginated.map(b => b.id)); else setSelected([]); };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const isSuperAdmin = user && user.role === 'superadmin';

  return (
    <AdminLayout title="BDS">
      <ToastContainer />
      <ConfirmModal isOpen={showDeleteModal} title="Eliminar BDS" message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} BDS seleccionadas?` : '¿Eliminar esta BDS?')} onConfirm={executeDelete} onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }} />
      <div className="bg-gray-50/80 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-6 text-sm border border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Total</span>
          <span className="font-bold text-gray-800">{bdsList.length}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Link href="/admin/bds/new" className="inline-flex items-center gap-1.5 text-sm border border-fuchsia-300 text-fuchsia-700 bg-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors shadow-sm">
              Nueva BDS
            </Link>
          )}
          {selected.length > 0 && (
            <button onClick={handleDeleteSelected} className="inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
              <FaTrash /> Eliminar ({selected.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Buscar…" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-48" />
          </div>
          <button onClick={() => downloadCSV(filtered.map(b => ({ name: b.name, description: b.description || '' })), ['name', 'description'], 'bds.csv')} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors" title="Exportar CSV">
            <FaFileExport className="w-4 h-4" />
          </button>
        </div>
      </div>
      {loading ? <p className="text-gray-500 text-sm">Cargando…</p> : filtered.length === 0 ? <div className="text-center py-12 text-gray-400"><p className="text-lg mb-2">No se encontraron BDS</p><p className="text-sm">Crea una nueva BDS.</p></div> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left w-10"><input type="checkbox" onChange={toggleSelectAll} checked={paginated.length > 0 && selected.length === paginated.length} className="rounded border-gray-300" /></th>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Descripción</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(bds => (
                <tr key={bds.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4"><input type="checkbox" checked={selected.includes(bds.id)} onChange={() => toggleOne(bds.id)} className="rounded border-gray-300" /></td>
                  <td className="px-6 py-4 font-medium text-gray-900">{bds.name}</td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{bds.description?.substring(0, 80)}{bds.description?.length > 80 ? '...' : ''}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/bds/${bds.id}`} className="p-1.5 text-gray-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors" title="Editar">
                        <FaEdit className="w-5 h-5" />
                      </Link>
                      {isSuperAdmin && (
                        <button onClick={() => handleDelete(bds.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                          <FaTrash className="w-5 h-5" />
                        </button>
                      )}
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

export default AdminBDS;