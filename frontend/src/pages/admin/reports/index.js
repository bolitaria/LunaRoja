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

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const itemsPerPage = 10;

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (error) {
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = (id) => { setDeleteTarget(id); setShowDeleteModal(true); };
  const handleDeleteSelected = () => { if (selected.length === 0) return; setDeleteTarget(selected); setShowDeleteModal(true); };
  const executeDelete = async () => {
    const ids = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    try {
      await Promise.all(ids.map(id => api.delete(`/reports/${id}`)));
      toast.success(`${ids.length} reporte(s) eliminado(s)`);
      setSelected([]);
      fetchReports();
    } catch (error) { toast.error('Error al eliminar'); }
    finally { setShowDeleteModal(false); setDeleteTarget(null); }
  };

  const exportSelectedCSV = () => {
    const selectedReports = reports.filter(r => selected.includes(r.id));
    const headers = ['title', 'description', 'publishedAt', 'fileUrl'];
    const data = selectedReports.map(r => ({
      title: r.title,
      description: r.description || '',
      publishedAt: new Date(r.publishedAt).toLocaleDateString(),
      fileUrl: r.fileUrl || 'Sin archivo'
    }));
    downloadCSV(data, headers, 'reportes_seleccionados.csv');
  };

  const filtered = reports.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = (e) => { if (e.target.checked) setSelected(paginated.map(r => r.id)); else setSelected([]); };
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const exportToCSV = () => {
    const headers = ['title', 'description', 'publishedAt', 'fileUrl'];
    const data = filtered.map(r => ({
      title: r.title,
      description: r.description || '',
      publishedAt: new Date(r.publishedAt).toLocaleDateString(),
      fileUrl: r.fileUrl || 'Sin archivo'
    }));
    downloadCSV(data, headers, 'reportes.csv');
  };

  const isSuperAdmin = user && user.role === 'superadmin';

  return (
    <AdminLayout title="Reportes">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar reporte"
        message={deleteTarget && (Array.isArray(deleteTarget) ? `¿Eliminar ${deleteTarget.length} reportes seleccionados?` : '¿Eliminar este reporte?')}
        onConfirm={executeDelete}
        onCancel={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
      />

      {/* Métricas */}
      <div className="bg-gray-50/80 rounded-lg px-4 py-2.5 mb-6 flex items-center gap-6 text-sm border border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Total</span>
          <span className="font-bold text-gray-800">{reports.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Con archivo</span>
          <span className="font-bold text-gray-800">{reports.filter(r => r.fileUrl).length}</span>
        </div>
      </div>

      {/* Fila de acciones: Nuevo Reporte (misma posición que en acciones) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Link href="/admin/reports/new" className="inline-flex items-center gap-1.5 text-sm border border-fuchsia-300 text-fuchsia-700 bg-white px-3 py-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors shadow-sm">
              Nuevo Reporte
            </Link>
          )}
          {selected.length > 0 && (
            <>
              <button onClick={exportSelectedCSV} className="inline-flex items-center gap-1 text-sm border border-gray-300 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
                <FaFileExport className="w-3.5 h-3.5" /> Exportar ({selected.length})
              </button>
              <button onClick={handleDeleteSelected} className="inline-flex items-center gap-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors">
                <FaTrash /> Eliminar ({selected.length})
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-fuchsia-400 text-sm w-48"
            />
          </div>
          <button onClick={exportToCSV} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors" title="Exportar CSV">
            <FaFileExport className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-gray-500 text-sm">Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No se encontraron reportes</p>
          <p className="text-sm">Prueba a cambiar los filtros o crea un nuevo reporte.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left w-10">
                  <input type="checkbox" onChange={toggleSelectAll} checked={paginated.length > 0 && selected.length === paginated.length} className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-3 text-left">Título</th>
                <th className="px-6 py-3 text-left hidden sm:table-cell">Descripción</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Fecha</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Archivo</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(report => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selected.includes(report.id)} onChange={() => toggleOne(report.id)} className="rounded border-gray-300" />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{report.title}</td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{report.description?.substring(0, 80)}{report.description?.length > 80 ? '...' : ''}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{new Date(report.publishedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {report.fileUrl ? (
                      <a href={report.fileUrl} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                        Ver archivo
                      </a>
                    ) : (
                      <span className="text-gray-400">Sin archivo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/reports/${report.id}`} className="p-1.5 text-gray-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors" title="Editar">
                        <FaEdit className="w-5 h-5" />
                      </Link>
                      {isSuperAdmin && (
                        <button onClick={() => handleDelete(report.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
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

export default AdminReports;