import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { withAuth } from '../../../lib/auth';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { downloadCSV } from '../../../utils/exportCsv';
import Pagination from '../../../components/Pagination';
import ConfirmModal from '../../../components/ConfirmModal';
import { FaEdit, FaTrash, FaFileExport, FaSearch, FaPlus } from 'react-icons/fa';

function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = 10;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
      setCampaigns(res.data);
    } catch (error) { toast.error('Error al cargar campañas'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchCampaigns(); }, []);

  const handleDelete = (id) => { setDeleteTarget(id); setShowDeleteModal(true); };
  const handleDeleteSelected = () => { if (selected.length === 0) return; setDeleteTarget(selected); setShowDeleteModal(true); };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${id}`, { headers: { Authorization: `Bearer ${token}` } })));
      toast.success(`${ids.length} campaña(s) eliminada(s)`);
      setSelected([]); fetchCampaigns();
    } catch (error) { toast.error('Error al eliminar'); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  };

  const filtered = campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCSV = () => {
    const headers = ['name', 'color', 'description', 'createdAt'];
    const data = filtered.map(c => ({ name: c.name, color: c.color, description: c.description || '', createdAt: new Date(c.createdAt).toLocaleDateString() }));
    downloadCSV(data, headers, 'campanas.csv');
  };

  const toggleSelectAll = (e) => { if (e.target.checked) setSelected(paginated.map(c => c.id)); else setSelected([]); };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AdminLayout title="Campañas">
      <ToastContainer />
      <ConfirmModal isOpen={showDeleteModal} title="Eliminar campaña" message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} campañas seleccionadas?` : '¿Eliminar esta campaña?')} onConfirm={executeDelete} onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }} />

      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Total', value: campaigns.length, color: 'bg-indigo-100 text-indigo-800' },
          { label: 'Activas', value: campaigns.length, color: 'bg-green-100 text-green-800' },
        ].map((m, i) => (
          <div key={i} className={`rounded-xl p-4 ${m.color} flex flex-col`}>
            <span className="text-sm font-medium">{m.label}</span>
            <span className="text-2xl font-bold">{m.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {user && user.role === 'superadmin' && (
            <Link href="/admin/campaigns/new" className="inline-flex items-center gap-1.5 text-sm border border-fuchsia-300 text-fuchsia-700 bg-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors">
              <FaPlus className="w-3.5 h-3.5" /> Nueva Campaña
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
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-48" />
          </div>
          <button onClick={exportCSV} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
            <FaFileExport className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>

      {loading ? <p className="text-gray-500 text-sm">Cargando...</p> : filtered.length === 0 ? <p className="text-gray-500 text-sm">No se encontraron campañas.</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left w-10"><input type="checkbox" onChange={toggleSelectAll} checked={paginated.length > 0 && selected.length === paginated.length} /></th>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Color</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Descripción</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleOne(c.id)} /></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: c.color }} /><span className="font-medium text-gray-900">{c.name}</span></div></td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{c.color}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500 max-w-xs truncate">{c.description || '-'}</td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2"><Link href={`/admin/campaigns/${c.id}/edit`} className="text-gray-400 hover:text-fuchsia-600 transition-colors"><FaEdit /></Link><button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-600 transition-colors"><FaTrash /></button></div></td>
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

export default withAuth(AdminCampaigns);